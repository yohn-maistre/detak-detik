# Pantau LEGISLATIF + YUDIKATIF + laws-gazetted — endpoint cookbook

Probed 2026-07-05 (UTC timestamps per row) from the deploy datacenter.
UA: `detak-detik/1.0 (koran sipil; josejr2498@gmail.com)`, ≥2s spacing per
host, 21 requests total, `curl -k` used throughout (some go.id chains are
incomplete; none of the 200s below depended on it failing closed).
NOT re-tested (known Cloudflare/WAF-blocked, house law): dpr.go.id main,
putusan3.mahkamahagung.go.id, mkri.id, acch.kpk.go.id, hukumonline.com,
presidenri.go.id.

Tiers: **GOLD** = keyless + structured + fresh, wire it. **PARSE** = open
HTML worth a scraper. **CUR** = works but sparse/unproven, curate or
revisit. **BLOCKED** = documented dead end.

---

## 1. emedia.dpr.go.id — DPR news RSS, full text — **GOLD**

The DPR side door that pays out. Main dpr.go.id is CF-blocked, but its
official news portal (PARLEMENTARIA) has an uncapped RSS with FULL article
bodies.

- Endpoint: `https://emedia.dpr.go.id/rss.xml`
- Probe: `curl -k -A "$UA" https://emedia.dpr.go.id/rss.xml` →
  **HTTP 200**, 258,558 B, `application/rss+xml` @ 2026-07-05T11:20:54Z
- Format: RSS 2.0, **50 items**, each with `<title>`, `<link>`,
  `<pubDate>`, `<category>` (e.g. "Industri dan Pembangunan"),
  `<description>` (lede) AND `<content:encoded>` (**full text**, HTML).
- Freshness: top items pubDate `Sun, 05 Jul 2026 10:40:00 GMT` — **same
  day as probe, intraday cadence** (multiple items/hour on sitting days).
- Sample title (verified in feed): "Pantura Cikampek-Cirebon Jadi PR
  Besar, Legislator Dorong Dukungan Pusat" →
  `/news/2026/07/05/pantura-cikampek-cirebon-...`
- License: official DPR press bureau output; cite "PARLEMENTARIA / E-Media
  DPR RI". Standard gov news — quote with attribution, don't re-host
  images.
- Polling plan: every 2–6 h; dedupe by link. This alone gives detak-detik
  a live legislatif desk (komisi activity, RUU progress, budget hearings —
  categories + tags like `ruu-statistik` come along in the item URLs).
- Note: homepage is a 2.4 MB SPA — ignore it, the feed is the machine
  route. Site also links `https://www.dpr.go.id/kegiatan-dpr/agenda`
  (untested here, main-domain house rule).

## 2. peraturan.bpk.go.id — JDIH BPK — **GOLD** (THE laws-gazetted lane)

No RSS/JSON anywhere in the page (grepped: zero hits), but the HTML search
is newest-first, complete, fast (0.79 s for 207 KB), and paginated — a
clean scraper target.

- Search endpoint:
  `https://peraturan.bpk.go.id/Search?keywords=&tentang=&nomor=&jenis={ID}[&tahun=YYYY][&p=N]`
- Probe: `jenis=8` → **HTTP 200**, 207,706 B @ 2026-07-05T11:15:36Z.
  Banner: "Menemukan 1.926 peraturan" (UU corpus), ~10 cards/page,
  pagination `&p=1..193` (plain `href` links, no JS needed).
- **Default sort = newest first** — page 1, card 1 was UU 5/2026
  ("Berlaku mulai 18 hari yang lalu"). Poll page 1 per jenis only.
