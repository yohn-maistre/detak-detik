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


class KlipingItem(BaseModel):
    """One outlet's coverage of a clustered story. `judul` is verbatim Lane A
    text (a headline copied as-is from the outlet's feed, no model ever touches
    it); `grup` is the documented ownership group from the media roster and
    `independen` its documented independence flag (the site renders a filled
    square per independent outlet, a hollow one per conglomerate outlet)."""

    judul: str
    url: str
    media: str
    grup: str
    independen: bool = False
    # verbatim lede (the feed's own description text, cleaned of markup) —
    # Lane A; published only on the cluster's representative item
    ringkas: str | None = None


class Butir(BaseModel):
    """One key point on the lembar, Lane A verbatim: the first sentence of an
    outlet's lede, credited to that outlet. No model text, ever."""

    teks: str
    media: str | None = None


class Kliping(BaseModel):
    """One story cluster from the kliping desk: the same event as covered across
    outlets, scored by ownership diversity (n_grup weighs double so corroboration
    across groups beats volume inside one group). `titik_buta` marks coverage
    that never leaves a single ownership group. `meja` is the desk the cluster
    lands on (nasional | daerah | alam | dunia), assigned by deterministic
    keyword rules over the cluster's combined titles."""

    id: str
    utama: KlipingItem
    liputan: list[KlipingItem]
    n_media: int
    n_grup: int
    skor: int
    titik_buta: bool
    tumbuh: bool = False
    meja: str = "nasional"
    # Lane C machine overview, written only from the cluster's own verbatim
    # evidence and accepted only when its every number appears in that
    # evidence (see sari.py); None = silence, the lembar prints nothing
    sari: str | None = None
    # Lane A key points (see Butir); None/empty = the section is absent
    butir: list[Butir] | None = None
    # True when any clip comes from an official state source (roster `resmi`):
    # the government's own words, marked as such on the shelf
    resmi: bool = False
    # Lane A law mentions: legislation cited in the cluster's own verbatim
    # headlines (numbered regex + curated named aliases, see kliping._hukum_dari).
    # The lembar prints a § row; None = no law was named.
    hukum: list[str] | None = None


class KlipingMeta(BaseModel):
    """Pipeline transparency numbers for the kliping desk, shown on the front
    page: `judul` counts every headline fetched inside the window, `klaster` the
    clusters emitted after the editor's cap, `gelap` the dark feeds, and
    `disusun` the WIB wall-clock time (HH.MM) the desk finished."""

    judul: int
    klaster: int
    gelap: int
    disusun: str


class LiveTemuan(BaseModel):
    """The lighter shape the site renders (edition.ts `LiveTemuan`).
    `temuan_id` rides along so the front feed can print the finding's receipt
    chip next to the live headline."""

    lens: str
    headline: str
    body: str
    temuan_id: str | None = None


class Janji(BaseModel):
    """One entry of the buku besar (the promise ledger). The promise itself is
    Lane A — a documented statement with its source — and never changes; only
    `realisasi*` moves, refreshed by the janji desk, and `status` is COMPUTED
    (deadline × measured figure), never chosen. `arah` says whether the target
    is a floor ('naik', e.g. growth 8%) or a ceiling ('turun', e.g. poverty 0%).
    """

    id: str
    teks: str
    sumber: str
    sumber_url: str | None = None
    target: str
    target_angka: float | None = None
    tenggat: str | None = None  # ISO date the promise is due
    arah: Literal["naik", "turun"] = "naik"
    realisasi: str
    realisasi_angka: float | None = None
    realisasi_sumber: str | None = None
    realisasi_tanggal: str | None = None
    status: Literal["TERCAPAI", "BERJALAN", "TIDAK TERCAPAI", "DATA HILANG"] = "BERJALAN"


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
    kliping: list[Kliping] | None = None
    kliping_meta: KlipingMeta | None = None
    janji: list[Janji] | None = None


class CorpusRow(BaseModel):
    """A corpus row as the gate sees it: a stable id -> the values that row holds.
    Any number a finding quotes must appear among some cited row's `nilai`."""

    id: str
    nilai: dict[str, float | str]
