"""
The AGENDA ISTANA desk: the executive's own published activity record.

Source: setkab.go.id/feed/ (Sekretariat Kabinet, WordPress RSS, keyless,
full-text `content:encoded` — probed live 2026-07-05). The cabinet
secretariat publishes every presidential speech transcript, ceremony,
visit, and reception; transcript titles follow a fixed bureaucratic
grammar that carries venue, city, province, and event date:

    "Amanat Presiden Republik Indonesia pada Upacara ... di Lapangan
     Satlat Korbrimob Polri, Cikeas, Bogor, Provinsi Jawa Barat,
     1 Juli 2026"

Everything here is DETERMINISTIC — regex + keyword tables, no model —
so the lane runs while the LLM lanes sleep. Every archived row cites
its Setkab post URL: the government's own publication is the receipt
(citation-or-silence). The schema describes the OFFICE, not the
officeholder, so the same parser scores any administration identically
(regime-agnostic by construction).

Two artifacts from one namespace:
1. ARCHIVE (data/agenda_istana.json): accumulated slim rows, merged by
   URL across runs (the feed only shows ~10 items; the 2x-daily cron is
   what grows the record). Prune-on-write to SIMPAN_MAKS, newest first.
2. CORPUS (gather_agenda): monthly aggregates + the newest events as
   CorpusRow ids the fact gate may cite (agenda:acara_bulan, ...).

TLS note: setkab.go.id serves an incomplete certificate chain (no
intermediate). We try a normal verified fetch first; on SSL failure
ONLY, we retry this one host without verification — acceptable here
because every row is re-checkable at its cited public URL, and a dark
feed never crashes the desk (the archive simply stays as-is).
"""

from __future__ import annotations

import hashlib
import json
import re
import ssl
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path

# NOTE: ..models (pydantic) is imported lazily inside gather_agenda() so the
# standalone harvest entrypoint below runs on a bare stdlib Python — the
# agenda cron needs zero pip installs and no LLM keys.

_DATA = Path(__file__).resolve().parent.parent / "data"
_ARSIP = _DATA / "agenda_istana.json"

_FEED = "https://setkab.go.id/feed/"
_FEED_HAL = ("https://setkab.go.id/feed/?paged=2", "https://setkab.go.id/feed/?paged=3")
_UA = "detak-detik/1.0 (koran sipil; github.com/yohn-maistre/detak-detik)"
_TIMEOUT = 20
SIMPAN_MAKS = 600  # ± a year of Setkab output; older rows pruned on write

# ── the province table (kode = the house convention, edisi.ts DAERAH) ──
_PROV: dict[str, tuple[str, str]] = {
    "aceh": ("11", "Aceh"),
    "sumatera utara": ("12", "Sumatera Utara"),
    "sumatera barat": ("13", "Sumatera Barat"),
    "riau": ("14", "Riau"),
    "jambi": ("15", "Jambi"),
    "sumatera selatan": ("16", "Sumatera Selatan"),
    "bengkulu": ("17", "Bengkulu"),
    "lampung": ("18", "Lampung"),
    "kepulauan bangka belitung": ("19", "Kep. Bangka Belitung"),
    "bangka belitung": ("19", "Kep. Bangka Belitung"),
    "kepulauan riau": ("21", "Kepulauan Riau"),
    "dki jakarta": ("31", "DKI Jakarta"),
    "daerah khusus ibukota jakarta": ("31", "DKI Jakarta"),
    "jawa barat": ("32", "Jawa Barat"),
    "jawa tengah": ("33", "Jawa Tengah"),
    "daerah istimewa yogyakarta": ("34", "DI Yogyakarta"),
    "di yogyakarta": ("34", "DI Yogyakarta"),
    "yogyakarta": ("34", "DI Yogyakarta"),
    "jawa timur": ("35", "Jawa Timur"),
    "banten": ("36", "Banten"),
    "bali": ("51", "Bali"),
    "nusa tenggara barat": ("52", "Nusa Tenggara Barat"),
    "nusa tenggara timur": ("53", "Nusa Tenggara Timur"),
    "kalimantan barat": ("61", "Kalimantan Barat"),
    "kalimantan tengah": ("62", "Kalimantan Tengah"),
    "kalimantan selatan": ("63", "Kalimantan Selatan"),
    "kalimantan timur": ("64", "Kalimantan Timur"),
    "kalimantan utara": ("65", "Kalimantan Utara"),
    "sulawesi utara": ("71", "Sulawesi Utara"),
    "sulawesi tengah": ("72", "Sulawesi Tengah"),
    "sulawesi selatan": ("73", "Sulawesi Selatan"),
    "sulawesi tenggara": ("74", "Sulawesi Tenggara"),
    "gorontalo": ("75", "Gorontalo"),
    "sulawesi barat": ("76", "Sulawesi Barat"),
    "maluku": ("81", "Maluku"),
    "maluku utara": ("82", "Maluku Utara"),
    "papua barat": ("91", "Papua Barat"),
    "papua barat daya": ("92", "Papua Barat Daya"),
    "papua": ("94", "Papua"),
    "papua selatan": ("95", "Papua Selatan"),
    "papua tengah": ("96", "Papua Tengah"),
    "papua pegunungan": ("97", "Papua Pegunungan"),
}
# longest names first so "papua barat daya" wins before "papua barat" & "papua"
_PROV_URUT = sorted(_PROV, key=len, reverse=True)

