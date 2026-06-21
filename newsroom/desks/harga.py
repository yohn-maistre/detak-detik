"""
The HARGA desk. Detection: the strategic food commodity with the largest price
move this period. The model narrates the documented price; the gate checks it.
"""

from __future__ import annotations

from ..desk import fmt_id, narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja HARGA di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini. Laporkan pergerakan harga "
    "pangan apa adanya; jangan menuduh penyebab yang tak ditunjukkan data. Hanya "
    "sebut angka yang ADA pada DATA dan pertahankan cited_ids persis. Pertajam "
    "headline (maks 160) dan body (maks 900); jangan ubah field selain headline/body."
)


def detect(komoditas: list[dict], edisi_no: int) -> Temuan | None:
    """Deterministic: the commodity with the largest absolute price change."""
    if not komoditas:
        return None
    lead = max(komoditas, key=lambda k: abs(float(k["delta_pct"])))
    nama = lead["nama"]
    harga = float(lead["harga"])
    delta = float(lead["delta_pct"])
    satuan = lead.get("satuan", "per kilogram")
    arah = "naik" if delta >= 0 else "turun"
    pct = f"{abs(delta):.1f}".replace(".", ",")
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-harga",
        edisi=edisi_no,
        lens="harga",
        kode="nasional",
        headline=f"Harga {nama} {arah} {pct} persen menjadi Rp {fmt_id(harga)} {satuan}",
        body=(
            f"Harga rata-rata nasional {nama} tercatat Rp {fmt_id(harga)} {satuan}, "
            f"{arah} {pct} persen dalam periode pemantauan terakhir. Angka dirujuk dari "
            f"Panel Harga Badan Pangan Nasional."
        ),
        cited_ids=[lead["id"]],
        skor=0.6,
        signature_viz="wave",
    )


async def desk_harga(
    komoditas: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(komoditas, edisi_no), corpus_rows, SYSTEM)
