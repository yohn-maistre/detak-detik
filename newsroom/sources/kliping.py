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

from ..models import Butir, Kliping, KlipingItem, KlipingMeta

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
_JACCARD_LANTAI = 0.16
_TOKEN_PANJANG_MIN = 4
_TOKEN_SAMA_MIN = 3

# lembar dossier bounds: lede length and how many verbatim key points print
_RINGKAS_MAKS = 280
_BUTIR_MAKS = 4

# Indonesian function words stripped before comparing titles; the second set
# is hyper-generic news vocabulary that joins unrelated stories when shared
# (the Icha/Tifa over-merge: two different doctors chained on generic tokens)
_STOPWORDS = frozenset({
    "yang", "di", "ke", "dari", "untuk", "dan", "dengan", "pada", "ini", "itu",
    "akan", "dalam", "soal", "usai", "jadi", "tak", "tidak", "bukan", "ada",
    "saat", "karena", "telah", "sudah", "bakal", "kata", "sebut", "hingga",
    "agar", "bagi", "oleh", "para", "atas", "antara", "masih", "saja", "juga",
    "bisa", "dapat", "kini", "lagi", "buat", "usung", "punya", "adalah",
    "kasus", "dugaan", "diduga", "terkait", "video", "viral", "resmi", "foto",
    "warga", "ungkap", "update", "berita", "terbaru", "penjelasan",
})


# meja (desk) rules: deterministic keywords matched against a cluster's combined
# normalized titles; first matching desk wins, in this order, else nasional.
# Multi-word keys ("batu bara") match as phrases; "as" is the standalone token
# (Amerika Serikat in Indonesian headlines, the "as-amerika" pair).
_MEJA_ATURAN: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("alam", ("hutan", "deforestasi", "tambang", "sawit", "konsesi", "satwa",
              "banjir", "karhutla", "iklim", "lingkungan", "nikel", "batu bara",
              "sampah", "polusi")),
    ("daerah", ("papua", "aceh", "jayapura", "kabupaten", "pemda", "pemprov",
                "gubernur", "bupati", "otsus", "desa", "apbd")),
    ("ekonomi", ("rupiah", "ihsg", "saham", "bursa", "obligasi", "pajak",
                 "ekspor", "impor", "investasi", "tarif", "inflasi", "kurs",
                 "suku bunga", "bi rate", "perbankan", "umkm")),
    ("tekno", ("ai", "kecerdasan buatan", "digital", "siber", "startup",
               "satelit", "data center", "pusat data", "internet", "aplikasi",
               "chip", "semikonduktor", "fintech", "e-commerce", "gadget")),
    ("dunia", ("as", "amerika", "tiongkok", "china", "dunia", "global", "pbb",
               "asean", "internasional", "perang", "gaza", "ukraina")),
)


def _meja(anggota: list[dict]) -> str:
    """Assign the cluster's desk from its combined normalized titles (lowercase,
    punctuation collapsed to spaces, whole-word matches only). When no rule
    fires, a cluster covered solely by BBC Indonesia is dunia; the rest land on
    nasional."""
    teks = " " + " ".join(
        re.sub(r"[\W_]+", " ", it["judul"].lower(), flags=re.UNICODE)
        for it in anggota
    ) + " "
    kata = frozenset(teks.split())
    for meja, kunci in _MEJA_ATURAN:
        for k in kunci:
            if (f" {k} " in teks) if " " in k else (k in kata):
                return meja
    if {it["media"] for it in anggota} == {"BBC Indonesia"}:
        return "dunia"
    return "nasional"


def _muat_roster() -> list[dict]:
    try:
        return list(json.loads(_ROSTER.read_text(encoding="utf-8")).get("media", []))
    except Exception:
        return []


# ── partai tagger (wave 9g): parties NAMED in the cluster's verbatim
# headlines, matched whole-token/phrase against the curated registry aliases
# (data/partai_registry.json — the same file PartaiPapan renders). A mention
# is a documented fact of coverage, never a stance. Deterministic, Lane A.
_PARTAI_REG = Path(__file__).resolve().parent.parent / "data" / "partai_registry.json"


def _muat_partai_alias() -> list[tuple[str, tuple[str, ...]]]:
    # aliases get the SAME normalization the headline text gets (lowercase,
    # punctuation to spaces) — otherwise "PDI-P" could never match: the
    # headline loses its hyphen, so the alias must lose it too
    try:
        reg = json.loads(_PARTAI_REG.read_text(encoding="utf-8"))
        return [
            (p["id"], tuple(
                re.sub(r"[\W_]+", " ", a.lower(), flags=re.UNICODE).strip()
                for a in p.get("alias", [])))
            for p in reg.get("partai", [])
        ]
    except Exception:
        return []


