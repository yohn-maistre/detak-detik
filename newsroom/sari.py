"""
SARI: the kliping desk's Lane C layer. For the top clusters, the model writes a
two-sentence overview from the cluster's own verbatim evidence (titles + ledes)
and nothing else. Acceptance is deterministic, not trusted: the summary must be
bounded, link-free, and every number token in it must appear in the evidence —
numbers are where a machine summary does real damage, and matching them is
free. A summary that fails is dropped, not fixed: absence over invention. The
site labels whatever survives `SARI · LANE C`.
"""

from __future__ import annotations

import re

from .llm import build_model
from .models import Kliping

_SARI_MAKS_KLASTER = 6
_SARI_MAKS_CHAR = 320

_SYSTEM = (
    "Kamu penulis ringkasan redaksi berbahasa Indonesia baku dan datar. Tulis "
    "SATU ringkasan sepanjang dua kalimat (maksimum 300 karakter) atas kumpulan "
    "judul dan lede berita berikut. Aturan mutlak: hanya fakta yang tertulis "
    "pada BUKTI; jangan menambah angka, nama, tanggal, atau sebab-akibat yang "
    "tidak tertulis; tanpa opini dan tanpa kata sifat dramatis; jangan sebut "
    "nama media. Balas dengan ringkasannya saja."
)

_ANGKA = re.compile(r"\d[\d.,]*")


def _angka_norm(teks: str) -> set[str]:
    """Digit tokens, separator-stripped, so '1.500' == '1,500' == '1500'."""
    return {a.strip(".,").replace(".", "").replace(",", "")
            for a in _ANGKA.findall(teks)}


def _gate_sari(sari: str, bukti: str) -> str | None:
    """Deterministic acceptance: bounded, link-free, every number tracable to
    the evidence text. Returns the cleaned summary, or None (= silence)."""
    s = " ".join(sari.split())
    if not s or len(s) > _SARI_MAKS_CHAR or "http" in s.lower():
        return None
    if not _angka_norm(s) <= _angka_norm(bukti):
        return None
    return s


async def tulis_sari(kliping: list[Kliping], bukti: dict[str, list[str]]) -> int:
    """Write gated overviews onto the top clusters in place. Returns how many
    survived. No model lane, thin evidence, or a failed gate all mean the same
    thing: `sari` stays None and the lembar prints nothing."""
    model = build_model()
    if model is None or not kliping:
        return 0

    from pydantic_ai import Agent

    agent = Agent(model, output_type=str, system_prompt=_SYSTEM, retries=1)
    ditulis = 0
    for k in kliping[:_SARI_MAKS_KLASTER]:
        baris = bukti.get(k.id) or []
        if len(baris) < 2:
            continue  # one clip is a headline, not a story to summarize
        teks_bukti = "\n".join(baris)
        try:
            hasil = await agent.run(f"BUKTI:\n{teks_bukti}")
            lolos = _gate_sari(str(hasil.output), teks_bukti)
        except Exception:
            lolos = None  # the lane failed; silence is the honest output
        if lolos:
            k.sari = lolos
            ditulis += 1
    return ditulis
