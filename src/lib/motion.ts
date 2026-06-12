/**
 * One motion engine, one easing vocabulary. GSAP (free since the Webflow
 * acquisition) handles orchestrated motion; ambient motion stays in CSS.
 * Transforms and opacity only. Reduced motion collapses to instant states.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const EASE_PRESS = 'power4.inOut';
export const EASE_SETTLE = 'power3.out';
export const EASE_STAMP = 'back.out(2.2)';

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger };
