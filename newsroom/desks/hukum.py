"""
The HUKUM desk. Detection is deterministic (SQL-shaped rules over the verdict
rows); narration is the model's only job. v1 rule: surface the largest documented
state loss among this edition's finals. The model then sharpens the headline/body
as a Temuan, and the fact-gate runs as a Pydantic AI output validator: any number
that does not trace to a cited row raises ModelRetry(reason) and the model
re-drafts with that reason (loop 2). With no model key, the deterministic,
number-only draft stands; it is gate-safe by construction.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..gate import periksa
from ..llm import build_model, model_available
from ..models import CorpusRow, Temuan

_RP = "id-ID"


def _fmt(n: float) -> str:
    # id-ID grouping: dots as thousands separators
    return f"{int(round(n)):,}".replace(",", ".")


@dataclass
class CorpusDeps:
    rows: dict[str, CorpusRow]


def detect(putusan: list[dict], edisi_no: int) -> Temuan | None:
    """Deterministic: the largest documented state loss among the finals."""
    finals = [p for p in putusan if p.get("status") == "berkekuatan hukum tetap"]
    if not finals:
        return None
    lead = max(finals, key=lambda p: float(p["kerugian_negara"]))
    kn = float(lead["kerugian_negara"])
    vonis = int(lead["vonis_bulan"])
    pengadilan = lead.get("pengadilan", "pengadilan tindak pidana korupsi")
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-hukum",
        edisi=edisi_no,
        lens="hukum",
        kode="nasional",
        headline=f"{pengadilan} memutus perkara korupsi dengan kerugian negara Rp {_fmt(kn)}",
        body=(
            f"Dalam putusan yang telah berkekuatan hukum tetap, {pengadilan} mencatat "
            f"kerugian negara sebesar Rp {_fmt(kn)} pada {lead.get('perkara', 'perkara korupsi')}, "
            f"dengan pidana penjara {vonis} bulan. Angka dirujuk dari Direktori Putusan "
            f"Mahkamah Agung; pembaca menarik kesimpulannya sendiri dari dokumen."
        ),
        cited_ids=[lead["id"]],
        skor=0.8,
        signature_viz="ledger",
    )


_SYSTEM = (
    "Kamu redaktur meja HUKUM di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh niat atau "
    "kejahatan. Dokumen yang berbicara, bukan kamu. Hanya sebut angka yang ADA "
    "pada DATA dan pertahankan cited_ids persis. Pertajam headline (maks 160 "
    "karakter) dan body (maks 900 karakter); jangan ubah temuan_id, edisi, lens, "
    "kode, skor, signature_viz, cited_ids."
)


async def desk_hukum(
    putusan: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    cand = detect(putusan, edisi_no)
    if cand is None:
        return None

    corpus_map = {r.id: r for r in corpus_rows}
    model = build_model()
    if model is None:
        return cand if periksa(cand, corpus_map) is None else None

    from pydantic_ai import Agent, ModelRetry, RunContext

    agent = Agent(
        model,
        output_type=Temuan,
        deps_type=CorpusDeps,
        system_prompt=_SYSTEM,
        retries=3,
    )

    @agent.output_validator
    async def _gate(ctx: RunContext[CorpusDeps], t: Temuan) -> Temuan:
        reason = periksa(t, ctx.deps.rows)
        if reason:
            raise ModelRetry(f"Tolak: {reason}. Perbaiki agar setiap angka cocok dengan baris tersitasi.")
        return t

    prompt = (
        f"DATA (baris tersitasi): {[corpus_map[c].model_dump() for c in cand.cited_ids]}\n"
        f"DRAF: {cand.model_dump_json()}\n"
        "Pertajam headline & body; pertahankan cited_ids dan angka persis dari DATA."
    )
    try:
        result = await agent.run(prompt, deps=CorpusDeps(rows=corpus_map))
        return result.output
    except Exception:
        # model lane failed after retries; the deterministic draft is gate-safe
        return cand if periksa(cand, corpus_map) is None else None
