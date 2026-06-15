/**
 * The page choreography: loader ceremony, the register morph between acts,
 * headline reveals, stamps, odometer, smooth scroll, and the fidget layer.
 * Everything scroll-linked runs through one ScrollTrigger vocabulary.
 * Reduced motion: instant states, zero performance.
 */
import Lenis from 'lenis';
import { annotate } from 'rough-notation';
import { gsap, ScrollTrigger, EASE_PRESS, EASE_SETTLE, EASE_STAMP, reducedMotion } from '../lib/motion';
import { setDenom, onDenom, getDenom, formatUang } from '../lib/denominasi';
import { setLensa } from '../lib/lensa';
import { pulseRef } from '../lib/motion-kit';

let lenis: Lenis | null = null;

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
    } else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains('word')) {
      [...node.childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
  return glyphs;
}

/* ---------- 0 · smooth scroll (the seamlessness substrate) ---------- */

function smoothScroll() {
  if (reducedMotion()) return;
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToAnchor(anchor: string) {
  const el = document.getElementById(anchor);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
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

/* ---------- 2 · the ribbon flip between acts ----------
   Acts own their registers statically. The seam is a compact, non-pinned
   band whose flaps flip from the previous act's paper to the next act's as
   it scrolls past. Flaps flip bottom-first and the band's backdrop is the
   destination colour, so the page reads as light-on-top / dark-on-bottom
   with the dark growing upward, and never bleeds the next section early. */

function seamFlip() {
  document.querySelectorAll<HTMLElement>('[data-seam]').forEach((seam) => {
    const slats = seam.querySelectorAll<HTMLElement>('.slat');
    if (!slats.length || reducedMotion()) {
      seam.classList.add('is-static');
      return;
    }
    gsap.to(slats, {
      rotateX: -180,
      ease: 'none',
      stagger: { each: 0.05, from: 'end' },
      scrollTrigger: {
        trigger: seam,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.4,
      },
    });
    const kicker = seam.querySelector('.seam-kicker');
    if (kicker) {
      gsap.fromTo(kicker, { opacity: 0 }, {
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: seam, start: 'top 70%', end: 'center center', scrub: true },
      });
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

  document.querySelectorAll<HTMLElement>('.rule, .rule2').forEach((el) => {
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
    gsap.set(el, { y: 26, opacity: 0 });
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 0.75, ease: EASE_SETTLE, delay: (i % 3) * 0.08 }),
    });
  });
}

/* ---------- 3b · the editor's red pen: rough-notation marks ----------
   Elements opt in with data-annotate="underline|circle|box|highlight".
   Colors name a token (data-annotate-color="accent2") or a literal hex;
   tokens resolve at reveal time so each act keeps its own register. */

function redPen() {
  document.querySelectorAll<HTMLElement>('[data-annotate]').forEach((el) => {
    const type = el.dataset.annotate as 'underline' | 'circle' | 'box' | 'highlight';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 78%',
      once: true,
      onEnter() {
        const token = el.dataset.annotateColor ?? 'accent';
        const color = token.startsWith('#')
          ? token
          : getComputedStyle(el).getPropertyValue(`--${token}`).trim() || '#e44a06';
        annotate(el, {
          type,
          color,
          strokeWidth: 2,
          padding: type === 'circle' ? 8 : 4,
          iterations: 2,
          multiline: true,
          animationDuration: reducedMotion() ? 0 : 850,
        }).show();
      },
    });
  });
}

/* ---------- 4 · the Angka Edisi odometer (+ scrub fidget) ---------- */

