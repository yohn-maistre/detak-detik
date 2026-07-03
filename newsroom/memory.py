"""
INGATAN REDAKSI (§13.16): memory = published artifacts, diffed. Never an
embedding store, never state a reader cannot audit — every line of memory
traces to an edition committed in arsip/.

Each run the Actions job commits a SLIM record of what it published
(arsip/edisi-N.json: the angka, each cluster's headline + score, each
promise's status). The next run loads the last `JENDELA` records and
compares mechanically:

  cerita  — today's kliping clusters fingerprinted against the window with
            the SAME _serumpun rule the desk clusters with:
              BARU        first appearance in the window
              BERKEMBANG  seen before; carries first-seen date + edition count
              BERLALU     led the previous edition, absent today — coverage
                          decay is itself a finding, not a deletion
  angka   — the edition meter, compared against the previous record
            (same label -> the delta; new label -> the handover, said plainly)
  janji   — any promise whose mechanical status changed between editions

Everything is deterministic: same window + same edition -> same memory.
Consumers: SARI/tulisan writers (context), Aksara ("apa yang berubah minggu
ini"), and the reader-facing YANG BERUBAH strip — one artifact, three
audiences.
"""

from __future__ import annotations

import json
from pathlib import Path

from .models import Edisi, Ingatan, IngatanCerita
from .sources.kliping import _serumpun, _tokens

ARSIP = Path(__file__).resolve().parent.parent / "arsip"
JENDELA = 14          # editions compared against (7 days x 2)
SIMPAN_MAKS = 60      # slim records kept on disk (older pruned)
MAKS_BARU, MAKS_KEMBANG, MAKS_LALU = 4, 5, 3


def _muat_jendela(sebelum: int) -> list[dict]:
    """The newest `JENDELA` slim records with edisi < `sebelum`, newest first.
    A record that fails to parse is skipped (an unreadable memory is no
    memory), never fatal."""
    rekaman: list[dict] = []
    if not ARSIP.is_dir():
        return rekaman
    for p in ARSIP.glob("edisi-*.json"):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(d.get("edisi"), int) and d["edisi"] < sebelum:
                rekaman.append(d)
        except Exception:
            continue
    rekaman.sort(key=lambda d: d["edisi"], reverse=True)
    return rekaman[:JENDELA]


def _tgl(iso: str) -> str:
    return (iso or "")[:10]


def ingat(edisi_no: int, edisi: Edisi, log=None) -> Ingatan | None:
    """The diff. None when there is nothing to remember against (first run,
    or an empty window): the strip prints nothing rather than a hollow 'all
    new'."""
    jendela = _muat_jendela(edisi_no)
    if not jendela:
        if log:
            log("ingatan", jendela=0, catatan="arsip kosong; belum ada ingatan")
        return None

    # the window's clusters, fingerprinted once
    lampau: list[dict] = []
    for rec in jendela:
        for k in rec.get("kliping") or []:
            judul = k.get("judul") or ""
            lampau.append({
                "edisi": rec["edisi"], "terbit": _tgl(rec.get("terbit", "")),
                "judul": judul, "skor": k.get("skor", 0), "tokens": _tokens(judul),
            })

    cerita: list[IngatanCerita] = []
    hari_ini = [
        {"judul": k.utama.judul, "skor": k.skor, "tokens": _tokens(k.utama.judul)}
        for k in (edisi.kliping or [])
    ]

    baru, kembang = [], []
    for t in hari_ini:
        cocok = [p for p in lampau if _serumpun(t["tokens"], p["tokens"])]
        if cocok:
            edisi_cocok = {p["edisi"] for p in cocok}
            kembang.append(IngatanCerita(
                status="BERKEMBANG", judul=t["judul"],
                sejak=min(p["terbit"] for p in cocok),
                n_edisi=len(edisi_cocok) + 1,  # + today's
            ))
        else:
            baru.append((t["skor"], IngatanCerita(status="BARU", judul=t["judul"])))

    # BERLALU: what led the PREVIOUS edition and finds no kin today
    lalu = []
    for k in jendela[0].get("kliping") or []:
        tok = _tokens(k.get("judul") or "")
        if not any(_serumpun(tok, t["tokens"]) for t in hari_ini):
            lalu.append((k.get("skor", 0), IngatanCerita(
                status="BERLALU", judul=k.get("judul") or "",
                terakhir=_tgl(jendela[0].get("terbit", "")),
            )))

    kembang.sort(key=lambda c: (-(c.n_edisi or 0), c.judul))
    baru.sort(key=lambda x: (-x[0], x[1].judul))
    lalu.sort(key=lambda x: (-x[0], x[1].judul))
    cerita = (kembang[:MAKS_KEMBANG]
              + [c for _, c in baru[:MAKS_BARU]]
              + [c for _, c in lalu[:MAKS_LALU]])

    # the meter: same label -> the delta; a new label -> the handover
    angka: list[str] = []
    a_lalu = jendela[0].get("angka") or {}
    a_kini = edisi.angka_edisi
    if a_lalu.get("label") == a_kini.label and a_lalu.get("nilai") != a_kini.nilai:
        angka.append(f"{a_kini.label}: {a_lalu.get('nilai')} → {a_kini.nilai}")
    elif a_lalu.get("label") and a_lalu.get("label") != a_kini.label:
        angka.append(f"papan angka berganti: “{a_lalu.get('label')}” → “{a_kini.label}”")

    # the ledger's own status changes, mechanical
    janji_berubah: list[str] = []
    status_lalu = {j.get("id"): j.get("status") for j in jendela[0].get("janji") or []}
    for j in edisi.janji or []:
        dulu = status_lalu.get(j.id)
        if dulu and j.status and dulu != j.status:
            janji_berubah.append(f"{j.teks}: {dulu} → {j.status}")

    ing = Ingatan(
        jendela=len(jendela), cerita=cerita,
        angka=angka or None, janji_berubah=janji_berubah or None,
    )
    if log:
        log("ingatan", jendela=len(jendela),
            baru=sum(1 for c in cerita if c.status == "BARU"),
            berkembang=sum(1 for c in cerita if c.status == "BERKEMBANG"),
            berlalu=sum(1 for c in cerita if c.status == "BERLALU"),
            angka=len(angka), janji=len(janji_berubah))
    return ing


def simpan_arsip(edisi: Edisi) -> Path:
    """Write this edition's SLIM record (what the next diffs need, nothing
    heavier) and prune the shelf to SIMPAN_MAKS. The Actions job commits the
    file — the repo itself is the memory the reader can open."""
    ARSIP.mkdir(exist_ok=True)
    rec = {
        "edisi": edisi.edisi,
        "terbit": edisi.terbit,
        "sesi": edisi.sesi,
        "angka": {"label": edisi.angka_edisi.label, "nilai": edisi.angka_edisi.nilai},
        "kliping": [
            {"id": k.id, "judul": k.utama.judul, "skor": k.skor}
            for k in (edisi.kliping or [])
        ],
        "janji": [
            {"id": j.id, "status": j.status}
            for j in (edisi.janji or []) if j.id and j.status
        ],
    }
    p = ARSIP / f"edisi-{edisi.edisi}.json"
    p.write_text(json.dumps(rec, ensure_ascii=False, indent=1), encoding="utf-8")

    lama = sorted(ARSIP.glob("edisi-*.json"),
                  key=lambda q: int(q.stem.split("-")[1]) if q.stem.split("-")[1].isdigit() else 0,
                  reverse=True)
    for q in lama[SIMPAN_MAKS:]:
        q.unlink(missing_ok=True)
    return p
