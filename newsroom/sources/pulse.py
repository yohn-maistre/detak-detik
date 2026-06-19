"""
Keyless public "pulse" signals + the Lane A ticker. Each numeric signal becomes a
corpus row (id -> numbers) the gate can check a finding against; the RSS headlines
ride along untouched. Any dark source is simply absent, never a crash (a Data
Hilang note, not an error). Ported from newsroom/lib/sources.ts.
"""

from __future__ import annotations

import httpx

from ..models import CorpusRow, TickerItem

_IDN = {"w": 94.5, "s": -11.3, "e": 141.2, "n": 6.3}
_TIMEOUT = httpx.Timeout(8.0)


async def gather_pulse(aksara_url: str | None) -> tuple[list[CorpusRow], list[TickerItem]]:
    corpus: list[CorpusRow] = []
    headlines: list[TickerItem] = []

    async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
        # USGS quakes, last 24h, clipped to the Indonesian bbox (keyless GeoJSON)
        try:
            r = await client.get(
                "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
            )
            feats = []
            for f in (r.json().get("features") or []):
                c = (f.get("geometry") or {}).get("coordinates")
                if c and _IDN["w"] <= c[0] <= _IDN["e"] and _IDN["s"] <= c[1] <= _IDN["n"]:
                    feats.append(f)
            if feats:
                biggest = max(feats, key=lambda f: (f.get("properties") or {}).get("mag") or 0)
                mag = (biggest.get("properties") or {}).get("mag") or 0
                corpus.append(CorpusRow(
                    id="gempa:harian",
                    nilai={"jumlah": len(feats), "magnitudo_tertinggi": round(mag * 10) / 10},
                ))
        except Exception:
            pass  # dark source

        # USD/IDR (Frankfurter, keyless)
        try:
            r = await client.get("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR")
            idr = (r.json().get("rates") or {}).get("IDR")
            if idr:
                corpus.append(CorpusRow(id="kurs:usdidr", nilai={"kurs": round(idr)}))
        except Exception:
            pass  # dark source

        # headlines via the worker /ticker (already RSS-aggregated, keyless)
        if aksara_url:
            try:
                r = await client.get(f"{aksara_url.rstrip('/')}/ticker")
                d = r.json()
                arr = d if isinstance(d, list) else []
                for x in arr[:6]:
                    if isinstance(x, dict) and isinstance(x.get("teks"), str):
                        headlines.append(TickerItem(
                            src=str(x.get("src", "")),
                            teks=x["teks"],
                            url=str(x["url"]) if x.get("url") else None,
                        ))
            except Exception:
                pass  # dark source

    return corpus, headlines
