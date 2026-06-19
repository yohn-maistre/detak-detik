"""
The newsroom's typed artifacts (Pydantic). These mirror two contracts at once:

  * the desk-internal schema (`Temuan`, was newsroom/lib/schemas.ts), and
  * the site's runtime edition contract (`src/lib/edition.ts` `LiveEdisi`),

so what the editor serialises is byte-compatible with what `edition.ts` and
`src/scripts/pagi-live.ts` already read. The model's job is only to phrase what
the deterministic gate has already proven; these types are how the gate, the
lawyer, and the editor pass that proof around.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Lens = Literal["hukum", "anggaran", "hutan", "janji", "papua", "harga", "data_hilang"]
SignatureViz = Literal["scatter", "struk", "ember", "sankey", "ledger", "wave", "ganda"]


class Temuan(BaseModel):
    """One drafted finding. Every number in headline/body must trace to a row in
    `cited_ids`; that is what the fact-gate enforces."""

    temuan_id: str
    edisi: int
    lens: Lens
    kode: str
    headline: str = Field(max_length=160)
    body: str = Field(max_length=900)
    cited_ids: list[str] = Field(min_length=1)
    skor: float = Field(ge=0, le=1)
    signature_viz: SignatureViz


class AngkaEdisi(BaseModel):
    """The day's single most striking cited number (the Act II odometer)."""

    nilai: float
    label: str
    cited_ids: list[str] = Field(min_length=1)
    prefix: str | None = None


class TickerItem(BaseModel):
    """A Lane A headline: verbatim RSS pass-through, no model ever touches it."""

    src: str
    teks: str
    url: str | None = None


class LiveTemuan(BaseModel):
    """The lighter shape the site renders (edition.ts `LiveTemuan`)."""

    lens: str
    headline: str
    body: str


class Edisi(BaseModel):
    """The published edition. `model_dump(exclude_none=True)` drops the optional
    fields when absent, matching the JSON the worker stores and the site reads."""

    edisi: int
    terbit: str
    sesi: Literal["pagi", "petang"]
    angka_edisi: AngkaEdisi
    lead: str
    temuan: list[LiveTemuan]
    ticker: list[TickerItem] = Field(default_factory=list)
    dek: str | None = None
    tajuk: dict | None = None


class CorpusRow(BaseModel):
    """A corpus row as the gate sees it: a stable id -> the values that row holds.
    Any number a finding quotes must appear among some cited row's `nilai`."""

    id: str
    nilai: dict[str, float | str]
