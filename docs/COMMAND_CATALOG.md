# COMMAND_CATALOG.md — Lembaran

> The app's nervous system. One command vocabulary, five speakers (location toggle,
> user clicks, lens tabs, tours, the agent). The agent has no special powers; it is
> one more speaker. Every command is validated against a Zod schema before it
> executes. No command, no DOM change. Read alongside `DATA_CONTRACTS.md` (what the
> tools query) and `NEWSROOM.md` (who emits tour scripts).

---

## 0. The model

The page is a state machine. A single reducer applies validated commands and the
view transitions (GSAP handles choreography). The agent never writes HTML. It emits
commands from this catalog, the dispatcher validates and executes them. This makes
every feature scriptable into a tour for free, and means a weak model can only ever
do safe, known things.

```
input (click | toggle | lens tab | tour step | agent) 
   -> command (validated against catalog) 
   -> dispatcher 
   -> state transition 
   -> GSAP choreography
```

---

## 1. UI commands

The verbs that change the view. Every speaker uses these.

| command | params | effect |
|---------|--------|--------|
| `fly_to` | `kode` or `{lat,lon,zoom}` | camera move to a region or point |
| `set_lens` | `lens` (`hukum`/`anggaran`/`hutan`/...) | re-skin the map, swap section |
| `set_scope` | `nasional` or `{kode}` | the Lokal/Nasional toggle; recenters and reorders |
| `set_layer` | `layer`, `on` (bool) | toggle a map layer (embers, heatmap, peta_lama, points) |
| `set_layer_opacity` | `layer`, `value` | for the Peta Lama historical slider |
| `highlight` | `ids` (string[]) | emphasize regions/dots/nodes |
| `open_sheet` | `panel`, `ref` | open the bottom sheet / side pane to a panel (dossier, case, struk, game) |
| `set_sheet_height` | `peek`/`half`/`full` | snap the sheet |
| `show_chart` | `spec` (chart spec) | render a chart in the sheet (scatter, sankey, receipt, line) |
| `open_dossier` | `kode` | open a region's profile page |
| `open_temuan` | `temuan_id` | open a finding permalink |
| `set_mode` | `jelajah`/`baca`/`tanya`/`tur`/`main` | the five modes |

Hard rules from `LEMBARAN_DESIGN.md`, enforced in the dispatcher:
- At most one primary map layer at a time plus the quiet base. The agent may compose
  at most two layers. Reject a third.
- Every command that changes meaningful state also updates the URL (law 4: every
  state is a URL).

---

## 2. Data tools (the agent's local toolbelt)

These run in the browser, on the reader's device, free. The agent calls them; the
results come back into the loop. All are deterministic and read-only.

| tool | params | runs on | returns |
|------|--------|---------|---------|
| `sql_query` | `sql` (read-only, row-capped) | DuckDB-WASM over Parquet | rows + the row ids (for citation) |
| `graph_walk` | `start`, `rel`, `hops` | graphology / DuckDB CTE | nodes + edges + provenance |
| `search_corpus` | `q` | Pagefind (+ tier-2 embeddings) | ranked fragments with source ids |
| `get_dossier` | `kode` | fetch JSON | a region profile |
| `get_temuan` | `temuan_id` | fetch JSON | a finding with cited_ids |
| `sebandingkan` | `rupiah`, `kode` | client math | tangible-unit conversions (see EDITORIAL registry) |
| `generate_tour` | `topic`, `context` | one Worker -> NIM call | a validated tour script (section 4) |

Guardrails:
- `sql_query` is read-only, row-capped, and timeboxed. The agent gets the schema in
  its system prompt, not the data.
- Every factual sentence the agent emits must reference ids returned by a tool. The
  client strips any claim without backing ids before render (law 1, enforced at the
  UI, not trusted to the model).
- `generate_tour` is the only data tool that costs a model call. Everything else is
  free local compute.

---

## 3. The agent loop (the harness)

A ReAct loop living in the terminal island. The Worker is a stateless proxy
(auth, rate-limit, cache, forward). The browser executes tools locally.

1. Reader asks. Browser sends conversation + tool catalog to the Worker.
2. Worker checks cache (KV). Hit -> return cached answer (free). Miss -> forward to
   NIM.
