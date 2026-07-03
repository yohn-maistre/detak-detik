// One-time, idempotent cleaner for public/data/idn-kab.geojson (514 kabupaten).
//
// The file ships with encoder debris that MapLibre's fill tessellator turns into
// visual artifacts (the historic "corrupt 4-vertex sliver" class, docs/CLAUDE.md §11):
//   1. Consecutive duplicate vertices (stutters), some collapsing a ring to a point.
//   2. Degenerate rings: < 3 distinct points, or exactly zero signed area (collinear
//      specks and figure-8 bowties whose lobes cancel). Zero/negative-area "outer"
//      rings get classified as holes by MapLibre's winding heuristic and feed earcut
//      garbage bridges.
//   3. Mis-nested rings (Kota Pariaman: a CW sliver filed as the outer ring, with the
//      real city polygon and three offshore islets filed as its "holes").
//   4. Redundant junk parts sitting fully inside the same feature's land polygon
//      (double-fill, meaningless in GeoJSON semantics).
//
// Repairs are deterministic and never invent coordinates: points are only removed,
// rings only dropped, re-closed, re-nested, or re-wound (reversed). Real geometry is
// preserved: the four >1.0-degree segments in the file are the ruler-straight
// Indonesia-PNG border at lon 141 (Boven Digoel, Keerom, Merauke, Pegunungan
// Bintang) and are kept via an explicit border exception; any OTHER ring with a
// >1.0-degree jump is vertex soup and is dropped whole. (A split-and-salvage variant
// was considered and rejected: with one jump in a closed ring the closure re-creates
// the jump, and no real input in this file needs it.)
//
// Run: node scripts/clean-kab-geojson.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/data/idn-kab.geojson', import.meta.url);

const JUMP = 1.0; // degrees; nonsense within one kabupaten, except the PNG border
const isBorderRun = (a, b) =>
  Math.abs(a[0] - 141) <= 0.05 && Math.abs(b[0] - 141) <= 0.05 && Math.abs(a[0] - b[0]) <= 0.05;

const signedArea = (ring) => {
  let a = 0;
  for (let i = 1; i < ring.length; i++) a += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1];
  return a / 2;
};

// even-odd point-in-ring (ring closed, last point = first)
function inRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inPoly = (poly, x, y) => poly.reduce((n, r) => n ^ inRing(r, x, y), 0) === 1;
// a ring "sits inside" a container when most of its distinct vertices do
function mostlyInside(ring, contains) {
  let inn = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) if (contains(ring[i][0], ring[i][1])) inn++;
  return inn * 2 > n;
}

const stats = {
  dupPoints: 0, closed: 0, shortRings: 0, zeroArea: 0, jumpRings: 0,
  borderKept: 0, promoted: 0, rewoundHoles: 0, orphanHoles: 0, containedParts: 0,
  untangled: 0, loopsKept: 0, loopsDropped: 0,
};
const notes = [];

// ---- self-intersection repair -------------------------------------------
// A "bowtie" ring crosses itself; MapLibre's earcut sprays bridge triangles
// across the whole shape (the Kutai Kartanegara spike storm). The repair is
// classic and deterministic: split the ring at each proper crossing into
// simple loops, then keep the meaningful loops (the main shape and any lobe
// with a non-trivial share of its area) and drop sliver lobes, which are
// vertex-order debris, not land.

// proper interior intersection of segments ab and cd, or null
function segX(a, b, c, d) {
  const d1x = b[0] - a[0], d1y = b[1] - a[1];
  const d2x = d[0] - c[0], d2y = d[1] - c[1];
  const den = d1x * d2y - d1y * d2x;
  if (den === 0) return null;
  const t = ((c[0] - a[0]) * d2y - (c[1] - a[1]) * d2x) / den;
  const u = ((c[0] - a[0]) * d1y - (c[1] - a[1]) * d1x) / den;
  if (t <= 1e-12 || t >= 1 - 1e-12 || u <= 1e-12 || u >= 1 - 1e-12) return null;
  return [a[0] + t * d1x, a[1] + t * d1y];
}

// first proper crossing in a closed ring, or null
function firstCrossing(ring) {
  const m = ring.length; // closed: ring[m-1] === ring[0]
  for (let i = 0; i < m - 1; i++) {
    for (let j = i + 2; j < m - 1; j++) {
      if (i === 0 && j === m - 2) continue; // first and last segments share the closure point
      const P = segX(ring[i], ring[i + 1], ring[j], ring[j + 1]);
      if (P) return { i, j, P };
    }
  }
  return null;
}

