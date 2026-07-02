"""
The KLIPING desk source: the Ground-News-style clustered front page, localized to
Indonesia's media-ownership axis. It fetches every live feed in the ownership
roster (data/media_roster.json), clusters the last 48h of headlines by title
similarity, and scores each cluster by ownership diversity, not volume: a story
corroborated across distinct groups outranks one echoed inside a single
conglomerate. A cluster whose coverage never leaves one group is a titik buta.

v1 is fully deterministic (stdlib only, no LLM, no keys): token Jaccard plus a
shared-significant-tokens rule, joined single-link via union-find. Headlines are
verbatim Lane A text; a dark feed becomes a note, never a crash.

Local test (no publish): `python3 -m newsroom.sources.kliping` from the repo root.
"""

from __future__ import annotations

import asyncio
import gzip
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

from ..models import Kliping, KlipingItem

_ROSTER = Path(__file__).resolve().parent.parent / "data" / "media_roster.json"
_TIMEOUT = 10
_JENDELA_JAM = 48
_WIB = timezone(timedelta(hours=7))

# a realistic browser UA; these outlets' WAF/CDN 403s datacenter agents
_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    "Accept-Language": "id,en;q=0.8",
}

# clustering thresholds (deterministic, calibrated on live feeds 2026-07-02)
_JACCARD_MIN = 0.32
_TOKEN_PANJANG_MIN = 4
_TOKEN_SAMA_MIN = 3

# Indonesian function words stripped before comparing titles
_STOPWORDS = frozenset({
    "yang", "di", "ke", "dari", "untuk", "dan", "dengan", "pada", "ini", "itu",
    "akan", "dalam", "soal", "usai", "jadi", "tak", "tidak", "bukan", "ada",
    "saat", "karena", "telah", "sudah", "bakal", "kata", "sebut", "hingga",
    "agar", "bagi", "oleh", "para", "atas", "antara", "masih", "saja", "juga",
    "bisa", "dapat", "kini", "lagi", "buat", "usung", "punya", "adalah",
})


def _muat_roster() -> list[dict]:
    try:
        return list(json.loads(_ROSTER.read_text(encoding="utf-8")).get("media", []))
    except Exception:
        return []


def _ambil(url: str) -> str:
    percobaan_terakhir: Exception | None = None
    for _ in range(2):  # one retry; flaky egress must not mislabel a live feed
        try:
            req = urllib.request.Request(url, headers=_HEADERS)
            with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
                raw = resp.read()
            if raw[:2] == b"\x1f\x8b":  # some CDNs gzip even without Accept-Encoding
                raw = gzip.decompress(raw)
            return raw.decode("utf-8", errors="replace")
        except Exception as exc:
            percobaan_terakhir = exc
    raise percobaan_terakhir  # type: ignore[misc]


_CDATA = re.compile(r"^\s*<!\[CDATA\[(.*?)\]\]>\s*$", re.S)


def _bersih_teks(teks: str) -> str:
    m = _CDATA.match(teks)
    if m:
        teks = m.group(1)
    return html.unescape(teks).strip()


def _parse_items(xml_text: str) -> list[tuple[str, str, str]]:
    """(judul, url, pubdate) per item. xml.etree first; several Indonesian feeds
    ship malformed XML, so fall back to the regex pass worker/src/index.ts uses."""
    items: list[tuple[str, str, str]] = []
    try:
        root = ET.fromstring(xml_text)
        for it in root.iter("item"):
            judul = _bersih_teks(it.findtext("title") or "")
            url = _bersih_teks(it.findtext("link") or "")
            pub = (it.findtext("pubDate") or "").strip()
            if judul and url:
                items.append((judul, url, pub))
    except ET.ParseError:
        pass
    if items:
        return items
    for m in re.finditer(r"<item[\s>]([\s\S]*?)</item>", xml_text):
        blok = m.group(1)
        judul = re.search(r"<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</title>", blok)
        url = re.search(r"<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</link>", blok)
        pub = re.search(r"<pubDate>([\s\S]*?)</pubDate>", blok)
        if judul and url:
            j = html.unescape(judul.group(1)).strip()
            u = html.unescape(url.group(1)).strip()
            if j and u:
                items.append((j, u, pub.group(1).strip() if pub else ""))
    return items


def _dalam_jendela(pub: str, batas: datetime) -> bool:
    """Keep an item when its pubDate is inside the window; a missing or broken
    date keeps the item (these are latest-first feeds, dropping would lie)."""
    if not pub:
        return True
    try:
        kapan = parsedate_to_datetime(pub)
    except Exception:
        return True
    if kapan.tzinfo is None:  # naive dates from Indonesian outlets are WIB
        kapan = kapan.replace(tzinfo=_WIB)
    return kapan >= batas


def _tokens(judul: str) -> frozenset[str]:
    bersih = re.sub(r"[\W_]+", " ", judul.lower(), flags=re.UNICODE)
    return frozenset(t for t in bersih.split() if t not in _STOPWORDS)


def _serumpun(a: frozenset[str], b: frozenset[str]) -> bool:
    """Deterministic join rule: token Jaccard >= 0.32 OR >= 3 shared significant
    tokens (length >= 4)."""
    if not a or not b:
        return False
    irisan = a & b
    if not irisan:
        return False
    if len(irisan) / len(a | b) >= _JACCARD_MIN:
        return True
    return sum(1 for t in irisan if len(t) >= _TOKEN_PANJANG_MIN) >= _TOKEN_SAMA_MIN


