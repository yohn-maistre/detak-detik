/**
 * The archipelago as a field function: rough rotated-ellipse lobes for the
 * major islands in a 168×60 grid space. One source of truth shared by the
 * dither plate (Mesin) and the atlas engraving fallback (Atlas Lama).
 */
export const GRID_COLS = 168;
export const GRID_ROWS = 60;

/** [cx, cy, rx, ry, rot] in grid space */
export const ISLANDS: [number, number, number, number, number][] = [
  [22, 22, 16, 5.5, 0.8],   // Sumatra
  [52, 38, 17, 3.2, 0.08],  // Jawa
  [55, 18, 13, 9, 0.15],    // Kalimantan
  [83, 22, 4, 8, 0.25],     // Sulawesi torso
  [88, 16, 7, 2.6, 0.9],    // Sulawesi utara arm
  [90, 28, 6, 2.2, -0.7],   // Sulawesi tenggara arm
  [80, 40, 5, 1.6, 0.05],   // Bali–Nusa Tenggara
  [95, 41, 7, 1.7, 0.06],   // NTT chain
  [108, 24, 3, 2.2, 0.3],   // Maluku
  [113, 31, 2.4, 1.8, -0.4],
  [140, 30, 22, 11, 0.12],  // Papua
];

/** Signed landness 0..1 at a grid coordinate. */
export function field(cx: number, cy: number): number {
  let v = 0;
  for (const [ix, iy, rx, ry, rot] of ISLANDS) {
    const dx = cx - ix;
    const dy = cy - iy;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const u = (dx * c + dy * s) / rx;
    const w = (-dx * s + dy * c) / ry;
    const d = u * u + w * w;
    v = Math.max(v, Math.max(0, 1 - d));
  }
  return v;
}
