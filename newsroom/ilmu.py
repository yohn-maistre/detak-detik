"""
ILMU: the almanac's research shelf, judged rather than keyword-matched. Each
run pulls the month's Crossref batch that MENTIONS indonesia (the query is
recall, not precision) and the model reads the titles and keeps only work
that is actually ABOUT Indonesia — land, seas, people, policy, species —
writing one plain-Indonesian line on why it matters (Lane C: bounded, gated,
labeled machine-picked on the page). Picks persist across editions in
newsroom/data/atlas/jurnal.json (papers trend for weeks), so the shelf
accumulates a reviewed stash instead of flickering with the query. A dark
API or a dead model lane leaves the previous stash untouched: absence of a
new pick is not the loss of the old ones.
"""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .llm import build_model

_JURNAL = Path(__file__).parent / "data" / "atlas" / "jurnal.json"
_UA = ("detak-detik/1.0 (koran sipil; josejr2498@gmail.com; "
       "github.com/yohn-maistre/detak-detik)")
_MAKS_PILIH = 8       # new picks per edition, at most
_MAKS_STASH = 12      # the shelf's depth
_UMUR_MAKS_EDISI = 28  # ≈ two weeks of editions, then a pick retires

_SYSTEM = (
    "Kamu kurator rak riset sebuah koran sipil Indonesia. Dari daftar judul "
    "makalah bernomor berikut, pilih maksimum {n} yang benar-benar TENTANG "
    "Indonesia — alamnya, lautnya, masyarakatnya, kebijakannya, kesehatannya, "
    "spesiesnya, bahasanya — bukan sekadar menyebut kata. Balas HANYA JSON: "
    '[{"i": <nomor>, "alasan": "<satu kalimat datar berbahasa Indonesia, '
    'maksimum 140 karakter, kenapa karya ini relevan bagi pembaca Indonesia>"}]. '
    "Tanpa opini, tanpa angka yang tidak ada di judulnya. Jika tidak ada "
    "yang relevan, balas []."
)


def _ambil_crossref() -> list[dict]:
    dari = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    u = ("https://api.crossref.org/works?query.bibliographic=indonesia"
         f"&filter=type:journal-article,from-pub-date:{dari}"
         "&sort=published&order=desc&rows=40"
         "&select=title,container-title,DOI,issued"
         "&mailto=josejr2498@gmail.com")
    req = urllib.request.Request(u, headers={"User-Agent": _UA})
    with urllib.request.urlopen(req, timeout=25) as res:
        d = json.load(res)
    # publishers sometimes file garbage future dates (2150…): metadata noise
    thn_maks = datetime.now(timezone.utc).year + 1
    rows: list[dict] = []
    for it in d.get("message", {}).get("items", []):
        judul = (it.get("title") or [""])[0].strip()
        doi = it.get("DOI") or ""
        dp = (it.get("issued", {}).get("date-parts") or [[]])[0]
        thn = dp[0] if dp else 0
        if not judul or not doi or not thn or thn > thn_maks:
            continue
        rows.append({
            "judul": judul[:300],
            "wadah": ((it.get("container-title") or [""]) or [""])[0][:120],
            "doi": doi,
            "tanggal": "-".join(str(x) for x in dp),
        })
    return rows


def _muat_stash() -> list[dict]:
    try:
        d = json.loads(_JURNAL.read_text(encoding="utf-8"))
        return d.get("pilihan", []) if isinstance(d, dict) else []
    except Exception:
        return []


def _tulis_stash(pilihan: list[dict], edisi_no: int) -> None:
    _JURNAL.write_text(json.dumps({
        "diperbarui": datetime.now(timezone.utc).isoformat(),
        "edisi": edisi_no,
        "pilihan": pilihan,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


async def pilih_jurnal(edisi_no: int, catat=None) -> int:
    """Judge the fresh Crossref batch, merge survivors into the stash on
    disk (the Actions job commits it; the deploy bakes it). Returns how many
    NEW picks landed. Every failure keeps the previous stash and logs why."""
    model = build_model()
    if model is None:
        return 0
    try:
        baru = _ambil_crossref()
    except Exception as exc:
        if catat:
            catat("ilmu_gelap", alasan=f"{type(exc).__name__}: {str(exc)[:120]}")
        return 0

    lama = [p for p in _muat_stash()
            if edisi_no - int(p.get("sejak_edisi", edisi_no)) <= _UMUR_MAKS_EDISI]
    sudah = {p.get("doi") for p in lama}
    kandidat = [r for r in baru if r["doi"] not in sudah]
    if not kandidat:
        return 0

    from pydantic_ai import Agent

    agent = Agent(model, output_type=str,
                  system_prompt=_SYSTEM.replace("{n}", str(_MAKS_PILIH)),
                  retries=1)
    daftar = "\n".join(f"{i + 1}. {r['judul']} — {r['wadah']}"
                       for i, r in enumerate(kandidat))
    try:
        hasil = await agent.run(f"DAFTAR:\n{daftar}")
        mentah = str(hasil.output)
    except Exception as exc:
        sub = getattr(exc, "exceptions", None)
        rinci = "; ".join(f"{type(e).__name__}: {str(e)[:90]}" for e in sub) \
            if sub else f"{type(exc).__name__}: {str(exc)[:120]}"
        if catat:
            catat("ilmu_gugur", alasan=f"lane: {rinci[:300]}")
        return 0

    m = re.search(r"\[.*\]", mentah, re.S)
    if not m:
        if catat:
            catat("ilmu_gugur", alasan="jawaban bukan JSON")
        return 0
    try:
        pilihan = json.loads(m.group(0))
    except Exception:
        if catat:
            catat("ilmu_gugur", alasan="JSON tidak sah")
        return 0

    # deterministic acceptance: the index must exist, the reason must be
    # bounded prose with no links — a failed row is dropped, not fixed
    dipilih: list[dict] = []
    for p in pilihan[:_MAKS_PILIH]:
        if not isinstance(p, dict):
            continue
        try:
            i = int(p.get("i", 0)) - 1
        except (TypeError, ValueError):
            continue
        alasan = " ".join(str(p.get("alasan", "")).split())
        if not (0 <= i < len(kandidat)) or not alasan or len(alasan) > 180 \
                or "http" in alasan.lower():
            continue
        r = kandidat[i]
        if any(d["doi"] == r["doi"] for d in dipilih):
            continue
        dipilih.append({**r, "alasan": alasan, "sejak_edisi": edisi_no})

    if not dipilih:
        if catat:
            catat("ilmu", dipilih=0, catatan="tak ada yang lolos penilaian")
        return 0
    stash = (dipilih + lama)[:_MAKS_STASH]
    _tulis_stash(stash, edisi_no)
    if catat:
        catat("ilmu", dipilih=len(dipilih), stash=len(stash))
    return len(dipilih)