_BULAN = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11,
    "desember": 12,
}
_RE_TANGGAL = re.compile(
    r"(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|"
    r"September|Oktober|November|Desember)\s+(\d{4})\s*$", re.I)

# aktor: the OFFICE named in the title (never a person's name — the same
# rule reads the next administration identically)
_AKTOR_ATURAN: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("WAPRES", ("wakil presiden", "wapres")),
    ("PRESIDEN", ("presiden",)),
    ("SESKAB", ("seskab", "sekretaris kabinet")),
)

# jenis: first matching rule wins, orderd specific -> generic
_JENIS_ATURAN: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("KETERANGAN PERS", ("keterangan pers",)),
    ("SIDANG KABINET", ("sidang kabinet", "rapat terbatas", "ratas ")),
    ("AMANAT", ("amanat ",)),
    ("SAMBUTAN", ("sambutan ",)),
    ("PIDATO", ("pidato ",)),
    ("PELANTIKAN", ("melantik", "pelantikan")),
    ("PERESMIAN", ("meresmikan", "peresmian", "groundbreaking")),
    ("KUNJUNGAN", ("kunjungan", "mengunjungi", "meninjau", "tinjau ", "menghadiri",
                   "hadiri ", "memimpin upacara", "pimpin upacara")),
    ("MENERIMA", ("menerima ", "terima ", "bertemu ", "audiensi")),
)

# topik: every matching tag applies (title + the body's first slice)
_TOPIK_ATURAN: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("ekonomi", ("ekonomi", "investasi", "pajak", "apbn", "fiskal", "umkm",
                 "industri", "perdagangan", "ekspor", "impor", "bursa", "danantara")),
    ("pangan", ("pangan", "beras", "swasembada", "bulog", "petani", "panen",
                "makan bergizi", "mbg", "gizi")),
    ("pertahanan-keamanan", ("tni", "polri", "pertahanan", "keamanan", "alutsista",
                             "bhayangkara", "militer", "brimob")),
    ("hukum", ("hukum", "korupsi", "kpk", "kejaksaan", "mahkamah", "amnesti",
               "undang-undang", "peraturan")),
    ("infrastruktur", ("infrastruktur", "jalan", "bendungan", "bandara",
                       "pelabuhan", "ikn", "tol", "irigasi")),
    ("luar-negeri", ("kerja sama", "bilateral", "asean", "pbb", "kunjungan kenegaraan",
                     "duta besar", "belarus", "tiongkok", "amerika", "jepang", "diplomat")),
    ("pendidikan", ("pendidikan", "sekolah", "guru", "mahasiswa", "universitas",
                    "sekolah rakyat")),
    ("kesehatan", ("kesehatan", "rumah sakit", "dokter", "stunting", "bpjs")),
    ("agama", ("haji", "idulfitri", "iduladha", "natal", "masjid", "gereja",
               "keagamaan", "pesantren")),
    ("energi-sda", ("energi", "listrik", "migas", "tambang", "nikel", "hilirisasi",
                    "sawit", "hutan", "b40", "b50")),
)


class _Polos(HTMLParser):
    """Strip tags; keep text (stdlib only — the phone/CI parity rule)."""

    def __init__(self) -> None:
        super().__init__()
        self.potongan: list[str] = []

    def handle_data(self, data: str) -> None:
        self.potongan.append(data)


def _teks_polos(html: str) -> str:
    p = _Polos()
    try:
        p.feed(html)
    except Exception:
        return html
    return " ".join(" ".join(p.potongan).split())


