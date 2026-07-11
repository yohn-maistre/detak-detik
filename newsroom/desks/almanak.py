"""
The ALMANAK desk (scaffold, 2026-07-11). Adds recent-research plates to the
Act III science almanak: given titles/abstracts from Indonesian-relevant
research feeds (arXiv listings, BRIN/LIPI releases, journal RSS), it drafts a
short plain-Indonesian plate — one finding, cited, computed-or-quoted, in the
same shape as newsroom/data/atlas/almanak.json.

DORMANT until the LLM lane has keys AND Yose reviews the first batch: drafts
land in newsroom/data/atlas/almanak_draft.json for review, never straight
into the rotation. The curated almanak.json ships without this desk; the desk
only ever grows the shelf.

Lanes: source abstracts are Lane A (fetched, cited); the plate is Lane C —
grounded, cited, gated (no number that is not in a cited source; no claim of
significance the source does not make; "sumber tidak cukup" over invention).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SEKSI = ["LANGIT", "BUMI", "HAYAT", "ANGKA"]

SYSTEM = (
    "Kamu redaktur meja ALMANAK di DETAK DETIK, menulis satu plat sains "
    "pendek untuk lampiran Nusantara. Bahasa Indonesia formal, tenang, tanpa "
    "hiperbola. Satu temuan per plat: judul singkat, teks 2–3 kalimat, dan "
    "baris HITUNGAN/SUMBER. Pilih seksi dari LANGIT/BUMI/HAYAT/ANGKA sesuai "
    "isinya. Hanya sebut angka yang ADA pada abstrak sumber; jika penelitian "
    "belum kuat atau angkanya tak ada, kembalikan null. Jangan mengklaim "
    "signifikansi yang tidak dinyatakan sumber."
)

DRAFT_PATH = Path(__file__).resolve().parents[1] / "data" / "atlas" / "almanak_draft.json"


async def desk_almanak(kandidat: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
    """Draft plates from research candidates; append to the review queue.

    Each candidate: {id, judul, abstrak, sumber_url}. Returns the drafted
    plates (or None when the LLM lane is dark).
    """
    from ..llm import model_available  # lazy: scaffold must not gate the print

    if not model_available():
        return None

    import pydantic
    from pydantic_ai import Agent

    from ..llm import build_model

    class Plat(pydantic.BaseModel):
        seksi: str | None
        judul: str | None
        teks: str | None
        rumus: str | None
        cited_id: str | None

    agent = Agent(build_model(), output_type=Plat, system_prompt=SYSTEM)
    drafts: list[dict[str, Any]] = []
    for k in kandidat:
        hasil = await agent.run(
            f"KANDIDAT [{k['id']}]\nJUDUL: {k['judul']}\nABSTRAK: {k['abstrak']}"
        )
        p = hasil.output
        # gate: a plate must cite a candidate id that exists, and its seksi
        # must be one of the four; otherwise it is dropped (silence)
        if not p.teks or p.seksi not in SEKSI or p.cited_id != k["id"]:
            continue
        drafts.append(
            {
                "seksi": p.seksi,
                "judul": p.judul,
                "teks": p.teks,
                "rumus": p.rumus or "",
                "chips": [k.get("sumber_url", "")],
                "cited_id": k["id"],
                "status": "MENUNGGU_REVIEW",
            }
        )

    if not drafts:
        return None
    antrean = []
    if DRAFT_PATH.exists():
        antrean = json.loads(DRAFT_PATH.read_text(encoding="utf-8"))
    antrean = antrean + drafts
    DRAFT_PATH.parent.mkdir(parents=True, exist_ok=True)
    DRAFT_PATH.write_text(json.dumps(antrean, ensure_ascii=False, indent=2), encoding="utf-8")
    return drafts
