"""
Redaktur Hukum: a second model pass over gate survivors, the project's legal
seatbelt (docs/EDITORIAL_GUIDELINES.md). It reviews each finding for the one rule
that matters most here, "documents speak, nobody accuses": does any sentence
characterise intent, allege a crime, or imply causation the data does not show?
If so, rewrite to neutral connective language, or kill. A rewrite must survive the
fact-gate again (citations cannot be lost in the edit). With no model key the
deterministic draft is already neutral by construction, so it passes through.
"""

from __future__ import annotations

from pydantic import BaseModel

from .gate import periksa
from .llm import build_model
from .models import CorpusRow, Temuan


class LawyerOutput(BaseModel):
    lolos: bool
    alasan: str = ""
    headline: str | None = None  # neutral rewrite, if needed
    body: str | None = None


_SYSTEM = (
    "Kamu Redaktur Hukum DETAK DETIK. Hukum besi: dokumen yang berbicara, tidak "
    "ada yang menuduh. Periksa temuan: apakah ada kalimat yang mengkarakterisasi "
    "niat, menuduh tindak pidana di luar amar putusan, atau menyiratkan sebab "
    "yang tidak ditunjukkan data? Jika ada, tulis ulang ke bahasa penghubung yang "
    "netral (lolos=true, sertakan headline/body baru), atau gugurkan (lolos=false "
    "dengan alasan). Jangan menambah atau mengubah angka. Jika sudah netral, "
    "lolos=true tanpa menulis ulang."
)


async def redaktur_hukum(temuan: Temuan, corpus: dict[str, CorpusRow]) -> Temuan | None:
    model = build_model()
    if model is None:
        return temuan  # deterministic copy is neutral by construction

    from pydantic_ai import Agent

    agent = Agent(model, output_type=LawyerOutput, system_prompt=_SYSTEM, retries=2)
    try:
        result = await agent.run(temuan.model_dump_json())
    except Exception:
        return temuan  # lawyer lane down: keep the gate-clean original

    verdict = result.output
    if not verdict.lolos:
        return None  # killed

    if verdict.headline or verdict.body:
        revised = temuan.model_copy(update={
            "headline": (verdict.headline or temuan.headline)[:160],
            "body": (verdict.body or temuan.body)[:900],
        })
        # a rewrite that drops a citation or a number fails the gate -> keep original
        return revised if periksa(revised, corpus) is None else temuan
    return temuan