_PARTAI_ALIAS = _muat_partai_alias()


def _partai(anggota: list[dict]) -> list[str] | None:
    """Registry parties named in the cluster's combined normalized titles
    (the _meja normalization: lowercase, punctuation to spaces, whole-word
    for single tokens, phrase match for multi-word aliases)."""
    teks = " " + " ".join(
        re.sub(r"[\W_]+", " ", it["judul"].lower(), flags=re.UNICODE)
        for it in anggota
    ) + " "
    kata = frozenset(teks.split())
    kena = [pid for pid, alias in _PARTAI_ALIAS
            if any((f" {a} " in teks) if " " in a else (a in kata) for a in alias)]
    return kena or None


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


# feeds double-encode ("&amp;#039;") and some mangle the entity outright
# ("amp;039;" — seen verbatim in detik titles): after unescaping, repair the
# one broken shape that survives, the mangled apostrophe
_AMP_RUSAK = re.compile(r"&?amp;#?0?39;")


def _bersih_teks(teks: str) -> str:
    m = _CDATA.match(teks)
    if m:
        teks = m.group(1)
    # unescape TWICE: idempotent on clean text, fixes double-encoded feeds
    t = html.unescape(html.unescape(teks)).strip()
    return _AMP_RUSAK.sub("'", t)


_TAG = re.compile(r"<[^>]+>")


def _bersih_ringkas(teks: str) -> str:
    """RSS descriptions arrive with markup, entities, and tracker cruft; keep
    only the verbatim lede text, whitespace-collapsed, bounded at a word."""
    t = _bersih_teks(teks)
    t = html.unescape(_TAG.sub(" ", t))
    t = " ".join(t.split())
    if len(t) > _RINGKAS_MAKS:
        t = t[:_RINGKAS_MAKS].rsplit(" ", 1)[0].rstrip(".,;:") + "…"
    return t


