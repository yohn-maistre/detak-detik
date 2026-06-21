"""
The HUTAN corpus: forest-cover loss per island region, flagged where it overlaps
a concession. Seed dataset now (data/hutan_alert.json); the live seam is Global
Forest Watch / SIMONTANA KLHK. A dark source falls back to the seed.
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "hutan_alert.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("alert", []))
    except Exception:
        return []


async def gather_hutan() -> tuple[list[CorpusRow], list[dict]]:
    alert = _load_seed()
    rows = [
        CorpusRow(
            id=h["id"],
            nilai={"hektar": float(h["hektar"]), "dalam_konsesi": float(h["dalam_konsesi"])},
        )
        for h in alert
    ]
    return rows, alert
