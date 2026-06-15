/**
 * motion-kit: the GSAP micro-motion vocabulary Aksara and the components share.
 * One engine, reduced-motion aware. The marquee piece is pulseRef: the agent
 * reaches into the page, scrolls to a component, rings it, and draws a hairline
 * connector from its pill to the thing it is talking about.
 */
import { gsap, reducedMotion } from './motion';

const refEl = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-ref="${CSS.escape(id)}"]`) ?? document.getElementById(id);

/** Ring + connector a component so Aksara can point at what it cites. */
export function pulseRef(id: string, scroll = true): void {
  const el = refEl(id);
  if (!el) return;
  if (scroll) {
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    window.setTimeout(() => halo(el), reducedMotion() ? 0 : 480);
  } else {
    halo(el);
  }
}

function halo(el: HTMLElement): void {
  const ring = document.createElement('div');
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  const place = () => {
    const r = el.getBoundingClientRect();
    // clamp to the viewport so a tall section rings its visible portion
    const top = Math.max(10, r.top - 7);
    const left = Math.max(10, r.left - 7);
    const bottom = Math.min(window.innerHeight - 10, r.bottom + 7);
    const right = Math.min(window.innerWidth - 10, r.right + 7);
    Object.assign(ring.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.max(0, right - left)}px`,
      height: `${Math.max(0, bottom - top)}px`,
      border: '1.5px solid var(--accent)',
      borderRadius: '3px',
      pointerEvents: 'none',
      zIndex: '120',
    });
  };
  place();
  if (reducedMotion()) {
    window.setTimeout(() => ring.remove(), 1000);
    return;
  }
  gsap.fromTo(ring, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', transformOrigin: 'center', onUpdate: place });
  gsap.to(ring, { opacity: 0, duration: 0.6, delay: 1.5, onComplete: () => ring.remove() });
  connectFromPill(el);
}

function connectFromPill(el: HTMLElement): void {
  const pill = document.querySelector<HTMLElement>('.aksara .pill');
  if (!pill || reducedMotion()) return;
  const pr = pill.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const x1 = pr.left + pr.width / 2;
  const y1 = pr.top;
  const x2 = er.left + Math.min(er.width / 2, 48);
  const y2 = Math.min(Math.max(er.top + er.height / 2, 60), window.innerHeight - 60);
  const mx = (x1 + x2) / 2;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  Object.assign(svg.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '119' });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--accent)');
  path.setAttribute('stroke-width', '1');
  path.setAttribute('stroke-dasharray', '3 4');
  svg.appendChild(path);
  document.body.appendChild(svg);
  const len = path.getTotalLength();
  gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
  gsap.to(svg, { opacity: 0, duration: 0.5, delay: 1.4, onComplete: () => svg.remove() });
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
