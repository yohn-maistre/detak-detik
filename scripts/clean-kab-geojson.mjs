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
};
const notes = [];

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
      if (signedArea(clean) > 0) {
        // a CCW ring at hole position is a mis-nested island: promote it to a part
        if (ri > 0) {
          const outer = poly[0] && outers.find((o) => o.srcPart === pi);
          if (outer && mostlyInside(clean, (x, y) => inRing(outer.ring, x, y))) {
            // genuinely inside its outer: a mis-wound hole; re-wind it CW instead
            cwRings.push({ ring: clean.slice().reverse(), srcPart: pi });
            stats.rewoundHoles++;
            return;
          }
          stats.promoted++;
        }
        outers.push({ ring: clean, srcPart: pi });
      } else {
        cwRings.push({ ring: clean, srcPart: pi });
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
