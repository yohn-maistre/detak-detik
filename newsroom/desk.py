"""
The desk engine: the one reusable shape every beat shares, so a new desk is just
a detector + a prompt.

A desk does two things, always in this order:
  1. DETECTION is deterministic and beat-specific (SQL-shaped rules over the
     beat's rows). It yields a candidate `Temuan` that is already gate-safe by
     construction, or None when there is no story. Detection lives in the beat
     module, because each beat's rules and inputs differ.
  2. NARRATION is the model's only job, and it is identical across beats:
     sharpen the candidate's headline/body under the fact-gate. The gate runs as
     a Pydantic AI `@output_validator` that raises `ModelRetry(reason)` on any
     number that does not trace to a cited row, so the model re-drafts with that
     reason (loop 2, retry-with-feedback). With no model key the deterministic
     candidate stands; the gate, not the model, guarantees truth.

`narrate()` is that shared engine. A beat module supplies the candidate, the
corpus, and a system prompt; nothing else. The same engine would serve any
"desk" of automated analysts: detect deterministically, narrate under a gate.
"""

from __future__ import annotations

from dataclasses import dataclass

from .gate import periksa
from .llm import build_model
from .models import CorpusRow, Temuan


@dataclass
class CorpusDeps:
    """Carried on the agent run so the output validator can reach the corpus."""

    rows: dict[str, CorpusRow]


def _draft_prompt(candidate: Temuan, corpus_map: dict[str, CorpusRow]) -> str:
    cited = [corpus_map[c].model_dump() for c in candidate.cited_ids if c in corpus_map]
    return (
        f"DATA (baris tersitasi): {cited}\n"
        f"DRAF: {candidate.model_dump_json()}\n"
        "Pertajam headline & body; pertahankan cited_ids dan angka persis dari DATA."
    )


async def narrate(
    candidate: Temuan | None,
    corpus_rows: list[CorpusRow],
    system_prompt: str,
    *,
    retries: int = 3,
) -> Temuan | None:
    """Run the shared desk loop. Returns a gate-clean `Temuan`, or None.

    The deterministic candidate must itself be gate-clean (else there is nothing
    honest to print and we drop it). If a model lane is configured, it sharpens
    the draft under the fact-gate; otherwise the candidate stands."""
    if candidate is None:
        return None
    corpus_map = {r.id: r for r in corpus_rows}
    if periksa(candidate, corpus_map) is not None:
        return None  # even the deterministic draft isn't gate-clean: drop it

    model = build_model()
    if model is None:
        return candidate  # number-only finding; truth is the gate's job, not the model's

    from pydantic_ai import Agent, ModelRetry, RunContext

    agent = Agent(
        model,
        output_type=Temuan,
        deps_type=CorpusDeps,
        system_prompt=system_prompt,
        retries=retries,
    )

    @agent.output_validator
    async def _gate(ctx: RunContext[CorpusDeps], t: Temuan) -> Temuan:
        reason = periksa(t, ctx.deps.rows)
        if reason:
            raise ModelRetry(
                f"Tolak: {reason}. Perbaiki agar setiap angka cocok dengan baris tersitasi."
            )
        return t

    try:
        result = await agent.run(
            _draft_prompt(candidate, corpus_map), deps=CorpusDeps(rows=corpus_map)
        )
        return result.output
    except Exception:
        # model lane failed after retries; the deterministic draft is gate-clean
        return candidate
