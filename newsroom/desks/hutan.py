"""
The HUTAN desk. Detection (NEWSROOM.md section 2): the largest forest-cover loss
that overlaps a concession. The model narrates the documented hectares; the gate
checks the number. Documents speak, nobody accuses.
"""

from __future__ import annotations

from ..desk import fmt_id, narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja HUTAN di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh pihak mana pun. "
    "Sajikan tumpang tindih kehilangan tutupan hutan dengan area izin apa adanya; "
    "pembaca menilai sendiri. Hanya sebut angka yang ADA pada DATA dan pertahankan "
    "cited_ids persis. Pertajam headline (maks 160) dan body (maks 900); jangan ubah field lain."
)


def detect(alert: list[dict], edisi_no: int) -> Temuan | None:
    """Deterministic: largest hectares lost inside a concession."""
    konsesi = [a for a in alert if float(a.get("dalam_konsesi", 0)) >= 1]
    pool = konsesi or alert
    if not pool:
        return None
    lead = max(pool, key=lambda a: float(a["hektar"]))
    ha = float(lead["hektar"])
    wilayah = lead["wilayah"]
    di_konsesi = float(lead.get("dalam_konsesi", 0)) >= 1
    konsesi_frasa = (
        "area tersebut berada di dalam izin konsesi"
        if di_konsesi
        else "area tersebut di luar izin konsesi yang tercatat"
    )
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-hutan",
        edisi=edisi_no,
        lens="hutan",
        kode="nasional",
        headline=f"Tutupan hutan seluas {fmt_id(ha)} hektar hilang di {wilayah}",
        body=(
            f"Pemantauan tutupan hutan mencatat kehilangan {fmt_id(ha)} hektar di {wilayah} "
            f"dalam periode terakhir; {konsesi_frasa}. Dokumen yang menunjukkan tumpang "
            f"tindih kawasan dan izin dirujuk dari pemantauan tutupan hutan terbuka."
        ),
        cited_ids=[lead["id"]],
        skor=0.72,
        signature_viz="ember",
    )


async def desk_hutan(
    alert: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(alert, edisi_no), corpus_rows, SYSTEM)
