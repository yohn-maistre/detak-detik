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

# every cluster on the rack gets an attempt (the rack itself is capped
# upstream); singletons still skip — one clip is a headline, not a story
_SARI_MAKS_KLASTER = 16
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


async def tulis_sari(kliping: list[Kliping], bukti: dict[str, list[str]],
                     catat=None) -> int:
    """Write gated overviews onto the top clusters in place. Returns how many
    survived. No model lane, thin evidence, or a failed gate all mean the same
    thing for the reader: `sari` stays None and the lembar prints nothing —
    but each drop is logged with its reason (`catat` = Log.event) so a dead
    provider key is diagnosable from the run log, not invisible."""
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
        alasan: str | None = None
        try:
            hasil = await agent.run(f"BUKTI:\n{teks_bukti}")
            lolos = _gate_sari(str(hasil.output), teks_bukti)
            if lolos is None:
                alasan = "gate: angka/panjang/tautan"
        except Exception as exc:  # the lane failed; silence is the honest output
            lolos = None
            # an ExceptionGroup's str() hides its children — surface each
            # lane's real error (401 vs 404 vs quota) so the log can diagnose
            sub = getattr(exc, "exceptions", None)
            rinci = "; ".join(f"{type(e).__name__}: {str(e)[:110]}" for e in sub) if sub else str(exc)[:160]
            alasan = f"lane: {type(exc).__name__}: {rinci[:400]}"
        if lolos:
            k.sari = lolos
            ditulis += 1
        elif catat:
            catat("sari_gugur", id=k.id, alasan=alasan)
    return ditulis