def _parse_items(xml_text: str) -> list[tuple[str, str, str, str]]:
    """(judul, url, pubdate, ringkas) per item. xml.etree first; several
    Indonesian feeds ship malformed XML, so fall back to the regex pass
    worker/src/index.ts uses. `ringkas` is the feed's own description text
    (verbatim lede, markup stripped), empty when the feed carries none."""
    items: list[tuple[str, str, str, str]] = []
    try:
        root = ET.fromstring(xml_text)
        for it in root.iter("item"):
            judul = _bersih_teks(it.findtext("title") or "")
            url = _bersih_teks(it.findtext("link") or "")
            pub = (it.findtext("pubDate") or "").strip()
            ringkas = _bersih_ringkas(it.findtext("description") or "")
            if judul and url:
                items.append((judul, url, pub, ringkas))
    except ET.ParseError:
        pass
    if items:
        return items
    for m in re.finditer(r"<item[\s>]([\s\S]*?)</item>", xml_text):
        blok = m.group(1)
        judul = re.search(r"<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</title>", blok)
        url = re.search(r"<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</link>", blok)
        pub = re.search(r"<pubDate>([\s\S]*?)</pubDate>", blok)
        desc = re.search(r"<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</description>", blok)
        if judul and url:
            j = html.unescape(judul.group(1)).strip()
            u = html.unescape(url.group(1)).strip()
            if j and u:
                items.append((j, u, pub.group(1).strip() if pub else "",
                              _bersih_ringkas(desc.group(1)) if desc else ""))
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
    """Deterministic join rule: token Jaccard >= 0.32, OR >= 3 shared
    significant tokens (length >= 4) with a Jaccard floor — the floor stops
    long unrelated titles from chaining on a few common tokens (single-link
    clustering amplifies every bad join into a merged cluster)."""
    if not a or not b:
        return False
    irisan = a & b
    if not irisan:
        return False
    jaccard = len(irisan) / len(a | b)
    if jaccard >= _JACCARD_MIN:
        return True
    return (jaccard >= _JACCARD_LANTAI
            and sum(1 for t in irisan if len(t) >= _TOKEN_PANJANG_MIN) >= _TOKEN_SAMA_MIN)


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
    for judul, url, pub, ringkas in parsed:
        if url in terlihat or not _dalam_jendela(pub, batas):
            continue
        terlihat.add(url)
        items.append({
            "media": outlet["nama"],
            "grup": outlet["grup"],
            "independen": bool(outlet.get("independen")),
            "resmi": bool(outlet.get("resmi")),
            "judul": judul,
            "url": url,
            "ringkas": ringkas,
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


_KALIMAT = re.compile(r"(?<=[.!?…])\s+")


# ── law mentions (Lane A): legislation cited in the cluster's own verbatim
#    headlines. Numbered forms parse by regex; NAMED forms must join the curated
#    alias list below — headlines are Title Case, so free capture after "RUU"
#    would swallow the rest of the sentence ("RUU KUHAP Bersama Pemerintah").
#    Precision over recall: a missed law is silence, a wrong one is a lie.
#    The list doubles later as the join key into the legal registry (§13.11).
_UU_ALIAS: tuple[str, ...] = (
    "cipta kerja", "perampasan aset", "perlindungan data pribadi",
    "kesejahteraan ibu dan anak", "lalu lintas", "sumber daya air",
    "ciptaker", "omnibus", "ite", "tni", "polri", "kpk", "kuhp", "kuhap",
    "pdp", "ikn", "asn", "bumn", "md3", "desa", "ormas", "pemilu", "pilkada",
    "penyiaran", "kejaksaan", "kesehatan", "minerba", "migas", "sisdiknas",
    "pesantren", "imigrasi", "narkotika", "otsus", "hpp", "p2sk", "kia",
    "pprt", "tppu", "tpks",
)
_ALIAS_URUT = sorted(_UU_ALIAS, key=len, reverse=True)
# "PP"/"Perpres"/"Permen…" only count in numbered form (bare "PP" is a false
# friend: PP Muhammadiyah is an organisation, "Permen" is candy)
_HUKUM_NOMOR = re.compile(
    r"\b(UU|RUU|Perppu|Perpres|PP)\s+(?:No(?:mor)?\.?\s*)?(\d{1,3})\s*(?:/\s*|\s+Tahun\s+)(\d{4})\b",
    re.IGNORECASE,
)
_HUKUM_NAMA = re.compile(r"\b(UU|RUU|Perppu)\s+", re.IGNORECASE)


def _rapikan_kw(kw: str) -> str:
    kw = kw.upper()
    return {"PERPPU": "Perppu", "PERPRES": "Perpres"}.get(kw, kw)


def _hukum_dari(anggota: list[dict]) -> list[str]:
    """The § stamp: laws the cluster's headlines cite, verbatim surface text,
    deduped case-insensitively, capped at three."""
    temu: dict[str, str] = {}
    for it in anggota:
        j = it["judul"]
        for m in _HUKUM_NOMOR.finditer(j):
            disp = f"{_rapikan_kw(m.group(1))} {int(m.group(2))}/{m.group(3)}"
            temu.setdefault(disp.upper(), disp)
        for m in _HUKUM_NAMA.finditer(j):
            sisa = j[m.end():]
            sisa_low = sisa.lower()
            for alias in _ALIAS_URUT:
                if sisa_low.startswith(alias) and not sisa_low[len(alias):len(alias) + 1].isalnum():
                    disp = f"{_rapikan_kw(m.group(1))} {sisa[:len(alias)]}"
                    temu.setdefault(disp.upper(), disp)
                    break
    return list(temu.values())[:3]


def _butir_dari(wakil: list[dict], utama: dict) -> list[Butir]:
    """Key points, Lane A verbatim: the first sentence of each outlet's lede,
    preferring one lede per ownership group, near-duplicates (and the lead
    outlet's own lede, which prints separately) dropped. No model text."""
    keluar: list[Butir] = []
    dipakai: list[frozenset[str]] = []
    grup_terpakai: set[str] = set()
    lede_utama = (utama.get("ringkas") or "").strip()
    if lede_utama:
        dipakai.append(_tokens(_KALIMAT.split(lede_utama)[0]))
    for hanya_grup_baru in (True, False):
        for w in wakil:
            if len(keluar) >= _BUTIR_MAKS:
                return keluar
            r = (w.get("ringkas") or "").strip()
            if not r or (hanya_grup_baru and w["grup"] in grup_terpakai):
                continue
            kalimat = _KALIMAT.split(r)[0].strip()
            if len(kalimat) < 40:
                continue
            if len(kalimat) > 220:
                kalimat = kalimat[:220].rsplit(" ", 1)[0].rstrip(".,;:") + "…"
            tok = _tokens(kalimat)
            if any(_serumpun(tok, t) for t in dipakai):
                continue
            dipakai.append(tok)
            grup_terpakai.add(w["grup"])
            keluar.append(Butir(teks=kalimat, media=w["media"]))
    return keluar


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
    butir = _butir_dari(wakil, utama)
    return Kliping(
        id=f"klp-{edisi_no}-{urut:02d}",
        # the lede rides only on the representative item to keep the payload
        # lean; the full per-outlet evidence stays in-memory for sari/butir
        utama=KlipingItem(judul=utama["judul"], url=utama["url"],
                          media=utama["media"], grup=utama["grup"],
                          independen=utama["independen"],
                          ringkas=utama.get("ringkas") or None),
        liputan=[KlipingItem(judul=w["judul"], url=w["url"],
                             media=w["media"], grup=w["grup"],
                             independen=w["independen"]) for w in liputan],
        butir=butir if len(butir) >= 2 else None,
        # a cluster carrying the state's own announcement is marked, quietly
        resmi=any(it.get("resmi") for it in anggota),
        hukum=_hukum_dari(anggota) or None,
        n_media=n_media,
        n_grup=n_grup,
        skor=n_grup * 2 + n_media,  # corroboration by ownership diversity, not volume
        titik_buta=n_media >= 2 and n_grup == 1,
        tumbuh=False,  # delta vs the previous edition lands in v2
        meja=_meja(anggota),
        partai=_partai(anggota),
    )


async def gather_kliping(
    edisi_no: int,
) -> tuple[list[Kliping], list[str], dict[str, int], KlipingMeta, dict[str, list[str]]]:
    """Fetch every live roster feed, cluster the 48h window, score by ownership
    diversity. Returns (clusters sorted by skor desc, dark feed names, items per
    feed, pipeline meta, bukti). `bukti` maps cluster id -> the cluster's
    verbatim evidence lines (outlet: title — lede), the only text sari.py may
    write from. Only clusters seen by at least two outlets surface; a
    single-outlet headline is a ticker item, not a corroborated story. The
    meta's `klaster` counts what the desk emitted; the editor overwrites it
    after applying the front-page cap."""
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
    bukti: dict[str, list[str]] = {}
    kandidat = [c for c in _klaster(items) if len({x["media"] for x in c}) >= 2]
    kandidat.sort(key=lambda c: (-len({x["grup"] for x in c}) * 2 - len({x["media"] for x in c}),
                                 min(x["url"] for x in c)))
    for urut, anggota in enumerate(kandidat, start=1):
        k = _susun_kliping(anggota, edisi_no, urut)
        kliping.append(k)
        bukti[k.id] = [
            f"{it['media']}: {it['judul']}" + (f" — {it['ringkas']}" if it.get("ringkas") else "")
            for it in anggota[:10]
        ]
    meta = KlipingMeta(
        judul=len(items),  # every headline that made it inside the window
        klaster=len(kliping),
        gelap=len(gelap),
        disusun=datetime.now(_WIB).strftime("%H.%M"),
    )
    return kliping, gelap, per_feed, meta, bukti


def _cetak_laporan() -> None:
    kliping, gelap, per_feed, meta, bukti = asyncio.run(gather_kliping(0))
    print("== item per feed ==")
    for nama, n in per_feed.items():
        print(f"  {nama}: {n}")
    if gelap:
        print(f"== feed gelap: {', '.join(gelap)}")
    print(f"== meta: judul={meta.judul} klaster={meta.klaster} "
          f"gelap={meta.gelap} disusun={meta.disusun} WIB")
    sebaran: dict[str, int] = {}
    for k in kliping:
        sebaran[k.meja] = sebaran.get(k.meja, 0) + 1
    print("== meja: " + ", ".join(
        f"{m}={sebaran.get(m, 0)}" for m in ("nasional", "daerah", "alam", "dunia")))
    print(f"== klaster (>= 2 media): {len(kliping)}")
    for k in kliping[:5]:
        print(f"  [{k.skor}] meja={k.meja} media={k.n_media} grup={k.n_grup} "
              f"titik_buta={k.titik_buta} butir={len(k.butir or [])} "
              f"lede={'ya' if k.utama.ringkas else '-'} :: {k.utama.judul} ({k.utama.media})")
        for l in k.liputan:
            print(f"      - {l.media} ({l.grup}): {l.judul[:80]}")
        for b in k.butir or []:
            print(f"      * BUTIR ({b.media}): {b.teks[:90]}")


if __name__ == "__main__":
    _cetak_laporan()
