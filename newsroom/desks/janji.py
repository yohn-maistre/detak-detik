"""
The JANJI desk. Detection (NEWSROOM.md section 2): the official program with the
largest shortfall of realisation against target. Documents speak: target vs
realisation, side by side, no verdict on intent.
"""

from __future__ import annotations

from ..desk import fmt_id, narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja JANJI di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh. Sajikan "
    "target resmi dan realisasinya berdampingan; pembaca menilai sendiri. Hanya "
    "sebut angka yang ADA pada DATA dan pertahankan cited_ids persis. Jangan tulis "
    "tahun sebagai angka. Pertajam headline (maks 160) dan body (maks 900); jangan ubah field lain."
)


def detect(janji: list[dict], edisi_no: int) -> Temuan | None:
    """Deterministic: the program with the largest target-minus-realisation gap."""
    if not janji:
        return None
    lead = max(janji, key=lambda j: float(j["target"]) - float(j["realisasi"]))
    target = float(lead["target"])
    realisasi = float(lead["realisasi"])
    program = lead["program"]
    satuan = lead.get("satuan", "")
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-janji",
        edisi=edisi_no,
        lens="janji",
        kode="nasional",
        headline=f"{program.capitalize()}: target {fmt_id(target)} {satuan}, terealisasi {fmt_id(realisasi)} {satuan}",
        body=(
            f"Dokumen perencanaan mencatat target {fmt_id(target)} {satuan} untuk {program}, "
            f"dengan realisasi {fmt_id(realisasi)} {satuan} pada periode pelaporan terakhir. "
            f"Selisihnya disajikan apa adanya; angka dirujuk dari laporan resmi."
        ),
        cited_ids=[lead["id"]],
        skor=0.62,
        signature_viz="ganda",
    )


async def desk_janji(
    janji: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(janji, edisi_no), corpus_rows, SYSTEM)
