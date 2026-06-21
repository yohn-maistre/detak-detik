"""
The HARGA corpus: national average prices of strategic food commodities, each a
corpus row the gate can check. Seed dataset now (data/harga_pangan.json); the
live seam is the Panel Harga Badan Pangan Nasional. A dark source falls back to
the seed (a Data Hilang note, not a crash).
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "harga_pangan.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("komoditas", []))
    except Exception:
        return []


async def gather_harga() -> tuple[list[CorpusRow], list[dict]]:
    # seam: fetch panelharga.badanpangan.go.id here; fall back to the seed.
    komoditas = _load_seed()
    rows = [
        CorpusRow(
            id=k["id"],
            nilai={"harga": float(k["harga"]), "delta_pct": float(k["delta_pct"])},
        )
        for k in komoditas
    ]
    return rows, komoditas