class _UnionFind:
    def __init__(self, n: int) -> None:
        self.induk = list(range(n))

    def cari(self, x: int) -> int:
        while self.induk[x] != x:
            self.induk[x] = self.induk[self.induk[x]]
            x = self.induk[x]
        return x

    def gabung(self, a: int, b: int) -> None:
        ra, rb = self.cari(a), self.cari(b)
        if ra != rb:
            self.induk[max(ra, rb)] = min(ra, rb)


def _ambil_feed(outlet: dict, batas: datetime) -> list[dict]:
    """Fetch + parse one roster feed into raw items; raises on a dark feed so the
    caller can note it (a dark source is a Data Hilang note, never a crash). A
    feed that responds but has published nothing inside the window is quiet, not
    dark, and simply returns an empty list."""
    mentah = _ambil(outlet["feed"])
    parsed = _parse_items(mentah)
    if not parsed:
        raise ValueError("umpan tidak berisi item")
    items = []
    terlihat: set[str] = set()
    for judul, url, pub in parsed:
        if url in terlihat or not _dalam_jendela(pub, batas):
            continue
        terlihat.add(url)
        items.append({
            "media": outlet["nama"],
            "grup": outlet["grup"],
            "independen": bool(outlet.get("independen")),
            "judul": judul,
            "url": url,
            "tokens": _tokens(judul),
        })
    return items


def _klaster(items: list[dict]) -> list[list[dict]]:
    """Single-link agglomerative pass over normalized titles via union-find."""
    uf = _UnionFind(len(items))
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if _serumpun(items[i]["tokens"], items[j]["tokens"]):
                uf.gabung(i, j)
    kelompok: dict[int, list[dict]] = {}
    for i, it in enumerate(items):
        kelompok.setdefault(uf.cari(i), []).append(it)
    return list(kelompok.values())


def _susun_kliping(anggota: list[dict], edisi_no: int, urut: int) -> Kliping:
    # one item per outlet (its longest title in the cluster), so n_media counts
    # outlets and the liputan footer stays one line per outlet
    per_media: dict[str, dict] = {}
    for it in sorted(anggota, key=lambda x: (len(x["judul"]), x["judul"])):
        per_media[it["media"]] = it
    wakil = sorted(
        per_media.values(),
        key=lambda x: (not x["independen"], -len(x["judul"]), x["judul"]),
    )
    # representative headline: the longest verbatim title from an independent
    # outlet when one covered the story, else the longest overall (Lane A text)
    utama = wakil[0]
    liputan = sorted(
        (w for w in wakil if w is not utama),
        key=lambda x: (x["grup"], x["media"]),
    )
    n_media = len(per_media)
    n_grup = len({w["grup"] for w in per_media.values()})
    return Kliping(
        id=f"klp-{edisi_no}-{urut:02d}",
        utama=KlipingItem(judul=utama["judul"], url=utama["url"],
                          media=utama["media"], grup=utama["grup"],
                          independen=utama["independen"]),
        liputan=[KlipingItem(judul=w["judul"], url=w["url"],
                             media=w["media"], grup=w["grup"],
                             independen=w["independen"]) for w in liputan],
        n_media=n_media,
        n_grup=n_grup,
        skor=n_grup * 2 + n_media,  # corroboration by ownership diversity, not volume
        titik_buta=n_media >= 2 and n_grup == 1,
        tumbuh=False,  # delta vs the previous edition lands in v2
    )


async def gather_kliping(edisi_no: int) -> tuple[list[Kliping], list[str], dict[str, int]]:
    """Fetch every live roster feed, cluster the 48h window, score by ownership
    diversity. Returns (clusters sorted by skor desc, dark feed names, items per
    feed). Only clusters seen by at least two outlets surface; a single-outlet
    headline is a ticker item, not a corroborated story."""
    roster = _muat_roster()
    batas = datetime.now(timezone.utc) - timedelta(hours=_JENDELA_JAM)
    hidup = [m for m in roster if m.get("feed")]
    gelap = [m["nama"] for m in roster if not m.get("feed")]

    hasil = await asyncio.gather(
        *(asyncio.to_thread(_ambil_feed, m, batas) for m in hidup),
        return_exceptions=True,
    )
    items: list[dict] = []
    per_feed: dict[str, int] = {}
    for outlet, got in zip(hidup, hasil):
        if isinstance(got, BaseException):
            gelap.append(outlet["nama"])
            per_feed[outlet["nama"]] = 0
        else:
            items.extend(got)
            per_feed[outlet["nama"]] = len(got)

    kliping: list[Kliping] = []
    kandidat = [c for c in _klaster(items) if len({x["media"] for x in c}) >= 2]
    kandidat.sort(key=lambda c: (-len({x["grup"] for x in c}) * 2 - len({x["media"] for x in c}),
                                 min(x["url"] for x in c)))
    for urut, anggota in enumerate(kandidat, start=1):
        kliping.append(_susun_kliping(anggota, edisi_no, urut))
    return kliping, gelap, per_feed


def _cetak_laporan() -> None:
    kliping, gelap, per_feed = asyncio.run(gather_kliping(0))
    print("== item per feed ==")
    for nama, n in per_feed.items():
        print(f"  {nama}: {n}")
    if gelap:
        print(f"== feed gelap: {', '.join(gelap)}")
    print(f"== klaster (>= 2 media): {len(kliping)}")
    for k in kliping[:5]:
        print(f"  [{k.skor}] media={k.n_media} grup={k.n_grup} "
              f"titik_buta={k.titik_buta} :: {k.utama.judul} ({k.utama.media})")
        for l in k.liputan:
            print(f"      - {l.media} ({l.grup}): {l.judul[:80]}")


if __name__ == "__main__":
    _cetak_laporan()