def _ambil(url: str) -> str:
    """Verified fetch first; on SSL failure only, retry unverified for this
    one host (incomplete chain server-side; rows stay re-checkable at their
    cited URLs). Any other failure raises — the caller treats it as a dark
    feed and keeps the existing archive."""
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except ssl.SSLError:
        pass
    except Exception as exc:
        if "SSL" not in str(exc) and "certificate" not in str(exc).lower():
            raise
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, timeout=_TIMEOUT, context=ctx) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ── deterministic field extraction ──────────────────────────────────────

def _cocok(aturan: tuple[tuple[str, tuple[str, ...]], ...], teks: str) -> str | None:
    for label, kunci in aturan:
        for k in kunci:
            if k in teks:
                return label
    return None


def _tanggal_acara(judul: str, terbit: str) -> str:
    m = _RE_TANGGAL.search(judul.strip())
    if m:
        try:
            return date(int(m.group(3)), _BULAN[m.group(2).lower()], int(m.group(1))).isoformat()
        except (ValueError, KeyError):
            pass
    return terbit


def _lokasi(judul: str, body: str) -> dict:
    """venue/kota/prov from the fixed transcript-title grammar; body scanned
    only for the unambiguous 'Provinsi <nama>' phrase. Raw segments are kept
    (lokasi_mentah) so grammar drift never loses information; a row that
    won't parse still archives with its URL."""
    hasil: dict = {"venue": None, "kota": None, "prov": None, "prov_nama": None,
                   "lokasi_mentah": None}
    # strip the trailing date so segments end at the location
    inti = _RE_TANGGAL.sub("", judul).rstrip(" ,")
    rendah = inti.lower()

    seg = [s.strip() for s in inti.split(",")]
    idx_prov = None
    for i, s in enumerate(seg):
        if s.lower().startswith("provinsi "):
            nama = s[len("provinsi "):].strip().lower()
            for kandidat in _PROV_URUT:
                if nama.startswith(kandidat):
                    hasil["prov"], hasil["prov_nama"] = _PROV[kandidat]
                    idx_prov = i
                    break
        if idx_prov is not None:
            break
    if idx_prov is None and (" jakarta" in rendah or rendah.startswith("jakarta")):
        hasil["prov"], hasil["prov_nama"] = _PROV["dki jakarta"]
    if idx_prov is None and hasil["prov"] is None and body:
        m = re.search(r"Provinsi\s+([A-Za-z ]+)", body[:600])
        if m:
            nama = m.group(1).strip().lower()
            for kandidat in _PROV_URUT:
                if nama.startswith(kandidat):
                    hasil["prov"], hasil["prov_nama"] = _PROV[kandidat]
                    break

    if idx_prov is not None:
        if idx_prov >= 1:
            hasil["kota"] = seg[idx_prov - 1]
        # venue: inside the segment(s) before the kota, after the last " di "
        awal = ", ".join(seg[:max(idx_prov - 1, 1)])
        if " di " in awal:
            hasil["venue"] = awal.rsplit(" di ", 1)[1].strip()
        hasil["lokasi_mentah"] = ", ".join(seg[max(idx_prov - 2, 0): idx_prov + 1])
    return hasil


def _audiens(judul: str) -> str | None:
    m = re.search(r"\b(?:pada|kepada|bersama)\s+(.+?)(?:\s+di\s+|,|$)", judul)
    return m.group(1).strip() if m else None


def _baris(item: dict) -> dict:
    judul = item["judul"]
    rendah = judul.lower()
    body = item.get("body", "")
    terbit = item["terbit"]
    tgl = _tanggal_acara(judul, terbit)
    baris = {
        "id": hashlib.sha1(item["url"].encode()).hexdigest()[:12],
        "url": item["url"],
        "judul": judul,
        "aktor": _cocok(_AKTOR_ATURAN, rendah) or "ISTANA",
        "jenis": _cocok(_JENIS_ATURAN, rendah) or "LAINNYA",
        "tanggal_acara": tgl,
        "tanggal_terbit": terbit,
        "audiens": _audiens(judul),
        "topik": [t for t, kunci in _TOPIK_ATURAN
                  if any(k in rendah or k in body[:1500].lower() for k in kunci)],
    }
    baris.update(_lokasi(judul, body))
    if baris.get("lokasi_mentah") is None:
        baris.pop("lokasi_mentah", None)
    return baris


# ── feed parsing & the accumulating archive ─────────────────────────────

_NS = {"content": "http://purl.org/rss/1.0/modules/content/"}


