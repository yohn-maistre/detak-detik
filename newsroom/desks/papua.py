"""
The PAPUA desk. Detection (v1): lead with the documented special-autonomy
allocation (a gate-checkable rupiah figure), with the poverty gap as context.
Neutral, sourced; the lens carries the editorial care of AMD-LENSES-PAPUA.
"""

from __future__ import annotations

from ..desk import fmt_id, narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja PAPUA di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini, tanpa menuduh, hormat pada "
    "warga Papua. Sajikan alokasi resmi dan indikator pembangunan apa adanya; "
    "pembaca menilai sendiri. Hanya sebut angka yang ADA pada DATA dan pertahankan "
    "cited_ids persis. Pertajam headline (maks 160) dan body (maks 900); jangan ubah field lain."
)


def _triliun(n: float) -> str:
    return f"{n / 1e12:.1f}".replace(".", ",") if n >= 1e12 else fmt_id(n)


def detect(rows_raw: list[dict], edisi_no: int) -> Temuan | None:
    by_id = {r["id"]: r for r in rows_raw}
    otsus = by_id.get("papua:otsus")
    miskin = by_id.get("papua:kemiskinan")
    if not otsus:
        return None
    nilai = float(otsus["nilai"])
    cited = ["papua:otsus"]
    konteks = ""
    if miskin:
        cited.append("papua:kemiskinan")
        p = f"{float(miskin['nilai_persen']):.0f}"
        n = f"{float(miskin['nasional_persen']):.0f}"
        konteks = (
            f" Pada periode yang sama, tingkat kemiskinan di Tanah Papua tercatat {p} persen, "
            f"terhadap rata-rata nasional {n} persen."
        )
    return Temuan(
        temuan_id=f"tmn-{edisi_no}-papua",
        edisi=edisi_no,
        lens="papua",
        kode="papua",
        headline=f"Dana otonomi khusus untuk Tanah Papua mencapai Rp {_triliun(nilai)} triliun",
        body=(
            f"Dokumen anggaran mencatat alokasi dana otonomi khusus untuk Tanah Papua "
            f"sebesar Rp {_triliun(nilai)} triliun pada periode berjalan.{konteks} "
            f"Angka dirujuk dari sumber resmi; pembaca menarik kesimpulannya sendiri."
        ),
        cited_ids=cited,
        skor=0.66,
        signature_viz="struk",
    )


async def desk_papua(
    rows_raw: list[dict], corpus_rows: list[CorpusRow], edisi_no: int
) -> Temuan | None:
    return await narrate(detect(rows_raw, edisi_no), corpus_rows, SYSTEM)
