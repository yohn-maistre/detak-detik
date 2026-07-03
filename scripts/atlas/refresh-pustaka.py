#!/usr/bin/env python3
"""
PUSTAKA & PIKIRAN — the REFRESH pipeline (§13.13 doctrine: the roster is
curated and reviewed; every API-sourced field is re-pulled on a schedule,
so the section is continuous, not one-time research).

The ROSTER (which ten pens; id/nama/peran/karya + its curated catatan) is
read from newsroom/data/atlas/pustaka.json and NEVER edited here. What
refreshes per run, from id.wikipedia REST summary:
  - ringkas     (the verbatim encyclopedia lead — replaced with the latest)
  - deskripsi   (the one-line wikidata description)
  - wikipedia.url (canonical page url, in case of renames)
Wikimedia requests are spaced >= 2.2s (shared etiquette with the sibling
refreshers). A row whose fetch fails keeps its reviewed text — the frame
never empties.

Run: python3 scripts/atlas/refresh-pustaka.py
"""
import json, sys, time, urllib.parse, urllib.request

REGISTRY = __file__.rsplit("/scripts/", 1)[0] + "/newsroom/data/atlas/pustaka.json"
UA = "detak-detik-factdesk/1.0 (civic newspaper; https://detak-detik) python-urllib"
WM_GAP = 2.2
_last = [0.0]


def wm_get(url, timeout=15):
    dt = time.time() - _last[0]
    if dt < WM_GAP:
        time.sleep(WM_GAP - dt)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    finally:
        _last[0] = time.time()


def main():
    rows = json.load(open(REGISTRY, encoding="utf-8"))
    segar, tetap = 0, 0
    for r in rows:
        judul = r.get("wikipedia", {}).get("judul") or r["nama"].replace(" ", "_")
        try:
            d = wm_get("https://id.wikipedia.org/api/rest_v1/page/summary/"
                       + urllib.parse.quote(judul))
            ex = (d.get("extract") or "").strip()
            if ex and len(ex) >= 80:  # a real lead, not a stub or disambig
                r["ringkas"] = ex
                if d.get("description"):
                    r["deskripsi"] = d["description"]
                url = ((d.get("content_urls") or {}).get("desktop") or {}).get("page")
                if url:
                    r["wikipedia"]["url"] = url
                segar += 1
                print(f"  ok    {r['id']} ({len(ex)} huruf)")
            else:
                tetap += 1
                print(f"  tetap {r['id']} (lead pendek/kosong — teks tinjauan bertahan)")
        except Exception as e:  # noqa: BLE001 — any fetch failure keeps the reviewed text
            tetap += 1
            print(f"  tetap {r['id']} ({e})")

    json.dump(rows, open(REGISTRY, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"OK -> {REGISTRY} · {segar} disegarkan · {tetap} bertahan pada teks tinjauan")
    return 0


if __name__ == "__main__":
    sys.exit(main())
