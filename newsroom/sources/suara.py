"""
The SUARA lanes: institutions' and parties' OWN publications, verbatim.

Lane A discipline throughout: headline + lede exactly as published, a
date, and the link — no model, no rewrite, no stance. The archive is
what lets the page say "this is what the institution itself said today"
with the institution's own URL as the receipt, and — just as loudly —
"this party's site publishes no machine-readable voice" (absence is
content; only 2 of 8 DPR parties expose a feed, probed 2026-07-05,
cookbook: docs/research/2026-07-05-pantau-partai-pengawas.md).

Lanes (all probed GOLD 2026-07-05):
  dewan     emedia.dpr.go.id — DPR's own media arm (the side door around
            the Cloudflare-walled main site), full-text, intraday
  kemhan    Kemhan press feed (full-text, ~daily)
  tniad     TNI AD feed (the only structured aparat surface)
  gerindra / pks     the two machine-readable party voices
  kontras / icw      independent monitors (pengawas frame)

Rows are SLIM (no full bodies — archive-slim law): headline, 280-char
lede, date, lane, cabang. Stdlib only; models lazy; a dark feed leaves
its lane's rows as-were.
"""

from __future__ import annotations

import hashlib
import json
from datetime import date

from ..pantau import DATA, ambil, muat_arsip, parse_rss, simpan_arsip

_ARSIP = DATA / "suara_negara.json"
SIMPAN_PER_LAJUR = 60

LANES: tuple[dict, ...] = (
    {"id": "dewan", "lembaga": "DPR RI · e-Media", "cabang": "legislatif",
     "feed": "https://emedia.dpr.go.id/rss.xml"},
    {"id": "kemhan", "lembaga": "Kemhan", "cabang": "aparat",
     "feed": "https://www.kemhan.go.id/feed"},
    {"id": "tniad", "lembaga": "TNI AD", "cabang": "aparat",
     "feed": "https://tniad.mil.id/feed/"},
    {"id": "gerindra", "lembaga": "Partai Gerindra", "cabang": "partai",
     "feed": "https://gerindra.id/feed/", "partai": "gerindra"},
    {"id": "pks", "lembaga": "PKS", "cabang": "partai",
     "feed": "https://pks.id/rss/", "partai": "pks"},
    {"id": "kontras", "lembaga": "KontraS", "cabang": "pengawas",
     "feed": "https://kontras.org/feed/"},
    {"id": "icw", "lembaga": "ICW · antikorupsi.org", "cabang": "pengawas",
     "feed": "https://antikorupsi.org/rss.xml"},
)


def muat_suara() -> list[dict]:
    return muat_arsip(_ARSIP, "baris")


def panen() -> dict:
    arsip = {r["url"]: r for r in muat_suara()}
    baru = 0
    gelap: list[str] = []
    for lane in LANES:
        try:
            mentah = ambil(lane["feed"])
        except Exception:
            gelap.append(lane["id"])
            continue
        for item in parse_rss(mentah):
            if item["url"] in arsip:
                continue
            row = {
                "id": hashlib.sha1(item["url"].encode()).hexdigest()[:12],
                "url": item["url"],
                "judul": item["judul"],
                "ringkas": item.get("ringkas") or None,
                "tanggal": item["terbit"],
                "kanal": lane["id"],
                "lembaga": lane["lembaga"],
                "cabang": lane["cabang"],
            }
            if lane.get("partai"):
                row["partai"] = lane["partai"]
            arsip[item["url"]] = row
            baru += 1
    # prune PER LANE so a chatty feed never evicts a quiet one's history
    per: dict[str, list[dict]] = {}
    for r in arsip.values():
        per.setdefault(r["kanal"], []).append(r)
    rows: list[dict] = []
    for kanal, batch in per.items():
        batch.sort(key=lambda r: r.get("tanggal") or "", reverse=True)
        rows.extend(batch[:SIMPAN_PER_LAJUR])
    if len(gelap) < len(LANES):
        simpan_arsip(
            _ARSIP, rows,
            catatan=("Arsip suara resmi — judul + lede VERBATIM (Lane A) dari kanal "
                     "publikasi lembaga, partai, dan pemantau independen; dipanen "
                     "newsroom/sources/suara.py tanpa model. Setiap baris mengutip "
                     "terbitannya. Partai tanpa umpan mesin dicetak sebagai ketiadaan "
                     "di halaman, bukan disembunyikan."),
            sumber=[lane["feed"] for lane in LANES],
            kunci="baris",
            maks=len(LANES) * SIMPAN_PER_LAJUR,
            urut=("tanggal",),
        )
    return {"total_arsip": len(rows), "baru": baru, "gelap": gelap}


async def gather_suara() -> tuple[list, dict]:
    """Corpus rows: today's freshest headline per lane (citable verbatim)."""
    from ..models import CorpusRow

    ringkas = panen()
    rows_arsip = muat_suara()
    terbaru: dict[str, dict] = {}
    for r in rows_arsip:  # newest-first
        terbaru.setdefault(r["kanal"], r)
    rows = []
    for kanal, r in terbaru.items():
        rows.append(CorpusRow(id=f"suara:{kanal}", nilai={
            "judul": r["judul"][:160],
            "lembaga": r["lembaga"],
            "tanggal": r["tanggal"],
            "url": r["url"],
        }))
    ringkas["lajur_terisi"] = len(terbaru)
    return rows, ringkas


if __name__ == "__main__":
    print(json.dumps(panen(), ensure_ascii=False))
