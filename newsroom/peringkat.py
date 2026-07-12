"""
PERINGKAT: the front page's №1 is the day's most-covered story, but coverage
volume alone is a popularity contest. This pass has the model read the rack's
verbatim titles and score each cluster on an Eisenhower-style matrix —
PENTING (importance to public life), MENDESAK (urgency), DAMPAK (how many
people it touches) — each 1-5. The model only ORDERS Lane A content; it never
writes a word of it. Acceptance is deterministic: valid index, integer scores
in range, a bounded link-free one-line reason. The final rank is transparent
arithmetic: matrix total (3-15) weighted ×10, ownership-diversity skor as the
tiebreak. A dead lane or a failed gate leaves the diversity order untouched —
the rack never depends on the model to exist.
"""

from __future__ import annotations

import json
import re

from .llm import build_model
from .models import Kliping

_SYSTEM = (
    "Kamu redaktur pelaksana sebuah koran sipil Indonesia. Untuk tiap judul "
    "klaster berita bernomor di bawah, beri skor bulat 1-5 pada tiga sumbu: "
    "penting (bobot bagi kehidupan publik: hukum, anggaran, keselamatan, "
    "hak), mendesak (perlu diketahui hari ini), dampak (berapa banyak orang "
    "terdampak). Olahraga dan hiburan jarang melebihi 2 pada penting. Balas "
    'HANYA JSON: [{"i": <nomor>, "penting": n, "mendesak": n, "dampak": n, '
    '"alasan": "<satu kalimat datar berbahasa Indonesia, maksimum 120 '
    'karakter>"}] untuk SEMUA nomor. Tanpa opini politik, tanpa angka baru.'
)


def _nilai(k: Kliping) -> tuple[int, int]:
    m = k.matriks or {}
    total = sum(v for v in m.values() if isinstance(v, int))
    return (total * 10 + k.skor, k.skor)


async def peringkat_kliping(kliping: list[Kliping], catat=None) -> int:
    """Score + re-order the rack in place (matrix first, diversity tiebreak).
    Returns how many clusters got a matrix. Failure = diversity order stays."""
    model = build_model()
    if model is None or len(kliping) < 2:
        return 0

    from pydantic_ai import Agent

    agent = Agent(model, output_type=str, system_prompt=_SYSTEM, retries=1)
    daftar = "\n".join(
        f"{i + 1}. {k.utama.judul} ({k.n_media} media, {k.n_grup} grup, meja {k.meja})"
        for i, k in enumerate(kliping)
    )
    try:
        hasil = await agent.run(f"KLASTER:\n{daftar}")
        mentah = str(hasil.output)
    except Exception as exc:
        sub = getattr(exc, "exceptions", None)
        rinci = "; ".join(f"{type(e).__name__}: {str(e)[:90]}" for e in sub) \
            if sub else f"{type(exc).__name__}: {str(exc)[:120]}"
        if catat:
            catat("peringkat_gugur", alasan=f"lane: {rinci[:300]}")
        return 0

    m = re.search(r"\[.*\]", mentah, re.S)
    if not m:
        if catat:
            catat("peringkat_gugur", alasan="jawaban bukan JSON")
        return 0
    try:
        baris = json.loads(m.group(0))
    except Exception:
        if catat:
            catat("peringkat_gugur", alasan="JSON tidak sah")
        return 0

    dinilai = 0
    for b in baris if isinstance(baris, list) else []:
        if not isinstance(b, dict):
            continue
        try:
            i = int(b.get("i", 0)) - 1
            skor3 = {s: int(b.get(s, 0)) for s in ("penting", "mendesak", "dampak")}
        except (TypeError, ValueError):
            continue
        alasan = " ".join(str(b.get("alasan", "")).split())
        if not (0 <= i < len(kliping)):
            continue
        if not all(1 <= v <= 5 for v in skor3.values()):
            continue
        if len(alasan) > 160 or "http" in alasan.lower():
            alasan = ""
        kliping[i].matriks = skor3
        kliping[i].alasan_peringkat = alasan or None
        dinilai += 1

    if dinilai:
        kliping.sort(key=_nilai, reverse=True)
        if catat:
            catat("peringkat", dinilai=dinilai,
                  utama=kliping[0].utama.judul[:90])
    return dinilai
