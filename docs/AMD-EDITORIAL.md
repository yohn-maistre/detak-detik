# AMD-EDITORIAL.md — append to EDITORIAL_GUIDELINES.md

---

## 9. Lane C: attributed monitoring

Lane C is a new epistemic register for claims that are real, documented, and
important but do not come from official structured data. It exists because
structured official silence on a crisis is itself a fact, and a publication
that can only speak from official rows structurally reproduces that silence.

### What qualifies as a Lane C source

Named, established civil-society monitors and church bodies with a track
record of on-the-ground documentation. For Papua specifically: Human Rights
Monitor (HRM), Dewan Gereja Papua, Komnas HAM, Amnesty International
Indonesia, Jubi.id (as original-reporting source), Suara Papua, Yayasan
Pusaka Bentala Rakyat, Watchdoc, Greenpeace Indonesia. Additions to this
list are editorial decisions, not pipeline decisions, and must be recorded
in SOURCES ledger with a rationale.

### Lane C rendering rules

Every Lane C claim:
- Carries a visually distinct chip: `[HRM · Mar 2026]` styled in a separate
  color from Lane B's green chips. Readers must always know which register
  they are reading.
- Uses ranges, not false precision: "107.039 per HRM Maret 2026; perkiraan
  >129.700 per KNPB mengutip HRM, Mei 2026" not "129.700 pengungsi."
- Shows conflicting figures side by side when they exist. Conflict in the
  data is information, not a reason to suppress one number.
- Never asserts the number as Lembaran's own measurement. The paper reports
  that named monitors report it. This is wire-service standard.

### The staging gate (non-negotiable)

Lane C content never auto-publishes from a fresh monitor report without a
human glance. The pipeline writes new Lane C claims to a staging JSONL file
(`/data/staging/lane-c-queue.jsonl`). A human reviews and approves the line
(just a `"approved": true` field edit) before the newsroom desk picks it up.
These are allies; we pull gently, attribute loudly, and never race to be
first on a conflict claim. Getting it wrong once costs the credibility that
makes the rest of the paper matter.

---

## 10. Papua conflict coverage: specific rules

Papua coverage sits at the intersection of Lane B (structured data) and
Lane C (monitor data) and requires both to work. Some explicit rules:

**Never print:** victim names or images of individuals in displacement
situations without explicit sourcing from the monitor that named them.
Operational military detail. Coordinates of displacement camps. Speculation
about armed actors' identities. The pembubaran-nobar tracker (see NOT_NOW).

**Always print:** the data-source chip, the date of the monitor report, the
report's own stated methodology or caveat. "Data tidak tersedia" as a row in
any official table that should but doesn't have a number.

**The Yang Tidak Dihitung principle:** the government's statistical silence
is a publishable fact. A table of official BPS/APBD statistics for a
kabupaten that has no row for warga mengungsi is a document that speaks.
Print the table. Print the absence. Attribute the absence to the official
source. No allegation required.

---

## 11. Satire-by-adjacency: what is and isn't permitted

The World Cup juxtaposition and future similar framings work only with
strict discipline:

**Permitted:** placing two cited facts in the same visual without a
connective clause. A match score next to a displacement counter. A budget
struk next to an IDP figure. Silence speaks loudly enough; the paper does
not need to explain the contrast.

**Permitted in the struk-roast register:** one dry factual sentence at the
bottom of a receipt or a badge, worded as a question or an arithmetic
observation. "Setara X bulan gaji UMR. Bukan di Papua, tentu." Zero.

**Not permitted:** punchlines in the same frame as displacement or death
figures. Scoreboard or sports graphic wrapping used to frame IDP counts.
Caricature or mockery of named individuals, especially in conflict-adjacent
content. Any framing that aestheticizes suffering.

**The Aksara voice rule for conflict content:** drier than usual, shorter
than usual. One sentence of cited context. One next-hop chip. No
narrative color.

---

## 12. Kalimantan Selatan as secondary region

The same Lane B/C machinery applies to other high-priority regions. KalSel
is the named secondary focus: Sungai Kahayan and its tributaries, PSN
infrastructure projects, forest conversion, indigenous Dayak land rights.
The data pipelines are mostly identical to the Papua ones. The editorial
register is identical. Lane A partners for KalSel: Mongabay Indonesia,
Kaltim Post, Radar Banjarmasin.
