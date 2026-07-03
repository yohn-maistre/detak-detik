"""
The newsroom, run by .github/workflows/newsroom.yml twice a day (Edisi Pagi /
Edisi Petang). A bounded batch mapped to the four loops:

  loop 3 (event)        : the cron triggers this; it POSTs the edition to KV.
  loop 1 (agent)        : each desk surfaces a finding, the model phrases it.
  loop 2 (verification) : every drafted finding passes the fact-gate (cited ids
                          exist + numbers match); a failure re-prompts the model
                          with the reason (Pydantic AI ModelRetry).
  loop 4 (hill-climbing): every run logs its drafts + verdicts as JSONL.

Desks fan out in parallel (hukum, harga, anggaran, hutan); the editor ranks the
survivors, picks the lead, and sets the Angka Edisi. New beats clone the desk
shape (a detector + a prompt + a one-line desk calling narrate()).
Run: `python -m newsroom.main` (from the repo root).
"""

from __future__ import annotations

import asyncio
import os
from datetime import date, datetime, timedelta, timezone

from .desks.anggaran import desk_anggaran
from .desks.data_hilang import desk_data_hilang
from .desks.harga import desk_harga
from .desks.hukum import desk_hukum
from .desks.hutan import desk_hutan
from .desks.janji import desk_janji
from .desks.papua import desk_papua
from .editor import assemble
from .gate import fact_gate
from .lawyer import redaktur_hukum
from .llm import configured_providers, model_available
from .log import Log
from .publish import publish_edisi
from .sari import tulis_sari
from .sources.anggaran import gather_anggaran
from .sources.harga import gather_harga
from .sources.hukum import gather_hukum
from .sources.hutan import gather_hutan
from .sources.janji import gather_janji, muat_buku_janji
from .sources.kliping import gather_kliping
from .sources.papua import gather_papua
from .sources.pulse import gather_pulse

# deterministic edition number: #41 = pagi, 11 Jun 2026; two sessions a day
_NOW_WIB = datetime.now(timezone.utc) + timedelta(hours=7)
SESI = "pagi" if _NOW_WIB.hour < 12 else "petang"
_EPOCH = date(2026, 6, 11)
_HARI = (date(_NOW_WIB.year, _NOW_WIB.month, _NOW_WIB.day) - _EPOCH).days
EDISI_NO = 41 + max(0, _HARI) * 2 + (1 if SESI == "petang" else 0)
TERBIT = datetime.now(timezone.utc).isoformat()


async def run() -> int:
    aksara = os.environ.get("AKSARA_URL") or os.environ.get("PUBLIC_AKSARA_URL")
    log = Log(EDISI_NO)
    log.event("mulai", edisi=EDISI_NO, sesi=SESI, model=model_available(),
              lajur=configured_providers())

    # gather every desk's corpus (each beat resilient to a dark source)
    pulse_rows, headlines = await gather_pulse(aksara)
    hukum_rows, putusan = await gather_hukum()
    harga_rows, komoditas = await gather_harga()
    anggaran_rows, pos = await gather_anggaran()
    hutan_rows, alert = await gather_hutan()
    janji_rows, janji = await gather_janji()
    papua_rows, papua = await gather_papua()
    corpus = (pulse_rows + hukum_rows + harga_rows + anggaran_rows
              + hutan_rows + janji_rows + papua_rows)
    corpus_map = {r.id: r for r in corpus}
    log.event("korpus", sinyal=[r.id for r in corpus], headlines=len(headlines))

    # the kliping desk is Lane A pass-through (verbatim headlines, no model
    # text), so it never enters the fact-gate or the lawyer; dark feeds are
    # logged here (the roster records them honestly either way)
    kliping, kliping_gelap, kliping_feeds, kliping_meta, kliping_bukti = \
        await gather_kliping(EDISI_NO)
    log.event("kliping", klaster=len(kliping), per_feed=kliping_feeds,
              gelap=kliping_gelap, judul=kliping_meta.judul,
              disusun=kliping_meta.disusun)

    # SARI (Lane C): gated overviews for the top clusters — written only from
    # each cluster's own verbatim evidence, dropped unless every number in the
    # summary appears in that evidence. Butir/lede are Lane A, built upstream.
    sari_n = await tulis_sari(kliping, kliping_bukti, log.event)
    log.event("sari", ditulis=sari_n)

    # desks run in parallel; each gates against the full corpus
    drafted = await asyncio.gather(
        desk_hukum(putusan, corpus, EDISI_NO),
        desk_harga(komoditas, corpus, EDISI_NO),
        desk_anggaran(pos, corpus, EDISI_NO),
        desk_hutan(alert, corpus, EDISI_NO),
        desk_janji(janji, corpus, EDISI_NO),
        desk_papua(papua, corpus, EDISI_NO),
    )
    drafts = [t for t in drafted if t is not None]

    # data hilang is meta: it watches for dark feeds and folds the rows it cites
    # into the shared corpus so the global gate + editor stay consistent
    dh_temuan, dh_rows = await desk_data_hilang(corpus, EDISI_NO)
    if dh_rows:
        corpus += dh_rows
        corpus_map.update({r.id: r for r in dh_rows})
    if dh_temuan is not None:
        drafts.append(dh_temuan)
    for d in drafts:
        log.event("draf", temuan_id=d.temuan_id, lens=d.lens, headline=d.headline)

    lolos, gugur = fact_gate(drafts, corpus_map)
    for t, alasan in gugur:
        log.event("gugur_gate", temuan_id=t.temuan_id, alasan=alasan)

    survivors = []
    for t in lolos:
        reviewed = await redaktur_hukum(t, corpus_map)
        if reviewed is None:
            log.event("gugur_redaktur", temuan_id=t.temuan_id)
        else:
            if reviewed.headline != t.headline:
                log.event("ditulis_ulang", temuan_id=t.temuan_id, headline=reviewed.headline)
            survivors.append(reviewed)

    buku_janji = muat_buku_janji(log.event)
    edisi = assemble(EDISI_NO, TERBIT, SESI, survivors, corpus, headlines,
                     kliping, kliping_meta, buku_janji)
    if edisi is None:
        log.event("kosong", catatan="tak ada temuan layak terbit; edisi lama dibiarkan, tidak ditimpa")
        log.close()
        return 0

    log.event("terbit", edisi=edisi.edisi, lead=edisi.lead,
              angka_edisi=edisi.angka_edisi.nilai, temuan=len(edisi.temuan))
    ok = publish_edisi(edisi)
    log.event("publish", terkirim=ok)
    log.close()
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(run()))


if __name__ == "__main__":
    main()
