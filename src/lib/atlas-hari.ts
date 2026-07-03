/**
 * Atlas Hari: the ONE deterministic clock for Act III (§13.17 B.3). Every
 * section that rotates a subject reads its pick from here, so the whole
 * atlas speaks about the same day — the profile is the spine, and the
 * masthead constellation can mark every subject at once. Same slot for
 * every reader (law 5); nothing random, nothing per-visitor.
 *
 * Two cadences: SLOT (12-hour, twice-daily like the edition) drives the
 * headline profile; HARI (calendar day) drives the slower showcases.
 * Anchored so 2026-07-03 pagi opened with Suku Mee (manusia index 0).
 */
import MANUSIA from '../../newsroom/data/atlas/manusia.json';
import HAYATI from '../../newsroom/data/atlas/hayati.json';

export const ANKER = 41275; // slot for 2026-07-03 pagi — Mee, the inaugural
export const SLOT = Math.floor(Date.now() / (12 * 3_600_000));
export const HARI = Math.floor(Date.now() / 86_400_000);

const wrap = (n: number, len: number) => ((n % len) + len) % len;

/** the day's featured people — the atlas spine */
export const manusiaHari = MANUSIA[wrap(SLOT - ANKER, MANUSIA.length)]!;

/** the day's species showcase (calendar-paced, slower than the profile) */
export const hayatiHari = HAYATI[wrap(HARI, HAYATI.length)]!;

/** the biogeographic zone the day leans toward: the featured people's
 *  island resolved onto the Wallace/Weber scheme, so HAYATI can open on
 *  the same side of the archipelago the profile lives on. */
const PULAU_ZONA: Record<string, 'sunda' | 'wallacea' | 'sahul'> = {
  sumatra: 'sunda', jawa: 'sunda', kalimantan: 'sunda', borneo: 'sunda',
  sulawesi: 'wallacea', bali_nusa: 'wallacea', maluku: 'wallacea',
  papua: 'sahul',
};
export const zonaHari: 'sunda' | 'wallacea' | 'sahul' =
  PULAU_ZONA[(manusiaHari as { pulau?: string }).pulau ?? ''] ?? 'sunda';

/** the language the profile speaks, normalized for matching against the
 *  bahasa rotation (strip the "Bahasa " prefix + parenthetical glosses) */
export const bahasaHari = (manusiaHari.bahasa ?? '')
  .replace(/^Bahasa\s+/i, '')
  .replace(/\s*\(.*\)\s*/, '')
  .trim();