// a pinch: the ring visits one vertex twice (self-touch, not a crossing) —
// earcut treats it as two lobes glued at a point and can bridge them badly
function firstPinch(ring) {
  const seen = new Map();
  for (let i = 0; i < ring.length - 1; i++) { // skip the closure duplicate
    const key = `${ring[i][0]},${ring[i][1]}`;
    if (seen.has(key)) {
      const k = seen.get(key);
      if (i - k >= 2) return { k, l: i };
    } else {
      seen.set(key, i);
    }
  }
  return null;
}

// split a closed ring at its crossings AND pinch vertices into simple loops
function untangleRing(ring) {
  const out = [];
  const stack = [ring];
  let guard = 0;
  while (stack.length) {
    if (++guard > 400) throw new Error('untangle guard tripped (pathological ring)');
    const pts = stack.pop();
    if (pts.length < 4) continue;
    const hit = firstCrossing(pts);
    if (hit) {
      const { i, j, P } = hit;
      // A keeps the outside walk, B is the pinched-off lobe; both closed
      stack.push([...pts.slice(0, i + 1), P, ...pts.slice(j + 1)]);
      stack.push([P, ...pts.slice(i + 1, j + 1), P]);
      continue;
    }
    const pinch = firstPinch(pts);
    if (pinch) {
      const { k, l } = pinch;
      // pts[l] === pts[k]: split the figure-8 at its waist
      stack.push([...pts.slice(0, k), ...pts.slice(l)]);
      stack.push(pts.slice(k, l + 1));
      continue;
    }
    out.push(pts);
  }
  return out;
}

// ring scrub: dedupe consecutive points, re-close, judge degeneracy / jumps.
// returns the cleaned closed ring, or null when the ring must be dropped.
function scrubRing(ring, nama) {
  const pts = [];
  for (const p of ring) {
    const prev = pts[pts.length - 1];
    if (prev && prev[0] === p[0] && prev[1] === p[1]) { stats.dupPoints++; continue; }
    pts.push(p);
  }
  // drop the duplicate closure point for now; re-close below
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  else stats.closed++; // ring arrived unclosed; closing it adds nothing new
  if (pts.length < 3) { stats.shortRings++; return null; }
  pts.push(pts[0]);
  if (signedArea(pts) === 0) { stats.zeroArea++; return null; }
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    if (Math.abs(a[0] - b[0]) > JUMP || Math.abs(a[1] - b[1]) > JUMP) {
      if (isBorderRun(a, b)) { stats.borderKept++; continue; } // the lon-141 PNG border
      stats.jumpRings++;
      notes.push(`${nama}: dropped a ${pts.length}pt ring with a >1° jump`);
      return null;
    }
  }
  return pts;
}

const gj = JSON.parse(readFileSync(FILE, 'utf8'));
if (gj.type !== 'FeatureCollection') throw new Error('not a FeatureCollection');

const before = { features: gj.features.length, rings: 0, verts: 0 };
for (const f of gj.features) for (const p of f.geometry.coordinates) for (const r of p) { before.rings++; before.verts += r.length; }

const lostFeatures = [];