- `jenis` ID map (from the page's own `<select>`):
  | ID | Jenis | ID | Jenis |
  |----|-------|----|-------|
  | 8  | **UU** | 12 | **Keppres** |
  | 9  | **Perpu** | 13 | **Inpres** |
  | 10 | **PP** | 14 | Peraturan K/L (umbrella) |
  | 11 | **Perpres** | 18 | Perundang-undangan Daerah (umbrella) |
  | 7  | UUD 1945 | 39 | Tap MPR |
  | 36 | UU Darurat | 214 | Surat Edaran |
  | 15 | Permen (umbrella) | 16 | Kepmen (umbrella) |
  (plus per-kementerian IDs, e.g. 42 Permenkeu, 27 Peraturan BPK)
- Other GET params on the form: `keywords`, `tentang`, `nomor`, `tahun`,
  `tema`, `entitas`. No sort param found — not needed, default is newest.
- Row structure (per result card, inside `div.card > div.card-body`):
  - jenis+nomor line: `div.col-lg-8.fw-semibold` → "Undang-undang (UU)
    Nomor 5 Tahun 2026"
  - relative date: `span.text-muted` → "• Berlaku mulai 18 hari yang lalu"
  - title + link: `div.fs-2.fw-bold > a[href^="/Details/"]` →
    `/Details/{id}/{slug}`
  - tema badge: `span.badge-light-primary`
  - status relations: "Status Peraturan" block → Mengubah / Dicabut /
    Diubah dengan, each an `<a href="/Details/...">` (free law-graph!)
- Details page (`/Details/350096/uu-no-5-tahun-2026` → **HTTP 200**,
  44,558 B @ 2026-07-05T11:21:00Z) carries the canonical dates:
  **Tanggal Penetapan** 17 Juni 2026, **Tanggal Pengundangan** 17 Juni
  2026, Sumber "LN 2026 (63), TLN (7181): 16 hlm.; jdih.setneg.go.id",
  embedded PDF viewer + PDF download.
- Sample title (verified): UU No. 5 Tahun 2026 — "Perubahan Ketiga atas
  Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik
  Indonesia".
- Cadence: gazette-driven — UU are sparse (tens/yr) but PP/Perpres/
  Permen land weekly. Poll daily: page 1 of jenis 8, 9, 10, 11, 12, 13;
  fetch Details only for unseen `/Details/{id}`.
- License: JDIH public legal documents (peraturan are not copyrightable
  objects under UU 28/2014 Pasal 42); cite peraturan.bpk.go.id as source.

## 3. peraturan.go.id (BPHN) — **PARSE** (+ MK-putusan side door)

- Probe: `https://peraturan.go.id/` → **HTTP 200**, 75,021 B @
  2026-07-05T11:15:40Z. `https://peraturan.go.id/all` → **HTTP 200**,
  27,288 B @ 2026-07-05T11:21:08Z.
- Homepage is itself a "terbaru" feed: rows (`div.strip_booking`) carry
  full title, detail link `/id/{slug}`, direct PDF `/files/{slug}.pdf`,
  relative "Diundangkan 2 minggu yang lalu", and explicit
  **Tanggal Penetapan** / **Tanggal Pengundangan** (`ul.info_booking`).
- `/all` is the per-jenis index: `/uu`, `/uudrt`, `/tapmpr`,
  `/prolegnas`, `/progsun`, `/permenkumham`, `/terjemahresmi` (official
  English translations, dated), and — notable — **`/putusan` =
  "Penerbitan Putusan MK"**, with direct PDFs like
  `/files2/putusan-mahkamah-konstitusi-no-128-puu-xxiv-2026-tahun-2026.pdf`
  linked from the homepage. With mkri.id CF-blocked, this is the open
  route to gazetted MK decisions.
- Search: `GET /cariglobal?...` (form on homepage).
- Sample title (verified, homepage): "Undang-Undang Nomor 16 Tahun 2025
  tentang Perubahan Keempat atas UU 19/2003 tentang BUMN" (+ its official
  English translation, Tanggal Penerjemahan 24 Juni 2026).
- Cadence: weekly-ish (BPHN uploads lag pengundangan by days–weeks; BPK
  above is fresher for the same documents). Use as corroborator + for
  translations + MK putusan PDFs.
- License: public legal docs, cite peraturan.go.id (BPHN).

