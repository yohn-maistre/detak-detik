"""
The PAPUA corpus: development indicators for Tanah Papua, sourced from BPS and
the Ministry of Finance. Seed dataset now (data/papua.json); the live seam is the
BPS WebAPI (provincial) and Nota Keuangan (Otsus allocation).
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "papua.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("papua", []))
    except Exception:
        return []


async def gather_papua() -> tuple[list[CorpusRow], list[dict]]:
    rows_raw = _load_seed()
    rows: list[CorpusRow] = []
    for r in rows_raw:
        nilai: dict[str, float | str] = {}
        if "nilai" in r:
            nilai["nilai"] = float(r["nilai"])
        if "nilai_persen" in r:
            nilai["nilai_persen"] = float(r["nilai_persen"])
        if "nasional_persen" in r:
            nilai["nasional_persen"] = float(r["nasional_persen"])
        rows.append(CorpusRow(id=r["id"], nilai=nilai))
    return rows, rows_raw
