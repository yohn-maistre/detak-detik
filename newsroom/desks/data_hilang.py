"""
The DATA HILANG desk: the meta-beat. It does not read a corpus of its own; it
watches which expected live signals were dark when the edition was assembled, and
reports the gap. A dark source becomes a story, not a crash (iron law: the
absence is printed, never hidden). It fires only when a feed is actually missing,
so on a healthy day it produces nothing.
"""

from __future__ import annotations

from ..desk import narrate
from ..models import CorpusRow, Temuan

SYSTEM = (
    "Kamu redaktur meja DATA HILANG di DETAK DETIK. Tulis SATU temuan sebagai objek "
    "terstruktur, bahasa Indonesia formal, tanpa opini. Catat ketiadaan data apa "
    "adanya, tanpa menuduh. Pertahankan cited_ids persis; jangan menambah angka yang "
    "tidak ada pada DATA. Pertajam headline (maks 160) dan body (maks 900)."
)

# the live signals an edition expects; missing ones become the story
EXPECTED = {
    "gempa:harian": "katalog gempa harian (USGS)",
    "kurs:usdidr": "kurs rupiah terhadap dolar AS (Frankfurter)",
}


def detect(corpus_map: dict[str, CorpusRow], edisi_no: int) -> tuple[Temuan | None, list[CorpusRow]]:
    missing = [(k, v) for k, v in EXPECTED.items() if k not in corpus_map]
    if not missing:
        return None, []
    row = CorpusRow(id="data_hilang:edisi", nilai={"jumlah_sumber_gelap": float(len(missing))})
    daftar = "; ".join(v for _, v in missing)
    return (
        Temuan(
            temuan_id=f"tmn-{edisi_no}-data_hilang",
            edisi=edisi_no,
            lens="data_hilang",
            kode="nasional",
            headline="Sebagian sumber data terbuka tidak dapat dijangkau saat edisi ini disusun",
            body=(
                f"Saat edisi ini disusun, sumber berikut tidak merespons: {daftar}. "
                f"Ketiadaan ini dicatat, bukan disembunyikan; angka yang bergantung "
                f"padanya memakai sampel berlabel hingga sumber kembali tersedia."
            ),
            cited_ids=["data_hilang:edisi"],
            skor=0.4,
            signature_viz="ledger",
        ),
        [row],
    )


async def desk_data_hilang(
    corpus_rows: list[CorpusRow], edisi_no: int
) -> tuple[Temuan | None, list[CorpusRow]]:
    """Returns the finding plus the meta rows it cites, so the orchestrator can
    fold those rows into the shared corpus (the global gate + editor must see them)."""
    corpus_map = {r.id: r for r in corpus_rows}
    temuan, extra = detect(corpus_map, edisi_no)
    if temuan is None:
        return None, []
    final = await narrate(temuan, corpus_rows + extra, SYSTEM)
    return final, extra