## 4. jdihn.go.id — national aggregator — **CUR** (JSON API exists, unproven)

- Home: **HTTP 200**, 76,524 B @ 2026-07-05T11:15:42Z. Search page
  `/pencarian` **HTTP 200** @ 2026-07-05T11:21:03Z — client-side, calls a
  **keyless JSON API** found in its JS (`APIurl = "https://jdihn.go.id/"`):
  - `GET https://jdihn.go.id/api/search?query=&jenis=&nomor=&tahun=&instansi=&status=`
    → Laravel-paginated JSON (`data[]`, `meta.total`, `per_page: 15`).
  - Verified alive: **HTTP 200 `application/json`** @ 2026-07-05T11:23:36Z
    — but `tahun=2026&jenis=Undang-Undang` AND `query=kepolisian&tahun=2026`
    both returned `total: 0`. The param vocabulary (exact `jenis` strings,
    whether `tahun` is penetapan-year) needs one more session with the
    site's own `pencarian/getJenisDokumen` + `api/getInstansi` helper
    routes before a verdict.
  - Other live helper routes seen in JS: `/api/count`, `/api/listProvinsi`,
    `/api/listJenisAnggota`.
- Verdict: promising (it IS the machine route the frontend uses) but
  returned zero rows on both probes — don't build on it yet. BPK (#2)
  already covers the lane.

## 5. Mahkamah Agung cluster

### www.mahkamahagung.go.id — **BLOCKED**
- **HTTP 403** @ 2026-07-05T11:15:45Z — Cloudflare "Just a moment…"
  challenge page (5,478 B). Same wall as the putusan directory.

### jdih.mahkamahagung.go.id — **PARSE** (open MA side, no feed)
- **HTTP 200**, 211,715 B (2.3 s) @ 2026-07-05T11:15:48Z. Custom app, no
  RSS, no generator meta.
- Routes: `/berita` + `/berita-detail/{slug}` (news);
  `/dokumen?jenis={putusan|puu|rancangan-puu|naskah-akademik|...}`
  (document listings incl. a putusan collection — NOT the blocked
  putusan3 directory, but a curated subset).
- Sample title (verified, homepage): "Mahkamah Agung Berkolaborasi dengan
  Kementerian Hukum" (`/berita-detail/mahkamah-agung-berkolaborasi-...`).
- Cadence: news looks weekly-monthly. Titles-only from listing; dates on
  detail pages. Worth a small scraper for the yudikatif desk given
  everything else MA is walled.

### kepaniteraan.mahkamahagung.go.id — **CUR** (RSS works, sparse)
- Home **HTTP 200**, 176,386 B @ 2026-07-05T11:15:52Z — Joomla
  (generator meta confirms), so the stock Joomla feed route works:
- `https://kepaniteraan.mahkamahagung.go.id/index.php?format=feed&type=rss`
  → **HTTP 200**, 148,329 B, `application/rss+xml` @ 2026-07-05T11:21:05Z.
- BUT latest item pubDate `Mon, 10 Nov 2025` — cadence ~quarterly.
  Structured, keyless, just slow. Wire it cheap (weekly poll), expect
  drips: kasasi/PK statistics posts are genuinely useful when they land.
- Sample title (verified in feed): "Capaian Tinggi dan Transformasi
  Digital Warnai Laporan Panitera Mahkamah Agung Tahun 2025".

## 6. Other DPR side doors

### jdih.dpr.go.id — **PARSE**
- **HTTP 200**, 146,536 B @ 2026-07-05T11:15:58Z — slow (6.1 s), plan
  generous timeouts.
- Homepage lists fresh committee news `/berita/detail/id/{id}/t/{title}`
  (overlaps emedia content) AND direct PDFs of Peraturan DPR / Persekjen
  at `https://berkas.dpr.go.id/jdih/document/peraturan_dpr/2025perdpr003.pdf`
  — the only open route to DPR's own regulations.
- Sample title (verified): "Komisi I Percepat Pembahasan RUU KKS Hadapi
  Ancaman Kejahatan Siber".
