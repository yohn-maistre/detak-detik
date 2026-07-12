"""
The editor: ranks survivors by skor, picks the lead, fills the Angka Edisi (the
day's single most striking cited number), and assembles the Edisi the worker will
store. The ticker is carried through verbatim (Lane A, no model).

The Angka Edisi is the corruption-loss total when the HUKUM desk runs (the Act II
odometer + its rupiah denominators are built around a loss figure); if HUKUM is
dark, it falls back to the largest cited number among survivors so the edition
still publishes.
"""

from __future__ import annotations

from .models import (AngkaEdisi, CorpusRow, Edisi, Janji, Kliping, KlipingMeta,
                     LiveTemuan, TickerItem, Temuan)

# the front page carries at most this many story clusters
_KLIPING_MAKS = 12


def pick_angka(corpus_rows: list[CorpusRow], lead: Temuan | None) -> AngkaEdisi | None:
    rows = {r.id: r for r in corpus_rows}
    bulan = rows.get("hukum:kerugian_bulan")
    if bulan and isinstance(bulan.nilai.get("total"), (int, float)):
        return AngkaEdisi(
            nilai=float(bulan.nilai["total"]),
            prefix="Rp",
            label="Total kerugian negara dalam vonis korupsi yang diputus bulan ini.",
            cited_ids=["hukum:kerugian_bulan"],
        )
    # fallback: the largest number the lead actually cites, with a neutral label
    if lead is not None:
        best = 0.0
        for cid in lead.cited_ids:
            for v in rows.get(cid, CorpusRow(id="", nilai={})).nilai.values():
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    best = max(best, float(v))
        if best > 0:
            return AngkaEdisi(
                nilai=best,
                prefix="Rp",
                label="Angka paling menonjol dalam edisi ini.",
                cited_ids=list(lead.cited_ids),
            )
    return None


def assemble(
    edisi_no: int,
    terbit: str,
    sesi: str,
    survivors: list[Temuan],
    corpus_rows: list[CorpusRow],
    ticker: list[TickerItem],
    kliping: list[Kliping] | None = None,
    kliping_meta: KlipingMeta | None = None,
    janji: list[Janji] | None = None,
) -> Edisi | None:
    if not survivors:
        return None
    ranked = sorted(survivors, key=lambda t: t.skor, reverse=True)
    lead = ranked[0]
    angka = pick_angka(corpus_rows, lead)
    if angka is None:
        return None

    # rack order: the Eisenhower matrix (peringkat.py) leads, ownership
    # diversity breaks ties; unranked runs (dead lane) keep diversity order
    def _urut(k: Kliping) -> tuple[int, int]:
        total = sum(v for v in (k.matriks or {}).values() if isinstance(v, int))
        return (total * 10 + k.skor, k.skor)

    kliping_final = (sorted(kliping, key=_urut, reverse=True)[:_KLIPING_MAKS]
                     if kliping else None)
    if kliping_meta is not None:
        # the meta's klaster counts what the front page actually shows, so it is
        # re-stamped here after the cap
        kliping_meta = kliping_meta.model_copy(
            update={"klaster": len(kliping_final or [])})

    # №1 (Yose, 2026-07-13): the top-ranked CLUSTER is the lead — verbatim
    # Lane A headline, machine-ranked, clicking it opens its lembar. The desk
    # findings follow, each carrying its honesty flag while its corpus is a
    # committed seed.
    temuan_live = [LiveTemuan(lens=t.lens, headline=t.headline, body=t.body,
                              temuan_id=t.temuan_id, contoh=t.contoh or None)
                   for t in ranked]
    lead_id = lead.temuan_id
    dek = "Temuan paling menonjol edisi ini, diperiksa terhadap sumbernya sebelum naik cetak."
    if kliping_final:
        utama = kliping_final[0]
        temuan_live.insert(0, LiveTemuan(
            lens="pers",
            headline=utama.utama.judul,        # verbatim, Lane A
            body=utama.sari or (utama.utama.ringkas or ""),
            temuan_id=utama.id,
        ))
        lead_id = utama.id
        dek = (utama.sari
               or "Peristiwa dengan peringkat tertinggi edisi ini; judul apa adanya dari medianya.")

    return Edisi(
        edisi=edisi_no,
        terbit=terbit,
        sesi=sesi,  # type: ignore[arg-type]
        angka_edisi=angka,
        lead=lead_id,
        dek=dek,
        temuan=temuan_live,
        ticker=ticker,
        # kliping is Lane A pass-through (verbatim headlines, no model text), so
        # it skips the fact-gate and the lawyer by design
        kliping=kliping_final,
        kliping_meta=kliping_meta,
        # buku besar rows: registry-sourced, statuses recomputed mechanically
        # by the janji desk each run (see sources/janji.muat_buku_janji)
        janji=janji or None,
    )
