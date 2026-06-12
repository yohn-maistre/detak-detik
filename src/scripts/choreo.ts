/**
 * The page choreography: loader ceremony, the register morph between acts,
 * headline reveals, stamps, odometer, and the fidget layer.
 * Everything scroll-linked runs through one ScrollTrigger vocabulary.
 * Reduced motion: instant states, zero performance.
 */
import { gsap, ScrollTrigger, EASE_PRESS, EASE_SETTLE, EASE_STAMP, reducedMotion } from '../lib/motion';

type Palette = Record<'--bg' | '--card' | '--ink' | '--muted' | '--accent' | '--accent2' | '--line', string>;

const PALETTES: Record<'dinas' | 'mesin' | 'atlas', Palette> = {
  dinas: {
    '--bg': '#d8ceb2', '--card': '#e5ddc4', '--ink': '#181611', '--muted': '#5c564a',
    '--accent': '#e8500a', '--accent2': '#181611', '--line': '#181611',
  },
  mesin: {
    '--bg': '#121110', '--card': '#1b1a18', '--ink': '#f2efe6', '--muted': '#8b857a',
    '--accent': '#f2efe6', '--accent2': '#c9b27e', '--line': '#2e2c28',
  },
  atlas: {
    '--bg': '#efe6d2', '--card': '#f6efdd', '--ink': '#2a241c', '--muted': '#7a6e5b',
    '--accent': '#4c7a5e', '--accent2': '#b4543c', '--line': '#c9b894',
  },
};

/* ---------- utilities ---------- */

export function splitGlyphs(el: HTMLElement): HTMLElement[] {
  const glyphs: HTMLElement[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      for (const word of (node.textContent ?? '').split(/(\s+)/)) {
        if (!word) continue;
        if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); continue; }
        const w = document.createElement('span');
        w.className = 'word';
        w.style.display = 'inline-block';
        w.style.whiteSpace = 'nowrap';
        for (const ch of word) {
          const span = document.createElement('span');
          span.className = 'glyph';
          span.textContent = ch;
          w.appendChild(span);
          glyphs.push(span);
        }
        frag.appendChild(w);
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName !== 'SPAN') {
      [...node.childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
  return glyphs;
}

/* ---------- 1 · the loader ceremony ---------- */

function runLoader(onDone: () => void) {
  const loader = document.getElementById('loader');
  if (!loader) return onDone();

  const seen = sessionStorage.getItem('dd-loader');
  if (reducedMotion() || seen) {
    loader.classList.add('is-done');
    return onDone();
  }
  sessionStorage.setItem('dd-loader', '1');

  const mast = document.getElementById('l-mast')!;
  const glyphs = splitGlyphs(mast);
  gsap.set(glyphs, { yPercent: 110, clipPath: 'inset(0 0 100% 0)' });

  const statusEl = document.getElementById('l-status-text')!;
  const tl = gsap.timeline({
    onComplete() {
      loader.classList.add('is-done');
      onDone();
    },
  });

  tl.to('.l-sheet', { scaleX: 1, duration: 0.5, ease: EASE_PRESS, stagger: 0.09 }, 0.15)
    .to(glyphs, {
      yPercent: 0,
      clipPath: 'inset(0 0 -10% 0)',
      duration: 0.6,
      ease: EASE_SETTLE,
      stagger: 0.035,
    }, 0.45)
    .call(() => { statusEl.textContent = 'EDISI #41 SIAP'; }, [], 1.1)
    .to('.l-folio', { opacity: 1, duration: 0.4 }, 1.15)
    .to('.l-stripe', { scaleX: 1, duration: 0.55, ease: EASE_PRESS }, 1.2)
    .to(loader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.85,
      ease: EASE_PRESS,
      delay: 0.35,
    });

  gsap.set(loader, { clipPath: 'inset(0 0 0% 0)' });

  const skip = () => tl.progress(1);
  loader.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, { once: true });
}

/* ---------- 2 · the register morph between acts ---------- */

function setPalette(p: Palette) {
  for (const [k, v] of Object.entries(p)) document.documentElement.style.setProperty(k, v);
}