- Verdict: use emedia RSS for news; keep jdih.dpr for peraturan-DPR PDFs.

### berkas.dpr.go.id — file host only
- Root `/` → 301 → `www.dpr.go.id` which answered **HTTP 200**, 853,387 B
  @ 2026-07-05T11:16:06Z from this datacenter (observed incidentally via
  redirect — main-domain probing stays off-limits per house law; CF walls
  are often per-path/per-ASN, don't build on this).
- Deep paths (`/jdih/document/...pdf`, linked from jdih.dpr.go.id) serve
  files. Treat as a CDN, not a browsable index.

## 7. Oversight / penegak hukum

### ky.go.id — **BLOCKED** (dead to this network)
- `https://www.ky.go.id/feed/` → **HTTP 000** (connection failed in
  0.03 s, no TLS handshake) @ 2026-07-05T11:16:09Z. Likely geo/ASN drop.

### kpk.go.id — **CUR** (advertised feed is a 404)
- Home **HTTP 200**, 611,195 B @ 2026-07-05T11:16:11Z → `/id` — Nuxt SPA
  (content client-rendered; raw HTML parse unattractive).
- Footer advertises `/feed.xml`, but
  `https://www.kpk.go.id/feed.xml` → 302 → `/id/feed.xml` → **HTTP 404**
  @ 2026-07-05T11:20:58Z. Feed link is dead on their end. Revisit in a
  future sweep (they may fix it); until then KPK press releases have no
  machine route here (acch.kpk.go.id already known-blocked).

### kejaksaan.go.id — **BLOCKED**
- `https://www.kejaksaan.go.id/feed/` → **HTTP 200 but WAF interstitial**
  ("Request Rejected… support ID", F5 BIG-IP style, 245 B) @
  2026-07-05T11:16:16Z. Body is the rejection page, not content.

## 8. bpk.go.id (BPK main, IHPS) — **CUR**

- **HTTP 200**, 95,132 B @ 2026-07-05T11:16:20Z. No RSS `<link>` tags,
  no WordPress fingerprint.
- News archive at `/archive/news/berita-utama` (HTML listing, untested
  this sweep — request budget); IHPS audit reports are hand-built
  highlight microsites (`/assets/highlights/IHPS-1-2023/index.html` …).
- IHPS cadence is **semiannual** — this is a twice-a-year editorial event,
  not a feed. Curate manually when IHPS drops (May/Nov-ish).

---

## Ranked wiring order

| # | Source | Tier | Why |
|---|--------|------|-----|
| 1 | emedia.dpr.go.id/rss.xml | GOLD | keyless RSS, full text, intraday |
| 2 | peraturan.bpk.go.id /Search?jenis=N | GOLD | newest-first, complete gazette metadata, law-graph |
| 3 | peraturan.go.id | PARSE | penetapan+pengundangan dates on homepage, MK putusan PDFs |
| 4 | jdih.mahkamahagung.go.id | PARSE | only open MA activity route |
| 5 | jdih.dpr.go.id | PARSE | peraturan-DPR PDFs (slow host) |
| 6 | kepaniteraan MA Joomla RSS | CUR | works, ~quarterly drip |
| 7 | jdihn.go.id /api/search | CUR | JSON API alive, 0 rows on probes — one more session |
| 8 | bpk.go.id IHPS | CUR | semiannual editorial event |
| — | www.mahkamahagung.go.id | BLOCKED | Cloudflare 403 |
| — | kejaksaan.go.id | BLOCKED | F5 WAF rejection |
| — | ky.go.id | BLOCKED | connection drops (HTTP 000) |
| — | kpk.go.id /feed.xml | BLOCKED | advertised but 404 |

Politeness recap for the eventual harvesters: identify with the house UA,
≥2s between hits on one host, poll pages 1 only, dedupe by
link/`Details/{id}`, and generous timeouts for jdih.dpr.go.id (6 s+ TTFB
observed).
