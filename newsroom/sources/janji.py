"""
The JANJI corpus: official program targets vs realisation. Seed dataset now
(data/janji_ledger.json); the live seam is RPJMN / ministry progress reports.
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "janji_ledger.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("janji", []))
    except Exception:
        return []


async def gather_janji() -> tuple[list[CorpusRow], list[dict]]:
    janji = _load_seed()
    rows = [
        CorpusRow(
            id=j["id"],
            nilai={"target": float(j["target"]), "realisasi": float(j["realisasi"])},
        )
        for j in janji
    ]
    return rows, janji
