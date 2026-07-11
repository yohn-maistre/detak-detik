/**
 * Central scroll lock. Lenis virtualizes the wheel for the whole document,
 * so overlays (lembar kliping, peta dossier, loader) must pause it — a plain
 * `overflow: hidden` on <body> is not enough. Choreo registers the Lenis
 * instance here; islands ask for a lock without importing the choreography.
 * Locks are counted so nested overlays release cleanly.
 */
type LenisLike = { stop(): void; start(): void };

let inst: LenisLike | null = null;
let locks = 0;

export function registerLenis(l: LenisLike | null) {
  inst = l;
}

export function lockScroll() {
  locks += 1;
  if (locks === 1) {
    inst?.stop();
    document.body.style.overflow = 'hidden';
  }
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    inst?.start();
    document.body.style.overflow = '';
  }
}