3. Model returns a tool call. Browser executes it locally (section 2).
4. Result returns through the Worker to the model. Loop, capped at 5 hops.
5. Final answer renders with citation chips. The answer is persisted as a static
   permalink (and cached), so popular questions cost zero on every later hit and
   each becomes an indexable page.

Degrade ladder (from `PRD-00`): cache hit -> deterministic SQL-template answer with
no model call -> queued with the "Aksara lagi istirahat, ini jawaban tersimpan dari
pertanyaan serupa" fallback. The site never breaks; it gets more precomputed under
load.

The terminal shows its work: the SQL it ran, the rows it cited. The transparency
dashboard's own agent is transparent. This is a feature, not debug output.

---

## 4. The tour script format

The universal artifact. A tour is a sequence of command-bus steps interleaved with
narration and timing. It is the same format whether precomputed, generated at
runtime, or replayed. Three ways a script is born, one engine replays them all.

```json
{
  "tour_id": "halmahera-nikel-vs-hutan",
  "judul": "Nikel dan hutan di Halmahera",
  "asal": "generated",            // "opener" | "generated" | "newsroom"
  "narasi_bahasa": "id",
  "langkah": [
    {
      "cmd": "set_lens", "params": { "lens": "hutan" },
      "narasi": "Mulai dari tutupan hutan Halmahera.",
      "tahan_ms": 3000
    },
    {
      "cmd": "fly_to", "params": { "kode": "82..." },
      "narasi": "...", "tahan_ms": 2500
    },
    {
      "cmd": "set_layer", "params": { "layer": "embers", "on": true },
      "narasi": "Titik kehilangan tutupan bulan ini.", "tahan_ms": 3000
    }
  ],
  "kartu_akhir": { "template": "tour-summary", "cited_ids": ["..."] }
}
```

Rules:
- Generated tours are validated against this schema and the command catalog before
  replay. An invalid step is dropped, not executed.
- Every generated tour is cached as a permanent public tour with its own permalink.
  The tour library grows itself from reader curiosity at near-zero marginal cost.
- `asal: "newsroom"` is the nightly opening camera move authored by the layout desk
  (the first 15 seconds every reader sees). `asal: "opener"` are the precomputed
  "ingin saya tunjukkan?" menu tours. `asal: "generated"` are runtime, from a locked
  conversation.

### Runtime tour flow

The agent converses normally (cheap text turns) to help the reader narrow what they
want. Once locked in, it emits ONE `generate_tour` call that returns a complete
script. One model call per tour, GSAP timing precision instead of network jitter,
and the result is cached forever. This is the demo to lead with.

---

## 5. Session JSONL (the reader's memory)

pi-shaped. Append-only, typed lines, in IndexedDB. The session is the event log; the
Worker stays amnesiac. Resume = replay. A session log and a tour script are the same
species (record, replay, branch).

Line types:

```json
{"type":"session","version":1,"id":"uuid","mulai":"2026-06-11T...","scope":"nasional"}
{"type":"pesan","peran":"user","teks":"..."}
{"type":"alat","nama":"sql_query","params":{...},"hasil_ids":["..."]}
{"type":"perintah","cmd":"fly_to","params":{...}}     // UI commands the agent issued
{"type":"pesan","peran":"aksara","teks":"...","cited_ids":["..."]}
{"type":"ringkas","teks":"..."}   // compaction digest line
```

Compaction (pi-style): when a session grows, the model produces one digest line
(regions of interest, topics, open threads) that becomes the standing context,
instead of replaying full history. Cheap, bounded, and how Aksara "remembers" you
care about Nabire without that fact ever leaving your device.

Export / import: the JSONL file downloads and re-imports. Data sovereignty as a
visible button.

---

## 6. The event envelope (AG-UI-shaped)

The Worker streams events over SSE in an AG-UI-compatible shape. We adopt the
protocol's event shapes (so streaming is debuggable and standard-shaped, and a
standard client can plug in later for free) without adopting any agent SDK. Event
types we emit: `pesan_mulai`, `pesan_delta`, `alat_panggil`, `alat_hasil`,
`perintah`, `pesan_selesai`, `galat`.

We do NOT install CopilotKit, assistant-ui, or a stateful agent backend. Our command
bus over a typed civic catalog is already a tiny A2UI with a domain vocabulary. The
generic libraries assume a stateful server runtime we do not have; they would make
us express "fly the map to Halmahera" through abstractions built for rendering forms
in a chat sidebar. We steal the protocol shapes, not the framework.
