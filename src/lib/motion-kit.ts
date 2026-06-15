/**
 * motion-kit: the GSAP micro-motion vocabulary the components share. One
 * engine, reduced-motion aware. Aksara's "pointing" is a gentle scroll only;
 * the real way it surfaces context is by rendering data (map + charts), not by
 * drawing boxes on the page.
 */
import { gsap, reducedMotion } from './motion';

const refEl = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-ref="${CSS.escape(id)}"]`) ?? document.getElementById(id);

/** Bring a component into view (no overlay). */
export function pulseRef(id: string, scroll = true): void {
  if (!scroll) return;
  refEl(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
}

/** Count a number element up to its value on reveal. */
export function countUp(el: HTMLElement, to: number, fmt: (n: number) => string, dur = 1.5): void {
  if (reducedMotion()) {
    el.textContent = fmt(to);
    return;
  }
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } });
}
