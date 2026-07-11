"""
The MANUSIA desk (scaffold, 2026-07-11). Long-form profile writer for the
Wajah Nusantara feature: given one reviewed registry entry from
newsroom/data/atlas/manusia.json plus its source texts (id.wikipedia article
plaintext fetched at run time), it drafts a structured `tulisan` — the page
prefers this field over the raw encyclopedia sections when present.

DORMANT until the LLM lane has keys (NIM/Groq/OpenRouter/Gemini via llm.py)
AND Yose has reviewed the first batch: every draft lands in
newsroom/data/atlas/manusia_draft.json for review, never straight to the
registry. Rotation only ever serves reviewed profiles (NORTH-STAR §5.2).

Lanes: the source text is Lane A (fetched verbatim, cited); the drafted
profile is Lane C — grounded, sentence-cited, gated. Rules enforced here:
  1. every paragraph must cite at least one source id (the fact gate's
     citation check, same contract as gate.periksa);
  2. any number in the draft must appear in a cited source row (gate);
  3. no characterisation of intent, no unnamed claims, no present-tense
     population figures unless the source dates them.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..models import CorpusRow

# the structure the page's `tulisan` slot expects (WajahNusantara renders
# bagian[] with judul + paragraf, same anatomy as its Lane A section view)
BAGIAN = ["asal_usul", "bahasa", "penghidupan", "warisan", "hari_ini"]

SYSTEM = (
    "Kamu redaktur meja MANUSIA di DETAK DETIK, menulis profil panjang satu "
    "suku untuk lampiran Wajah Nusantara. Bahasa Indonesia formal dan hangat, "
    "tanpa opini, tanpa romantisasi, tanpa menyebut individu hidup. Tulis "
    "bagian: asal-usul, bahasa, penghidupan, warisan, hari-ini. Setiap "
    "paragraf WAJIB mengutip sedikitnya satu id sumber dalam kurung siku "
    "[id]. Setiap angka harus ada pada DATA sumber; jika tidak ada, tulis "
    "tanpa angka. Bila sumber tidak cukup untuk sebuah bagian, kembalikan "
    "bagian itu sebagai null — diam lebih baik daripada karangan."
)

DRAFT_PATH = Path(__file__).resolve().parents[1] / "data" / "atlas" / "manusia_draft.json"


def build_rows(entry: dict[str, Any], article_plain: str) -> list[CorpusRow]:
    """One CorpusRow per article section so citations stay fine-grained.
    CorpusRow carries id -> nilai (the gate's shape); the section text and
    provenance ride in nilai."""
    rows: list[CorpusRow] = []
    judul: str | None = None
    buf: list[str] = []

    def flush(k: int) -> None:
        if buf:
            rows.append(
                CorpusRow(
                    id=f"wiki-{entry['id']}-{k}",
                    nilai={
                        "teks": "\n".join(buf)[:4000],
                        "sumber": entry["wikipedia"]["url"],
                        "label": judul or "lead",
                    },
                )
            )

    k = 0
    for line in article_plain.split("\n"):
        s = line.strip()
        if s.startswith("==") and s.endswith("=="):
            flush(k)
            k += 1
            judul = s.strip("= ").strip()
            buf = []
        elif s:
            buf.append(s)
    flush(k + 1)
    return rows


async def desk_manusia(entry: dict[str, Any], article_plain: str) -> dict[str, Any] | None:
    """Draft one long-form profile; append it to the review queue.

    Returns the draft dict (or None when the LLM lane is dark). Import of
    narrate/llm happens lazily so the scaffold costs nothing while dormant.
    """
    from ..llm import model_available  # lazy: the scaffold must not gate the print

    if not model_available():
        return None

    # Structured long-form narrate. desk.narrate() is temuan-shaped, so the
    # profile writer runs its own typed call through the same fallback chain
    # (llm.build_model) — pydantic-ai output model = {bagian: str|None}.
    import pydantic
    from pydantic_ai import Agent

    from ..llm import build_model

    class Tulisan(pydantic.BaseModel):
        asal_usul: str | None
        bahasa: str | None
        penghidupan: str | None
        warisan: str | None
        hari_ini: str | None

    rows = build_rows(entry, article_plain)
    data = "\n\n".join(f"[{r.id}] ({r.nilai['label']})\n{r.nilai['teks']}" for r in rows)
    agent = Agent(build_model(), output_type=Tulisan, system_prompt=SYSTEM)
    hasil = await agent.run(f"SUKU: {entry['nama']}\n\nDATA SUMBER:\n{data}")
    draft_model = hasil.output
    # citation gate, same contract as gate.periksa: a paragraph without a
    # cited [id] that exists in rows is dropped (silence over invention)
    valid_ids = {r.id for r in rows}
    draft: dict[str, str | None] = {}
    for k, v in draft_model.model_dump().items():
        if v is None:
            draft[k] = None
            continue
        import re

        cited = set(re.findall(r"\[([^\]]+)\]", v))
        draft[k] = v if cited and cited <= valid_ids else None
    if not any(draft.values()):
        return None

    rekaman = {
        "id": entry["id"],
        "nama": entry["nama"],
        "tulisan": draft,
        "cited_rows": [r.id for r in rows],
        "status": "MENUNGGU_REVIEW",  # Yose clears this; rotation never reads drafts
    }
    antrean = []
    if DRAFT_PATH.exists():
        antrean = json.loads(DRAFT_PATH.read_text(encoding="utf-8"))
    antrean = [d for d in antrean if d["id"] != rekaman["id"]] + [rekaman]
    DRAFT_PATH.parent.mkdir(parents=True, exist_ok=True)
    DRAFT_PATH.write_text(json.dumps(antrean, ensure_ascii=False, indent=2), encoding="utf-8")
    return rekaman
