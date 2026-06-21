"""
The HUKUM desk. The first real beat, and the template for the rest: a
deterministic detector + a system prompt, handed to the shared `narrate()`
engine (see newsroom/desk.py). Detection here surfaces the largest documented
state loss among this edition's final corruption verdicts; the model only
sharpens the phrasing, under the fact-gate.

To add a beat, copy this file: write a `detect()` over that beat's rows and a
SYSTEM prompt, then a one-line `desk_x()` that calls `narrate(...)`.
"""

from __future__ import annotations

from ..desk import narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja HUKUM di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh niat atau "
    "kejahatan. Dokumen yang berbicara, bukan kamu. Hanya sebut angka yang ADA "
    "pada DATA dan pertahankan cited_ids persis. Pertajam headline (maks 160 "
    "karakter) dan body (maks 900 karakter); jangan ubah temuan_id, edisi, lens, "
    "kode, skor, signature_viz, cited_ids."
)


def _fmt(n: float) -> str:
    # id-ID grouping: dots as thousands separators
    return f"{int(round(n)):,}".replace(",", ".")


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


async def desk_hukum(
    putusan: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(putusan, edisi_no), corpus_rows, SYSTEM)