function registerMorph() {
  const seams = document.querySelectorAll<HTMLElement>('[data-seam]');
  seams.forEach((seam) => {
    const [from, to] = (seam.dataset.seam ?? '').split('-') as ['dinas' | 'mesin' | 'atlas', 'dinas' | 'mesin' | 'atlas'];
    if (!PALETTES[from] || !PALETTES[to]) return;
    const proxy = { t: 0 };
    const fromP = PALETTES[from];
    const toP = PALETTES[to];
    gsap.to(proxy, {
      t: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: seam,
        start: 'top 85%',
        end: 'bottom 30%',
        scrub: 0.4,
      },
      onUpdate() {
        const mixed = {} as Palette;
        for (const key of Object.keys(fromP) as (keyof Palette)[]) {
          mixed[key] = gsap.utils.interpolate(fromP[key], toP[key])(proxy.t);
        }
        setPalette(mixed);
      },
    });

    // the ink wave bends through the seam
    const wave = seam.querySelector<SVGPathElement>('.seam-wave path');
    if (wave) {
      const flat = wave.dataset.flat;
      const bent = wave.dataset.bent;
      if (flat && bent) {
        gsap.fromTo(wave, { attr: { d: flat } }, {
          attr: { d: bent },
          ease: 'none',
          scrollTrigger: { trigger: seam, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      }
    }
  });
}

/* ---------- 3 · reveals: headlines, rules, stamps, rises ---------- */

function reveals() {
  document.querySelectorAll<HTMLElement>('.reveal-glyphs').forEach((el) => {
    const glyphs = splitGlyphs(el);
    if (reducedMotion()) { el.classList.add('is-revealed'); return; }
    gsap.set(glyphs, { clipPath: 'inset(0 0 100% 0)', y: '0.12em' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter() {
        gsap.to(glyphs, {
          clipPath: 'inset(0 0 -10% 0)',
          y: 0,
          duration: 0.62,
          ease: EASE_SETTLE,
          stagger: 0.022,
          onComplete: () => el.classList.add('is-revealed'),
        });
      },
    });
  });

  document.querySelectorAll<HTMLElement>('.rule').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(el, { scaleX: 1, duration: 0.9, ease: EASE_PRESS, onComplete: () => el.classList.add('is-drawn') }),
    });
  });

  document.querySelectorAll<HTMLElement>('[data-stamp-in]').forEach((el) => {
    if (reducedMotion()) return;
    gsap.set(el, { scale: 2.4, opacity: 0, rotate: 8 });
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(el, { scale: 1, opacity: 1, rotate: -4, duration: 0.5, ease: EASE_STAMP }),
    });
  });

  document.querySelectorAll<HTMLElement>('[data-rise]').forEach((el, i) => {
    if (reducedMotion()) return;
    gsap.set(el, { y: 22, opacity: 0 });
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 0.7, ease: EASE_SETTLE, delay: (i % 3) * 0.08 }),
    });
  });
}

/* ---------- 4 · the Angka Edisi odometer ---------- */

function odometer() {
  const el = document.querySelector<HTMLElement>('[data-odometer]');
  if (!el) return;
  const target = Number(el.dataset.odometer ?? 0);
  const prefix = el.dataset.prefix ?? '';
  const fmt = new Intl.NumberFormat('id-ID');
  if (reducedMotion()) { el.textContent = `${prefix} ${fmt.format(target)}`; return; }
  el.textContent = `${prefix} 0`;
  const proxy = { n: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter() {
      gsap.to(proxy, {
        n: target,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = `${prefix} ${fmt.format(Math.round(proxy.n))}`; },
      });
    },
  });
}

/* ---------- 5 · the fidget layer ---------- */