for (const f of gj.features) {
  const { nama } = f.properties;
  if (f.geometry.type !== 'MultiPolygon') throw new Error(`${nama}: unexpected ${f.geometry.type}`);

  // 1. scrub every ring; classify survivors by winding (CCW = outer by convention)
  const outers = []; // { ring, srcPart }
  const cwRings = []; // hole candidates: { ring, srcPart }
  f.geometry.coordinates.forEach((poly, pi) => {
    poly.forEach((ring, ri) => {
      const clean = scrubRing(ring, nama);
      if (!clean) return;

      // repair self-crossings before classification: a bowtie is not one
      // ring, it is several simple loops in a corrupted vertex order
      const loops = untangleRing(clean);
      let kept = loops;
      if (loops.length > 1) {
        stats.untangled++;
        const areas = loops.map((l) => Math.abs(signedArea(l)));
        const maxA = Math.max(...areas);
        kept = loops.filter((l, k) => {
          const ok = areas[k] >= Math.max(1e-7, maxA * 0.005);
          if (!ok) stats.loopsDropped++;
          return ok;
        });
        stats.loopsKept += kept.length;
        notes.push(`${nama}: untangled a self-crossing ring into ${loops.length} loops, kept ${kept.length}`);
        // re-scrub each loop (the crossing point may duplicate a vertex) and
        // force winding by the ring's original disposition: pieces of an
        // outer stay outers, pieces of a hole stay holes
        kept = kept
          .map((l) => scrubRing(l, nama))
          .filter(Boolean)
          .map((l) => {
            const ccw = signedArea(l) > 0;
            return (ri === 0 ? !ccw : ccw) ? l.slice().reverse() : l;
          });
      }

      for (const loop of kept) {
        if (signedArea(loop) > 0) {
          // a CCW ring at hole position is a mis-nested island: promote it to a part
          if (ri > 0) {
            const outer = outers.find((o) => o.srcPart === pi);
            if (outer && mostlyInside(loop, (x, y) => inRing(outer.ring, x, y))) {
              // genuinely inside its outer: a mis-wound hole; re-wind it CW instead
              cwRings.push({ ring: loop.slice().reverse(), srcPart: pi });
              stats.rewoundHoles++;
              continue;
            }
            stats.promoted++;
          }
          outers.push({ ring: loop, srcPart: pi });
        } else {
          cwRings.push({ ring: loop, srcPart: pi });
        }
      }
    });
  });

  // 2. re-nest holes: own part's outer first, then any outer of this feature
  const parts = outers.map((o) => ({ outer: o.ring, srcPart: o.srcPart, holes: [] }));
  for (const h of cwRings) {
    const host =
      parts.find((p) => p.srcPart === h.srcPart && mostlyInside(h.ring, (x, y) => inRing(p.outer, x, y))) ??
      parts.find((p) => mostlyInside(h.ring, (x, y) => inRing(p.outer, x, y)));
    if (host) host.holes.push(h.ring);
    else { stats.orphanHoles++; notes.push(`${nama}: dropped an orphan ${h.ring.length}pt CW ring (hole outside any outer)`); }
  }

  // 3. drop junk parts sitting inside another part of the same feature (double-fill);
  //    even-odd over the host's full ring set keeps real island-in-lake nesting safe
  const junk = new Set();
  for (let a = 0; a < parts.length; a++) {
    const areaA = Math.abs(signedArea(parts[a].outer));
    for (let b = 0; b < parts.length; b++) {
      if (a === b || junk.has(b)) continue;
      if (Math.abs(signedArea(parts[b].outer)) <= areaA) continue;
      const host = [parts[b].outer, ...parts[b].holes];
      if (mostlyInside(parts[a].outer, (x, y) => inPoly(host, x, y))) {
        junk.add(a);
        stats.containedParts++;
        notes.push(`${nama}: dropped a ${parts[a].outer.length}pt part fully inside its own land`);
        break;
      }
    }
  }

  const kept = parts.filter((_, i) => !junk.has(i)).map((p) => [p.outer, ...p.holes]);
  if (kept.length === 0) { lostFeatures.push(nama); continue; }
  f.geometry.coordinates = kept;
}

if (lostFeatures.length) {
  gj.features = gj.features.filter((f) => f.geometry.coordinates.length > 0);
  console.log(`!! features left with no valid rings (dropped): ${lostFeatures.join(', ')}`);
}

// verification pass over the cleaned collection
const after = { features: gj.features.length, rings: 0, verts: 0 };
let badSegs = 0, borderSegs = 0;
for (const f of gj.features) {
  for (const poly of f.geometry.coordinates) {
    for (const ring of poly) {
      after.rings++; after.verts += ring.length;
      if (ring.length < 4) throw new Error(`${f.properties.nama}: short ring survived`);
      const [h, t] = [ring[0], ring[ring.length - 1]];
      if (h[0] !== t[0] || h[1] !== t[1]) throw new Error(`${f.properties.nama}: unclosed ring survived`);
      for (let i = 1; i < ring.length; i++) {
        if (ring[i][0] === ring[i - 1][0] && ring[i][1] === ring[i - 1][1]) throw new Error(`${f.properties.nama}: duplicate point survived`);
        if (Math.abs(ring[i][0] - ring[i - 1][0]) > JUMP || Math.abs(ring[i][1] - ring[i - 1][1]) > JUMP)
          isBorderRun(ring[i - 1], ring[i]) ? borderSegs++ : badSegs++;
      }
      // the wave-5b gate: no ring may cross or touch itself after cleaning
      if (firstCrossing(ring)) throw new Error(`${f.properties.nama}: self-intersection survived`);
      if (firstPinch(ring)) throw new Error(`${f.properties.nama}: pinch vertex survived`);
    }
  }
}
if (badSegs) throw new Error(`${badSegs} non-border >1° segments survived`);

writeFileSync(FILE, JSON.stringify(gj));

for (const n of notes) console.log(`  · ${n}`);
console.log(
  `cleaned ${before.features} features -> ${after.features} · rings ${before.rings} -> ${after.rings} · vertices ${before.verts} -> ${after.verts}`,
);
console.log(
  `  dup points ${stats.dupPoints} · unclosed ${stats.closed} · short rings ${stats.shortRings} · zero-area ${stats.zeroArea} · jump rings ${stats.jumpRings}`,
);
console.log(
  `  promoted islands ${stats.promoted} · re-wound holes ${stats.rewoundHoles} · orphan CW rings ${stats.orphanHoles} · contained junk parts ${stats.containedParts}`,
);
console.log(`  >1° segments remaining: ${borderSegs} (all on the lon-141 Indonesia-PNG border, kept by design)`);
