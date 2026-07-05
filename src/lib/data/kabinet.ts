/**
 * KABINET: the single owner of the cabinet-composition counts (satu fakta
 * satu pemilik). The JSON lives with the newsroom so the Python validator
 * (sources/vital.py) reads the same file the page builds from. Every surface
 * — CabangBand's 109, the waffle tiers, the vital cross-check — derives from
 * here; none restates a literal.
 */
import K from '../../../newsroom/data/kabinet.json';

export const KABINET = {
  menteri: K.menteri,
  wamen: K.wamen,
  badan: K.badan,
  total: K.menteri + K.wamen + K.badan,
  sumber: K.sumber,
};