/** Detak: the masthead heartbeat. Ticks every second; click for the count. */
function detak() {
  const el = document.querySelector<HTMLElement>('[data-detak]');
  if (!el) return;
  const terbit = Number(el.dataset.detak ?? Date.now());
  const beat = el.querySelector<HTMLElement>('.detak-beat');
  const render = () => {
    const s = Math.max(0, Math.floor((Date.now() - terbit) / 1000));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    if (beat) beat.textContent = `${hh}.${mm}.${ss}`;
  };
  render();
  setInterval(() => {
    render();
    if (!reducedMotion() && beat) {
      gsap.fromTo(beat, { scale: 1.06 }, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  }, 1000);
  el.addEventListener('click', () => {
    const s = Math.floor((Date.now() - terbit) / 1000);
    say(`${new Intl.NumberFormat('id-ID').format(s)} detik sejak edisi ini dicetak. Detak terus.`);
  });
}

/** Stempel pad: clicking idle paper stamps a small seal at the cursor. */
const STEMPEL_WORDS = ['EDISI 41', 'TERUJI', 'BERCATATAN', 'ARSIP', 'DETAK', 'DETIK'];
function stempelPad() {
  document.querySelectorAll<HTMLElement>('[data-stempel-pad]').forEach((zone) => {
    zone.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, [data-no-stempel], .chip')) return;
      const seal = document.createElement('span');
      seal.className = 'stempel-seal mono';
      const r = Math.random();
      seal.textContent = r < 0.7
        ? STEMPEL_WORDS[Math.floor(Math.random() * STEMPEL_WORDS.length)]!
        : `${(Math.random() * 8 + 2).toFixed(2)}°LS ${(Math.random() * 30 + 105).toFixed(2)}°BT`;
      seal.style.left = `${e.clientX}px`;
      seal.style.top = `${e.clientY}px`;
      seal.style.setProperty('--rot', `${(Math.random() * 22 - 11).toFixed(1)}deg`);
      document.body.appendChild(seal);
      if (reducedMotion()) {
        setTimeout(() => seal.remove(), 900);
      } else {
        gsap.fromTo(seal, { scale: 2.1, opacity: 0 }, { scale: 1, opacity: 0.92, duration: 0.28, ease: EASE_STAMP });
        gsap.to(seal, { opacity: 0, y: -14, delay: 1.0, duration: 0.7, onComplete: () => seal.remove() });
      }
    });
  });
}

/** Crosshair readout: a spec-sheet coordinate follows the pointer (Act I). */
function crosshair() {
  if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return;
  const zone = document.querySelector<HTMLElement>('[data-crosshair]');
  if (!zone) return;
  const tag = document.createElement('span');
  tag.className = 'crosshair-tag mono';
  tag.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tag);
  let raf = 0;
  zone.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const lat = (e.clientY / window.innerHeight) * 11 - 6;
      const lon = (e.clientX / window.innerWidth) * 46 + 95;
      tag.textContent = `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'LS' : 'LU'} · ${lon.toFixed(2)}°BT`;
      tag.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
      tag.style.opacity = '1';
    });
  });
  zone.addEventListener('pointerleave', () => { tag.style.opacity = '0'; });
}

/* ---------- 6 · Aksara speech (the say verb, rendered) ---------- */

let sayTimer: ReturnType<typeof setTimeout> | undefined;
export function say(teks: string, tahanMs = 3500) {
  const bubble = document.getElementById('aksara-bubble');
  if (!bubble) return;
  bubble.textContent = teks;
  bubble.classList.add('is-talking');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => bubble.classList.remove('is-talking'), tahanMs);
}

/* ---------- 7 · act whisper: Aksara notices where you are ---------- */

const WHISPERS: Record<string, string> = {
  dinas: 'Edisi pagi. 84 baris putusan baru semalam. Semua angka membawa kuitansi.',
  mesin: 'Bagian ini tentang yang tidak dihitung. Baris yang kosong juga dokumen.',
  atlas: 'Peta lama untuk catatan yang harus awet. Coba terbangkan ke Mimika.',
};
function actWhispers() {
  let last = '';
  document.querySelectorAll<HTMLElement>('[data-act]').forEach((act) => {
    ScrollTrigger.create({
      trigger: act,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => whisper(act.dataset.act!),
      onEnterBack: () => whisper(act.dataset.act!),
    });
  });
  function whisper(name: string) {
    if (name === last) return;
    last = name;
    const teks = WHISPERS[name];
    if (teks) say(teks, 4200);
  }
}

/* ---------- boot ---------- */

export function boot() {
  dispatchScrollHandler();
  runLoader(() => {
    const mastGlyphs = document.querySelectorAll<HTMLElement>('#masthead .glyph');
    if (mastGlyphs.length && !reducedMotion()) {
      gsap.fromTo(mastGlyphs,
        { clipPath: 'inset(0 0 100% 0)', y: '0.1em' },
        { clipPath: 'inset(0 0 -10% 0)', y: 0, duration: 0.7, ease: EASE_SETTLE, stagger: 0.04 });
    }
  });
  // pre-split masthead so the reveal targets exist
  const mast = document.getElementById('masthead');
  if (mast) splitGlyphs(mast);

  registerMorph();
  reveals();
  odometer();
  detak();
  stempelPad();
  crosshair();
  actWhispers();
}

function dispatchScrollHandler() {
  // the scroll_to verb: the agent scrolls the paper like a reader would
  import('../lib/commands/dispatcher').then(({ on }) => {
    on('scroll_to', ({ anchor }) => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
    on('say', ({ teks, tahan_ms }) => say(teks, tahan_ms));
  });
}