function odometer() {
  const el = document.querySelector<HTMLElement>('[data-odometer]');
  if (!el) return;
  const target = Number(el.dataset.odometer ?? 0);
  const render = (n: number) => { el.textContent = formatUang(n, getDenom()); };
  onDenom(() => render(target));
  if (reducedMotion()) { render(target); return; }
  render(0);
  const proxy = { n: 0 };
  let settled = false;
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter() {
      gsap.to(proxy, {
        n: target,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => render(proxy.n),
        onComplete: () => { settled = true; },
      });
    },
  });

  // the scrub: drag the number sideways to rewind it; it springs back
  el.style.cursor = 'ew-resize';
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => {
    if (!settled) return;
    const startX = e.clientX;
    const w = el.getBoundingClientRect().width;
    gsap.killTweensOf(proxy);
    const move = (ev: PointerEvent) => {
      const t = gsap.utils.clamp(0, 1, 1 + (ev.clientX - startX) / w);
      proxy.n = target * t * t;
      render(proxy.n);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      gsap.to(proxy, { n: target, duration: 1.2, ease: 'power3.out', onUpdate: () => render(proxy.n) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  });
}

/* ---------- 5 · the fidget layer ---------- */

/** Jam tri-zona: the masthead clock in the three Indonesian time zones,
    from the device's own clock. WIB=UTC+7, WITA=UTC+8, WIT=UTC+9. */
function jamTri() {
  const slots = {
    wib: document.querySelector<HTMLElement>('[data-jam="wib"]'),
    wita: document.querySelector<HTMLElement>('[data-jam="wita"]'),
    wit: document.querySelector<HTMLElement>('[data-jam="wit"]'),
  };
  if (!slots.wib) return;
  const hhmmss = (offsetH: number) => {
    const t = new Date(Date.now() + offsetH * 3600_000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(t.getUTCHours())}.${p(t.getUTCMinutes())}.${p(t.getUTCSeconds())}`;
  };
  const render = () => {
    if (slots.wib) slots.wib.textContent = hhmmss(7);
    if (slots.wita) slots.wita.textContent = hhmmss(8);
    if (slots.wit) slots.wit.textContent = hhmmss(9);
  };
  render();
  setInterval(render, 1000);
}

/** The denominasi lever beside the loss figure: re-prices that one number
    (and any subscriber) into nasi bungkus, MBG portions, or wage-days. */
function denomLever() {
  const btns = [...document.querySelectorAll<HTMLElement>('[data-denom]')];
  if (!btns.length) return;
  import('../lib/commands/dispatcher').then(({ dispatch }) => {
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        dispatch({ cmd: 'denominate', params: { unit: btn.dataset.denom } });
      });
    });
  });
  onDenom((d) => btns.forEach((b) => b.classList.toggle('aktif', b.dataset.denom === d)));
}

/** Stempel pad: a click stamps a seal; holding the press inks a blot. */
const STEMPEL_WORDS = ['EDISI 41', 'TERUJI', 'BERCATATAN', 'ARSIP', 'DETAK', 'DETIK'];
function stempelPad() {
  document.querySelectorAll<HTMLElement>('[data-stempel-pad]').forEach((zone) => {
    zone.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, [data-no-stempel], .chip')) return;

      let blot: HTMLElement | null = null;
      let grow: gsap.core.Tween | null = null;
      let moved = false;
      const x0 = e.clientX;
      const y0 = e.clientY;
      const holdTimer = setTimeout(() => {
        // the long press: ink soaks into the paper — but a press is
        // stationary; a scroll is not, and never inks the page
        if (moved || document.querySelector('.ink-blot')) return;
        blot = document.createElement('span');
        blot.className = 'ink-blot';
        blot.style.left = `${e.clientX}px`;
        blot.style.top = `${e.clientY}px`;
        document.body.appendChild(blot);
        grow = gsap.to(blot, { scale: 9, duration: 2.4, ease: 'power1.in' });
      }, 350);

      const onMove = (ev: PointerEvent) => {
        if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 8) {
          moved = true;
          clearTimeout(holdTimer);
          if (blot) {
            grow?.kill();
            gsap.to(blot, { opacity: 0, duration: 0.5, onComplete: () => blot!.remove() });
            blot = null;
          }
        }
      };
      window.addEventListener('pointermove', onMove);

      const up = () => {
        clearTimeout(holdTimer);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        window.removeEventListener('pointermove', onMove);
        if (blot) {
          grow?.kill();
          gsap.to(blot, { opacity: 0, duration: 1.4, delay: 0.3, onComplete: () => blot!.remove() });
          return;
        }
        if (moved) return;
        // the tap: a small seal at the cursor
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
      };
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  });
}

/** Masthead ripple: the title's ink thins under the pointer like lead type
    under a thumb, and springs back to full weight when it leaves. */
function mastheadRipple() {
  if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return;
  const mast = document.getElementById('masthead');
  if (!mast) return;
  const glyphs = [...mast.querySelectorAll<HTMLElement>('.glyph')];
  if (!glyphs.length) return;
  const weights = glyphs.map(() => ({ w: 800 }));
  glyphs.forEach((g, i) => {
    g.style.fontVariationSettings = `'wght' 800`;
    weights[i] = { w: 800 };
  });
  let raf = 0;
  mast.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      glyphs.forEach((g, i) => {
        const r = g.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        const fall = Math.max(0, 1 - d / 260);
        const target = 800 - 380 * fall * fall;
        gsap.to(weights[i]!, {
          w: target,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => { g.style.fontVariationSettings = `'wght' ${weights[i]!.w.toFixed(0)}`; },
        });
      });
    });
  });
  mast.addEventListener('pointerleave', () => {
    glyphs.forEach((g, i) => {
      gsap.to(weights[i]!, {
        w: 800,
        duration: 0.9,
        ease: 'elastic.out(1, 0.4)',
        overwrite: true,
        onUpdate: () => { g.style.fontVariationSettings = `'wght' ${weights[i]!.w.toFixed(0)}`; },
      });
    });
  });
}

/** Struk tear: pull the receipt down past the perforation and it rips off,
    flutters away, and the printer spits out a fresh copy. */
function strukTear() {
  const struk = document.querySelector<HTMLElement>('.struk');
  if (!struk || reducedMotion()) return;
  let copies = 1;
  struk.style.cursor = 'grab';
  struk.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    e.preventDefault();
    struk.style.cursor = 'grabbing';
    const startY = e.clientY;
    let dy = 0;
    const move = (ev: PointerEvent) => {
      dy = Math.max(0, ev.clientY - startY);
      const t = Math.min(1, dy / 110);
      gsap.set(struk, { y: dy * 0.55, rotate: t * 2.4, transformOrigin: 'top center' });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      struk.style.cursor = 'grab';
      if (dy > 110) {
        copies++;
        const tl = gsap.timeline();
        tl.to(struk, { y: '+=420', rotate: 14, opacity: 0, duration: 0.7, ease: 'power2.in' })
          .call(() => {
            const stamp = struk.querySelector<HTMLElement>('.struk-stamp');
            if (stamp) stamp.textContent = `SALINAN KE-${copies} · EDISI 41`;
          })
          .set(struk, { y: -36, rotate: 0, opacity: 0 })
          .to(struk, { y: 0, opacity: 1, duration: 0.6, ease: EASE_SETTLE });
        say('Struk terobek. Mesin mencetak salinan baru — angka yang sama, kertas yang baru.');
      } else {
        gsap.to(struk, { y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  });
}

/** Fajar: a small button opens a dithered sunrise plate — an easter egg,
    not an overscroll gesture (that fought the browser's pull-to-refresh). */
function fajarButton() {
  const panel = document.getElementById('fajar');
  const canvas = panel?.querySelector('canvas');
  const btn = document.querySelector<HTMLElement>('[data-fajar-open]');
  if (!panel || !canvas || !btn) return;

  let drawn = false;
  let open = false;
  const draw = async () => {
    const { BAYER_4 } = await import('../lib/seed');
    const { field, GRID_COLS } = await import('../lib/nusantara');
    const w = panel.clientWidth;
    const h = 200;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#100f0d';
    ctx.fillRect(0, 0, w, h);
    const sunX = w * 0.72;
    const sunY = h * 0.66;
    const cell = 5;
    for (let y = 0; y < h - 26; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const dSun = Math.hypot(x - sunX, y - sunY);
        const glow = Math.max(0, 1 - dSun / (w * 0.42));
        const sky = Math.max(0, 0.45 - (y / h) * 0.45);
        const v = Math.min(1, glow * glow * 1.4 + sky * 0.5);
        if (v > BAYER_4[(y / cell) % 4 | 0]![(x / cell) % 4 | 0]!) {
          ctx.fillStyle = dSun < 26 ? '#e44a06' : '#cdb47a';
          ctx.fillRect(x, y, 2.2, 2.2);
        }
      }
    }
    // archipelago silhouette along the horizon
    ctx.fillStyle = '#d6cbac';
    for (let x = 0; x < w; x += 2) {
      const gx = (x / w) * GRID_COLS;
      let land = 0;
      for (let gy = 14; gy < 46; gy += 4) land = Math.max(land, field(gx, gy));
      if (land > 0.4) ctx.fillRect(x, h - 22, 2, 8 + land * 10);
    }
    drawn = true;
  };

  const toggle = async () => {
    open = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open && !drawn) await draw();
    if (reducedMotion()) { panel.style.height = open ? '200px' : '0px'; return; }
    gsap.to(panel, { height: open ? 200 : 0, duration: open ? 0.8 : 0.5, ease: open ? 'elastic.out(1, 0.6)' : 'power2.in' });
  };
  btn.addEventListener('click', toggle);
  panel.addEventListener('click', () => { if (open) void toggle(); });
}

/* ---------- 6 · Aksara speech (the say verb, rendered) ---------- */

let sayTimer: ReturnType<typeof setTimeout> | undefined;
let typeTween: gsap.core.Tween | undefined;
export function say(teks: string, tahanMs = 3500) {
  const bubble = document.getElementById('aksara-bubble');
  if (!bubble) return;
  bubble.classList.add('is-talking');
  clearTimeout(sayTimer);
  typeTween?.kill();
  if (reducedMotion()) {
    bubble.textContent = teks;
  } else {
    // the bubble types like the wire service it is
    const proxy = { i: 0 };
    bubble.textContent = '';
    typeTween = gsap.to(proxy, {
      i: teks.length,
      duration: Math.min(1.4, teks.length * 0.018),
      ease: 'none',
      onUpdate: () => { bubble.textContent = teks.slice(0, Math.round(proxy.i)); },
    });
  }
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
  smoothScroll();
  dispatchScrollHandler();

  // pre-split masthead so the reveal targets exist
  const mast = document.getElementById('masthead');
  if (mast) splitGlyphs(mast);

  runLoader(() => {
    const mastGlyphs = document.querySelectorAll<HTMLElement>('#masthead .glyph');
    if (mastGlyphs.length && !reducedMotion()) {
      gsap.fromTo(mastGlyphs,
        { clipPath: 'inset(0 0 100% 0)', y: '0.1em' },
        { clipPath: 'inset(0 0 -10% 0)', y: 0, duration: 0.7, ease: EASE_SETTLE, stagger: 0.04 });
    }
    mastheadRipple();
  });

  seamFlip();
  reveals();
  redPen();
  odometer();
  jamTri();
  denomLever();
  stempelPad();
  strukTear();
  fajarButton();
  actWhispers();
}

function dispatchScrollHandler() {
  // the scroll_to verb: the agent scrolls the paper like a reader would
  import('../lib/commands/dispatcher').then(({ on }) => {
    on('scroll_to', ({ anchor }) => scrollToAnchor(anchor));
    on('say', ({ teks, tahan_ms }) => say(teks, tahan_ms));
    on('denominate', ({ unit }) => setDenom(unit));
    on('set_lensa', ({ kode }) => setLensa(kode));
    // the agent reaches into the page: ring what it cites, draw a connector
    on('highlight', ({ ids }) => ids.forEach((id, k) => pulseRef(id, k === 0)));
  });
}
