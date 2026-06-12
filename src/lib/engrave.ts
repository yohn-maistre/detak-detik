/**
 * The engraved Nusantara plate, parameterized per register. Hatched land,
 * stippled sea, faint graticule — the fallback that never lets a map frame
 * go blank, and the permanent plate of the archive act.
 */
import { GRID_COLS, GRID_ROWS, field } from './nusantara';

export interface EngraveInk {
  paper: string;
  sea: string;
  hatch: string;
  coast: string;
  grid: string;
  caption?: string;
}

export const ENGRAVE_ATLAS: EngraveInk = {
  paper: '#ece1c9',
  sea: 'rgba(76, 122, 94, 0.30)',
  hatch: 'rgba(42, 36, 28, 0.5)',
  coast: '#4c7a5e',
  grid: 'rgba(42, 36, 28, 0.14)',
};

export const ENGRAVE_DINAS: EngraveInk = {
  paper: '#d6cbac',
  sea: 'rgba(21, 19, 14, 0.22)',
  hatch: 'rgba(21, 19, 14, 0.5)',
  coast: '#b3430a',
  grid: 'rgba(21, 19, 14, 0.13)',
};

export function drawEngraving(canvas: HTMLCanvasElement, ink: EngraveInk): void {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = ink.paper;
  ctx.fillRect(0, 0, w, h);

  const scale = Math.min((w * 0.92) / GRID_COLS, (h * 0.92) / GRID_ROWS);
  const ox = (w - GRID_COLS * scale) / 2;
  const oy = (h - GRID_ROWS * scale) / 2;
  const g = (px: number, py: number) => field((px - ox) / scale, (py - oy) / scale);

  // stippled sea
  ctx.fillStyle = ink.sea;
  for (let py = 4; py < h; py += 11) {
    for (let px = ((py / 11) % 2) * 5 + 3; px < w; px += 11) {
      if (g(px, py) < 0.3) ctx.fillRect(px, py, 1.1, 1.1);
    }
  }

  // hatched land: 45° strokes clipped to the field
  ctx.strokeStyle = ink.hatch;
  ctx.lineWidth = 0.7;
  for (let d = -h; d < w + h; d += 4.5) {
    let pen = false;
    ctx.beginPath();
    for (let t = 0; t <= h; t += 2) {
      const px = d + t;
      const py = t;
      if (px < 0 || px > w) continue;
      const land = g(px, py) > 0.45;
      if (land && !pen) { ctx.moveTo(px, py); pen = true; }
      else if (land && pen) { ctx.lineTo(px, py); }
      else if (!land && pen) { pen = false; }
    }
    ctx.stroke();
  }

  // coastline band
  ctx.fillStyle = ink.coast;
  for (let py = 0; py < h; py += 1.6) {
    for (let px = 0; px < w; px += 1.6) {
      const v = g(px, py);
      if (v > 0.42 && v < 0.49) ctx.fillRect(px, py, 1.2, 1.2);
    }
  }

  // graticule
  ctx.strokeStyle = ink.grid;
  ctx.lineWidth = 0.6;
  for (let i = 1; i < 6; i++) {
    const px = (w / 6) * i;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    const py = (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
  }

  if (ink.caption) {
    ctx.font = '10px Geist Mono, monospace';
    ctx.fillStyle = ink.hatch;
    ctx.fillText(ink.caption, 14, h - 14);
  }
}

/** Project lon/lat into the engraving's grid space (rough linear fit of the
    ellipse-field layout: 95–141°E across, 6°N–11°S down). */
export function lonLatToGrid(lon: number, lat: number): [number, number] {
  const gx = ((lon - 95) / (141 - 95)) * GRID_COLS;
  const gy = ((6 - lat) / (6 + 11)) * GRID_ROWS;
  return [gx, gy];
}
