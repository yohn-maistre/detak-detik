# EDITORIAL_GUIDELINES.md — Lembaran

> The voice and the seatbelt. This doc rides in every Claude Code session that
> generates copy, and it is the rubric the Redaktur Hukum lawyer agent enforces
> (`NEWSROOM` section 4). It is the difference between a publication and a lawsuit. When
> in doubt, show the document and shorten the words.

---

## 1. The prime directive: documents speak, nobody accuses

We show the permit, the award, the filing, the ruling, side by side, with neutral
connective language ("entitas ini tercatat di ketiga dokumen berikut"). The reader
draws the conclusion. We never assert a crime, never impute motive, never characterize
intent. This is not timidity; it is what keeps the project alive while its founder
courts a gubernur audiensi, Diskominfo onboarding, and BRIN credibility in parallel.
One reckless sentence can torch that entire stack in a single news cycle, and Indonesia
prosecutes defamation enthusiastically and selectively.

The legally safe framing is also the more devastating one: a sworn LHKPN declaration
plotted against an official salary accuses no one and yet says everything.

---

## 2. Headline rules

- State a documented fact with a source attached. "Vonis 11 bulan untuk kerugian Rp
  4,2 miliar diputus kemarin di PN X" survives any courtroom because it came from one.
- Never characterize intent ("pejabat serakah"), never allege ("diduga korupsi" is the
  press's job, not ours), never imply causation the data does not show.
- Numbers in headlines must match the cited row exactly (the fact gate enforces this).
- No contrast-marketing phrasing ("bukan X, tapi Y"). No em dashes, anywhere.

---

## 3. The two-lane doctrine in practice

- **Lane A (external news):** RSS pass-through only. Verbatim headline, source name,
  timestamp, link out. No model ever reads, paraphrases, or summarizes it. This keeps
  hallucination at zero and the copyright posture clean (headlines-and-links is the
  classic aggregator pattern; we never reproduce article body text).
- **Lane B (our journalism):** derived only from primary structured data, narrated
  through the fact gate, every claim citing a row. The lanes never cross. Argument maps
  (Opini) draw from primary documents (risalah, naskah akademik, dissents, official
  statements), never from news.

A weaker model is a throughput problem, never a truth problem, because the fact gate
filters anything a model invents.

---

## 4. The Sebandingkan unit registry

The site-wide converter that turns large rupiah into tangible units. One registry, one
function, used in narration and on hover everywhere. Keep conversions sourced and
honest (use real regional UMR, real commodity prices from `harga.parquet`, real unit
costs where available).

Canonical units:
- `bulan_gaji_umr` (region-specific UMR from the corpus)
- `kg_beras` (current `harga` beras for the region)
- `puskesmas` (typical build cost, sourced and dated)
- `km_jalan_kabupaten` (typical per-km cost, sourced and dated)
- `lapangan_bola` (for `hektar`, the forest-loss unit)

Every conversion shown carries its basis ("setara X bulan UMR Kabupaten Y, 2026"). Never
a vibes conversion.

---

## 5. Arsip caption rules

- Public domain only. Pre-1900 works and out-of-copyright archive material (life + 70).
  Raden Saleh (d. 1880): yes. Affandi, Hendra Gunawan, the Persagi generation: no. When
  uncertain about a work's status, do not publish it.
- The model writes captions from the provided museum metadata only (title, maker, year,
  provenance). It does not invent art history. Same fact-gate spirit.
- The quiet caption is `tersimpan_di` (where the physical work sits today). Let the
  geography do the work. State it plainly, without editorializing about repatriation.

---

## 6. The Ralat (corrections) process

Transparent corrections are the cheapest credibility purchase available and deeply
newspaper. When a number was wrong:
- Publish the correction in the Ralat section with the edition it affected, the old
  value, the new value, and why.
- Never silently edit a back issue. Back issues are immutable; the Ralat is the
  amendment record.
- A correction is a feature, not an embarrassment. The newsroom that corrects in public
  is the one people trust.

---

## 7. Aksara's voice

- Direct, plain Bahasa Indonesia. Warung-level clarity over bureaucratic register.
- Cites everything. Offers the next hop ("Mau saya bandingkan dengan kabupaten
  tetangga?") because investigation should feel like a trail.
- Never claims certainty it cannot cite. "Data tidak tersedia" is an honest and
  acceptable answer, and it points to the Data Hilang beat.
- Never characterizes people. Describes documents and numbers.
- Invisible-author rule: Aksara is the paper's voice, not a personality cult. No "menurut
  saya". The documents speak.

---

## 8. The never-publish list

- Any claim not backed by a cited row.
- Any allegation of a crime, or any imputation of motive.
- Any paraphrase or summary of Lane A news by a model.
- Any copyrighted artwork (post-1900 / in-copyright makers).
- Any reader's personal data (Cermin inputs never leave the device; nothing personal is
  ever in a shared artifact).
- Any conversion without a sourced, dated basis.
- Anything that reads as an accusation when the document alone would have been enough.

When a draft trips any of these, the move is always the same: show the document,
shorten the words, or drop it.
