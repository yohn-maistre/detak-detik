"""
The ANGGARAN corpus: national budget aggregates (belanja pegawai vs total),
framed neutrally. Seed dataset now (data/anggaran_apbn.json); the live seam is
the Nota Keuangan / DJPK portal, where the per-region personnel-spending outlier
rule (NEWSROOM.md section 2) will run once subnational data is wired.
"""

from __future__ import annotations

import json
from pathlib import Path

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "anggaran_apbn.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("pos", []))
    except Exception:
        return []


async def gather_anggaran() -> tuple[list[CorpusRow], list[dict]]:
    pos = _load_seed()
    rows = [
        CorpusRow(
            id=p["id"],
            nilai={
                "belanja_pegawai": float(p["belanja_pegawai"]),
                "total_belanja": float(p["total_belanja"]),
                "rasio_persen": float(p["rasio_persen"]),
            },
        )
        for p in pos
    ]
    return rows, pos
