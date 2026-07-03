"""
The JANJI desk, two artifacts from one namespace:

1. CORPUS (gather_janji): numbers the temuan gate may cite — the seed
   dataset (data/janji_ledger.json) plus every figure in the registry
   below, so findings can quote the buku besar's own entries.

2. BUKU BESAR (muat_buku_janji): the promise ledger the site prints
   (data/janji_registry.json — the SAME file index.astro imports at
   build, single source of truth). Promises are Lane A: documented
   statements with sources; they never change here. Only `realisasi*`
   moves — refreshed by this desk — and `status` is COMPUTED from
   deadline × measured figure (`arah` marks the target a floor 'naik'
   or a ceiling 'turun'), never chosen. A stored status that disagrees
   is corrected and logged: the ledger audits itself every edition.

3. (scaffolded, dormant until a model lane has a live key) REFRESH:
   the research lane may propose a NEWER official realisasi; the gate
   accepts only {angka, tanggal ISO, sumber, url} where the url fetches
   and carries the figure (the sari gate's pattern applied to one
   number). Rejected -> the old row stays. See the design note at the
   bottom; wiring it is one edit once keys land.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from ..models import CorpusRow, Janji

_DATA = Path(__file__).resolve().parent.parent / "data"
_SEED = _DATA / "janji_ledger.json"
_REGISTRY = _DATA / "janji_registry.json"


def _load_seed() -> list[dict]:
    try:
        return list(json.loads(_SEED.read_text(encoding="utf-8")).get("janji", []))
    except Exception:
        return []


def _load_registry() -> list[dict]:
    try:
        return list(json.loads(_REGISTRY.read_text(encoding="utf-8")))
    except Exception:
        return []


def _status_mekanis(j: dict, hari_ini: date) -> str:
    r = j.get("realisasi_angka")
    if r is None:
        return "DATA TIDAK TERSEDIA"
    t = j.get("target_angka")
    # a met target is TERCAPAI even before its deadline — achieving early counts
    if t is not None:
        tercapai = r >= t if j.get("arah", "naik") == "naik" else r <= t
        if tercapai:
            return "TERCAPAI"
    tenggat = j.get("tenggat")
    if tenggat:
        try:
            jatuh = date.fromisoformat(str(tenggat))
        except ValueError:
            jatuh = None
        if jatuh and hari_ini > jatuh:
            return "TIDAK TERCAPAI" if t is not None else "DATA TIDAK TERSEDIA"
    return "BERJALAN"


def muat_buku_janji(catat=print, hari_ini: date | None = None) -> list[Janji]:
    """The buku besar rows, statuses recomputed; self-corrections logged."""
    hari_ini = hari_ini or date.today()
    keluar: list[Janji] = []
    for b in _load_registry():
        status = _status_mekanis(b, hari_ini)
        if status != b.get("status"):
            catat("janji_status_koreksi", {"id": b.get("id"), "dari": b.get("status"), "ke": status})
        keluar.append(Janji(**{**b, "status": status}))
    return keluar


async def gather_janji() -> tuple[list[CorpusRow], list[dict]]:
    janji = _load_seed()
    rows = [
        CorpusRow(
            id=j["id"],
            nilai={"target": float(j["target"]), "realisasi": float(j["realisasi"])},
        )
        for j in janji
    ]
    # the buku besar's own figures join the corpus so findings can cite them
    for b in _load_registry():
        nilai: dict[str, float | str] = {}
        if b.get("target_angka") is not None:
            nilai["target"] = float(b["target_angka"])
        if b.get("realisasi_angka") is not None:
            nilai["realisasi"] = float(b["realisasi_angka"])
        if nilai:
            rows.append(CorpusRow(id=f"janji:{b['id']}", nilai=nilai))
    return rows, janji


# ── refresh design (dormant until a model lane is live) ──────────────────────
# async def segarkan_realisasi(buku, catat) -> list[Janji]:
#   for entries whose realisasi_tanggal is older than ~30 days, ask the
#   research lane for a newer OFFICIAL figure; accept only a proposal
#   {angka, tanggal, sumber, url} whose url fetches 200 and whose text
#   contains the digits (Lane B: fact-gated). Write accepted updates back
#   into janji_registry.json via a PR-style commit in the Actions run, so
#   the registry stays the single reviewed source of truth.
