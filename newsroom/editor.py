"""
The editor: ranks survivors by skor, picks the lead, fills the Angka Edisi (the
day's single most striking cited number), and assembles the Edisi the worker will
store. The ticker is carried through verbatim (Lane A, no model). With one desk
the lead is the hukum finding; the Angka Edisi is the month's documented total
state loss, cited to the hukum:kerugian_bulan row.
"""

from __future__ import annotations

from .models import AngkaEdisi, CorpusRow, Edisi, LiveTemuan, TickerItem, Temuan


def pick_angka(corpus_rows: list[CorpusRow]) -> AngkaEdisi | None:
    rows = {r.id: r for r in corpus_rows}
    bulan = rows.get("hukum:kerugian_bulan")
    if bulan and isinstance(bulan.nilai.get("total"), (int, float)):
        return AngkaEdisi(
            nilai=float(bulan.nilai["total"]),
            prefix="Rp",
            label="Total kerugian negara dalam vonis korupsi yang diputus bulan ini.",
            cited_ids=["hukum:kerugian_bulan"],
        )
    return None


def assemble(
    edisi_no: int,
    terbit: str,
    sesi: str,
    survivors: list[Temuan],
    corpus_rows: list[CorpusRow],
    ticker: list[TickerItem],
) -> Edisi | None:
    angka = pick_angka(corpus_rows)
    if not survivors or angka is None:
        return None

    ranked = sorted(survivors, key=lambda t: t.skor, reverse=True)
    lead = ranked[0]
    return Edisi(
        edisi=edisi_no,
        terbit=terbit,
        sesi=sesi,  # type: ignore[arg-type]
        angka_edisi=angka,
        lead=lead.temuan_id,
        dek="Bukti paling menonjol dari putusan korupsi yang berkekuatan hukum tetap, diperiksa terhadap sumbernya.",
        temuan=[LiveTemuan(lens=t.lens, headline=t.headline, body=t.body) for t in ranked],
        ticker=ticker,
    )
