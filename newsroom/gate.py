"""
The fact gate: a resolver, not a model. No appeal, no softening. Ported verbatim
in behaviour from the TypeScript newsroom/gate/factGate.ts.

  1. Every cited id must exist in the corpus, or the finding drops.
  2. Every number >= 100 quoted in headline/body must match a cited row within
     0.5%, or the finding drops. (Years and counts under 100 are not treated as
     load-bearing claims.)

Hallucination is filtered, not argued with. This gate is why a cheap model is a
throughput problem, never a truth problem. In the desks it runs as a Pydantic AI
output validator: a failure raises ModelRetry(reason) and the model re-drafts
with that exact reason fed back (loop 2, retry-with-feedback).
"""

from __future__ import annotations

import re

from .models import CorpusRow, Temuan

# (?:Rp )?digit run with id-ID separators, optional unit suffix
_NUM_RE = re.compile(
    r"(?:Rp\s*)?\d[\d.,]*(?:\s*(?:%|miliar|juta|triliun|ha|bulan|tahun|jiwa))?",
    re.IGNORECASE,
)


def angka(raw: str) -> float | None:
    """Normalise an Indonesian-formatted number string to a comparable value.
    id-ID: dots are thousands separators, comma is the decimal."""
    cleaned = re.sub(r"[^\d,.]", "", raw)
    if not cleaned:
        return None
    normalized = cleaned.replace(".", "").replace(",", ".")
    try:
        n = float(normalized)
    except ValueError:
        return None
    lower = raw.lower()
    if "triliun" in lower:
        return n * 1e12
    if "miliar" in lower:
        return n * 1e9
    if "juta" in lower:
        return n * 1e6
    return n


def periksa(draft: Temuan, corpus: dict[str, CorpusRow]) -> str | None:
    """Return a rejection reason, or None if the finding is gate-clean."""
    for cid in draft.cited_ids:
        if cid not in corpus:
            return f"sitasi tidak ada di korpus: {cid}"

    cited_values: set[float] = set()
    for cid in draft.cited_ids:
        for v in corpus[cid].nilai.values():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                cited_values.add(float(v))

    text = f"{draft.headline} {draft.body}"
    for m in _NUM_RE.findall(text):
        n = angka(m)
        if n is None or n < 100:
            continue  # years, small counts: not load-bearing claims
        cocok = any(abs(v - n) / max(abs(v), 1) < 0.005 for v in cited_values)
        if not cocok:
            return f'angka "{m.strip()}" tidak cocok dengan baris yang disitasi'
    return None


def fact_gate(
    drafts: list[Temuan], corpus: dict[str, CorpusRow]
) -> tuple[list[Temuan], list[tuple[Temuan, str]]]:
    """Split drafts into (lolos, gugur-with-reason)."""
    lolos: list[Temuan] = []
    gugur: list[tuple[Temuan, str]] = []
    for d in drafts:
        reason = periksa(d, corpus)
        if reason:
            gugur.append((d, reason))
        else:
            lolos.append(d)
    return lolos, gugur
