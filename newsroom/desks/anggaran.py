"""
The ANGGARAN desk. Detection (v1): the budget aggregate worth surfacing, framed
neutrally (belanja pegawai vs total). The per-region personnel-spending outlier
rule (NEWSROOM.md section 2) lands once subnational data is wired.
"""

from __future__ import annotations

from ..desk import fmt_id, narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja ANGGARAN di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh pemborosan. "
    "Dokumen anggaran yang berbicara; sajikan proporsi apa adanya. Hanya sebut angka "
    "yang ADA pada DATA dan pertahankan cited_ids persis. Jangan tulis tahun sebagai "
    "angka. Pertajam headline (maks 160) dan body (maks 900); jangan ubah field lain."
)


def _triliun(n: float) -> str:
    return fmt_id(n / 1e12) if n >= 1e12 else fmt_id(n)


def detect(pos: list[dict], edisi_no: int) -> Temuan | None:
    """Deterministic: surface the personnel-spending share of total spending."""
    if not pos:
        return None
    lead = pos[0]
    bp = float(lead["belanja_pegawai"])
    total = float(lead["total_belanja"])
    rasio = f"{float(lead['rasio_persen']):.1f}".replace(".", ",")
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-anggaran",
        edisi=edisi_no,
        lens="anggaran",
        kode="nasional",
        headline=f"Belanja pegawai menyerap Rp {_triliun(bp)} triliun dari total belanja negara Rp {_triliun(total)} triliun",
        body=(
            f"Berdasarkan dokumen anggaran, belanja pegawai mencapai Rp {_triliun(bp)} triliun, "
            f"atau sekitar {rasio} persen dari total belanja negara sebesar Rp {_triliun(total)} triliun. "
            f"Angka dirujuk dari Nota Keuangan Kementerian Keuangan."
        ),
        cited_ids=[lead["id"]],
        skor=0.65,
        signature_viz="struk",
    )


async def desk_anggaran(
    pos: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(pos, edisi_no), corpus_rows, SYSTEM)