def _parse_feed(xml_text: str) -> list[dict]:
    items: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return items
    for it in root.iter("item"):
        judul = (it.findtext("title") or "").strip()
        url = (it.findtext("link") or "").strip()
        if not judul or not url:
            continue
        pub = (it.findtext("pubDate") or "").strip()
        try:
            terbit = parsedate_to_datetime(pub).date().isoformat()
        except Exception:
            terbit = datetime.now(timezone.utc).date().isoformat()
        body_html = it.findtext("content:encoded", default="", namespaces=_NS) or ""
        items.append({"judul": judul, "url": url, "terbit": terbit,
                      "body": _teks_polos(body_html)})
    return items


def _muat_arsip() -> dict:
    try:
        return json.loads(_ARSIP.read_text(encoding="utf-8"))
    except Exception:
        return {"acara": []}


def muat_agenda() -> list[dict]:
    """The archive rows, newest first (what the page and the desk read)."""
    return list(_muat_arsip().get("acara", []))


def _simpan(acara: list[dict]) -> bool:
    """Merge-target write: newest first, pruned, only when content changed."""
    acara = sorted(acara, key=lambda a: (a.get("tanggal_acara") or "", a.get("tanggal_terbit") or ""), reverse=True)[:SIMPAN_MAKS]
    payload = {
        "_catatan": ("Arsip agenda istana — akumulasi dari setkab.go.id/feed/ oleh "
                     "newsroom/sources/agenda.py (deterministik: regex + tabel kata, tanpa model). "
                     "Feed hanya memuat ±10 butir; arsip inilah ingatannya. Setiap baris "
                     "mengutip URL terbitan resminya."),
        "_sumber": [_FEED],
        "diambil": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "acara": acara,
    }
    lama = _muat_arsip()
    if lama.get("acara") == acara:
        return False  # unchanged — don't churn the git history with timestamps
    _ARSIP.parent.mkdir(parents=True, exist_ok=True)
    _ARSIP.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return True


def panen() -> dict:
    """The harvest alone (stdlib only): refresh the archive from the live
    feed; a dark feed leaves the archive untouched. Returns a summary."""
    arsip = {a["url"]: a for a in muat_agenda()}
    segar = 0
    gelap = True
    for url in (_FEED, *_FEED_HAL):
        try:
            mentah = _ambil(url)
        except Exception:
            continue
        gelap = False
        for item in _parse_feed(mentah):
            if item["url"] not in arsip:
                segar += 1
            arsip[item["url"]] = _baris(item)
    if not gelap:
        _simpan(list(arsip.values()))
    return {"total_arsip": len(arsip), "baru": segar, "gelap": gelap}


async def gather_agenda() -> tuple[list, dict]:
    """Refresh the archive from the live feed (dark feed -> archive as-is),
    then emit corpus rows the temuan gate can cite."""
    from ..models import CorpusRow

    ringkas = panen()
    acara = muat_agenda()

    # corpus: monthly aggregates over the archive (presidential rows only,
    # regime-agnostic: the office, not the name)
    acara = sorted(acara, key=lambda a: a.get("tanggal_acara") or "", reverse=True)
    bulan_ini = date.today().isoformat()[:7]
    pres = [a for a in acara if a.get("aktor") == "PRESIDEN"]
    pres_bulan = [a for a in pres if (a.get("tanggal_acara") or "").startswith(bulan_ini)]
    kota_bulan = {a["kota"] for a in pres_bulan if a.get("kota")}
    prov_bulan = {a["prov"] for a in pres_bulan if a.get("prov")}
    luar_jkt = [a for a in pres_bulan if a.get("prov") and a["prov"] != "31"]

    rows = [CorpusRow(id="agenda:istana_bulan", nilai={
        "acara": float(len(pres_bulan)),
        "kota": float(len(kota_bulan)),
        "provinsi": float(len(prov_bulan)),
        "luar_jakarta": float(len(luar_jkt)),
        "bulan": bulan_ini,
        "sumber": "setkab.go.id",
    })]
    for a in pres[:20]:
        rows.append(CorpusRow(id=f"agenda:{a['id']}", nilai={
            "judul": a["judul"][:160],
            "jenis": a["jenis"],
            "tanggal": a.get("tanggal_acara") or "",
            "lokasi": a.get("prov_nama") or a.get("kota") or "tanpa lokasi terurai",
            "url": a["url"],
        }))
    ringkas["pres_bulan_ini"] = len(pres_bulan)
    return rows, ringkas


if __name__ == "__main__":
    # standalone harvest for the keyless agenda cron (no pip, no LLM):
    #   python -m newsroom.sources.agenda
    print(json.dumps(panen(), ensure_ascii=False))
