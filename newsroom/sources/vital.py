"""
The VITAL desk: guardian of the kartu vital (data/vital_cabang.json).

The vital file is the paper's most load-bearing branch dataset — one
sourced row per branch of power, read at build by VitalCabang and (since
wave 9a) derived-from by the chapter bands. It is hand-curated, which
means it can drift. This desk gives it two mechanical guarantees:

1. CORPUS (gather_vital): every row enters the citation corpus as
   vital:{id} -> {nilai, band_lo, band_hi, dulu}, so temuan can quote
   the doctor's chart and the fact gate can hold them to it.
2. VALIDATION (validasi_vital): schema keys present, band lo <= hi,
   every row carries a sumber, and the cross-language cross-check —
   the eksekutif row's nilai must equal kabinet.json's menteri count
   (satu fakta satu pemilik across TS and Python).

Failures LOG, never crash: a broken vital file prints yesterday's truth
rather than killing the edition (the page still builds from the JSON it
has; the log is the alarm bell).
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_DATA = Path(__file__).resolve().parent.parent / "data"
_VITAL = _DATA / "vital_cabang.json"
_KABINET = _DATA / "kabinet.json"

_WAJIB = ("id", "cabang", "metrik", "nilai", "satuan", "band", "sumber")


def _muat(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def validasi_vital() -> list[str]:
    """Mechanical checks; returns a list of human-readable violations
    (empty = healthy). Never raises."""
    masalah: list[str] = []
    rows = _muat(_VITAL)
    if not isinstance(rows, list) or not rows:
        return ["vital_cabang.json tidak terbaca atau kosong"]
    for r in rows:
        rid = r.get("id", "<tanpa id>")
        for k in _WAJIB:
            if k not in r:
                masalah.append(f"{rid}: kunci '{k}' hilang")
        band = r.get("band") or {}
        lo, hi = band.get("lo"), band.get("hi")
        if isinstance(lo, (int, float)) and isinstance(hi, (int, float)) and lo > hi:
            masalah.append(f"{rid}: band lo {lo} > hi {hi}")
        if not (r.get("sumber") or "").strip():
            masalah.append(f"{rid}: sumber kosong")
        if not (band.get("sumber") or "").strip():
            masalah.append(f"{rid}: band tanpa sumber")
    # the cross-language single-owner check (wave 9a: kabinet.json)
    kab = _muat(_KABINET) or {}
    vital_kab = next((r for r in rows if r.get("id") == "eksekutif-kabinet"), None)
    if vital_kab and isinstance(kab.get("menteri"), int):
        if vital_kab.get("nilai") != kab["menteri"]:
            masalah.append(
                f"eksekutif-kabinet: nilai {vital_kab.get('nilai')} != kabinet.json menteri {kab['menteri']} "
                "(satu fakta satu pemilik — selaraskan kedua berkas)")
    return masalah


async def gather_vital() -> tuple[list[CorpusRow], list[str]]:
    """Corpus rows from the vital file + the validation report."""
    rows_out: list[CorpusRow] = []
    rows = _muat(_VITAL) or []
    for r in rows:
        if not isinstance(r, dict) or "id" not in r:
            continue
        band = r.get("band") or {}
        nilai: dict[str, float | str] = {
            "nilai": r.get("nilai", ""),
            "satuan": r.get("satuan", ""),
            "band_lo": band.get("lo", ""),
            "band_hi": band.get("hi", ""),
            "sumber": r.get("sumber", ""),
        }
        dulu = r.get("dulu") or {}
        if "nilai" in dulu:
            nilai["dulu"] = dulu["nilai"]
        rows_out.append(CorpusRow(id=f"vital:{r['id']}", nilai=nilai))
    return rows_out, validasi_vital()
