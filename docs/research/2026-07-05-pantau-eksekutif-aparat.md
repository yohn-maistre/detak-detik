# Pantau EKSEKUTIF + APARAT + PROGRAM + PROCUREMENT — feed probe cookbook

Probed 2026-07-05 11:14–11:19 UTC from the A12. 25 requests total, one per host
per wave, UA `detak-detik/1.0 (koran sipil; josejr2498@gmail.com)`, `curl -k`
throughout (go.id chains routinely ship broken intermediates — every verdict
below survived `-k`; re-verify cert chains before trusting any of these for
anything beyond news text). Known-blocked hosts NOT retested: presidenri.go.id,
dpr.go.id. Already wired elsewhere: setkab.go.id/feed/ (AGENDA ISTANA),
sismonbgn.com (MBG kitchen counts). tribratanews.polri.go.id: Odoo, no
/feed or /rss (tested 2026-07-05 in the sibling probe).

Verdicts: **GOLD** = keyless structured feed, ingest now · **PARSE** = keyless
HTML, stable server-rendered markup, scrape with a real parser · **CUR** =
curation-only (no machine surface found; human/agent reads the site) ·
**BLOCKED** = actively gated (WAF/auth/DNS).

License note (applies to all go.id / mil.id rows): state-produced news; no
explicit license page checked on any of these hosts. House law: cite + link,
reproduce headline + lead only, never re-host full text or images.

---

## GOLD — ingest-ready RSS

### 1. Kemhan (Kementerian Pertahanan) — WordPress RSS, FULL-TEXT
- Endpoint: `https://www.kemhan.go.id/feed` (probe: `curl -k -A "$UA" https://www.kemhan.go.id/feed/`)
- 2026-07-05T11:14:36Z → HTTP 200, `application/rss+xml; charset=UTF-8`, 55,845 B
- WordPress (wp-content fingerprint). 10 `<item>`, **`<content:encoded>` present → full article text in-feed.**
- Freshness: `lastBuildDate` Sun 05 Jul 2026 08:03 UTC — items from TODAY. pubDates Jul 5, Jul 5, Jul 4 → cadence ~1–3/day.
- Sample title: "Menhan RI Dukung Penanaman Padi dalam Rangka Program Strategis Nasional di Wanam" (pubDate 2026-07-05 08:02 UTC)
- **Verdict: GOLD.** Best find of the cluster: keyless, full-text, daily, and it's the defense ministry — high civic value (anggaran pertahanan, alutsista, program strategis).

### 2. Wapres (wapresri.go.id) — WordPress RSS, summary-only
- Endpoint: `https://wapresri.go.id/feed/` (www redirects to apex)
- 2026-07-05T11:14:39Z → HTTP 200, `application/rss+xml`, 13,490 B
- WordPress 6.9 (`<generator>`). 10 items, NO `content:encoded` — `<description>` carries a substantial lead paragraph (CDATA).
- Freshness: lastBuildDate Sat 04 Jul; pubDates Jul 3, Jul 1, Jun 29 → ~every 1–2 days.
- Sample title: "Wapres Dorong JCI Indonesia Cetak Pemimpin Muda yang Siap Bersaing di Tingkat Dunia"
- **Verdict: GOLD** (summary-only; fetch article page if full text ever needed). Perfect sibling to the setkab AGENDA ISTANA lane — same WP-feed harvest pattern, drop-in for a "layar wapres" or joint istana ledger.

### 3. TNI AD (tniad.mil.id) — custom RSS, 30-item window
- Endpoint: `https://tniad.mil.id/feed/`
- 2026-07-05T11:14:41Z → HTTP 200, `text/xml;charset=UTF-8`, 21,998 B
- Not WordPress (no wp fingerprint). 30 `<item>`, no content:encoded; `<description>` = dateline + lead ("Jakarta, tniad.mil.id – TNI Angkatan Darat menggelar Rapat Koordinasi Teknis…").
- Freshness: lastBuildDate Fri 03 Jul; pubDates Jul 3, Jul 1, Jun 30 → ~every 1–2 days.
- Sample title: "Gelar Rakornis TMMD ke-129, TNI AD Tekankan Publikasi Kreatif, Informatif, dan Inspiratif"
- **Verdict: GOLD** (summary-only). Only structured APARAT surface found anywhere. TNI AL / AU (-al.mil.id / -au.mil.id) not probed — budget spent; likely siblings, next probe wave's first two candidates.

## PARSE — keyless server-rendered HTML

### 4. BGN / Badan Gizi Nasional (bgn.go.id) — MBG program news
- `https://bgn.go.id/feed/` → 404 (11:14:39Z). Listing: `https://bgn.go.id/news/berita/` → 2026-07-05T11:18:58Z HTTP 200, text/html, 65,775 B.
- Astro site (`/_astro/page.*.js`) but the berita list is **server-rendered**: relative-slug anchors (`<a href="bgn-tata-ulang-operasional-mbg-…">`), `<h3 class="text-3xl …">` titles, Indonesian dates in markup ("22 Juni 2026"). Images on `cdn-web.bgn.go.id/news/`.
- Cadence: visible dates 22, 18, 18, 18, 12 Juni → several/week (listing was ~2 weeks stale at probe time; MBG news volume is bursty).
- Sample title: "Surat Cinta Siswi SD di Nias Utara untuk Prabowo: Bisa Menabung Berkat MBG"
- **Verdict: PARSE.** Highest program-desk value: pairs the official MBG narrative against our sismonbgn.com kitchen numbers (claim vs. count — that's a story engine). Article URL = `https://bgn.go.id/news/berita/<slug>`.

## CUR — no machine surface found (documented dead-ends)

All probed 2026-07-05 ~11:14 UTC, one `/feed/` GET each, `curl -k -A "$UA"`:

| Host | Result | Fingerprint / note |
|---|---|---|
| kemenkeu.go.id/feed/ | soft-200, text/html 27 KB = homepage | Angular-style SPA (`<base href="/">`); no rss/atom strings in markup |
| kemendagri.go.id/feed/ | 404 HTML 44 KB | custom CMS |
| kemlu.go.id/feed/ | soft-200, 1.9 KB SPA shell "Portal Kemlu" | Vite SPA, api behind fe-temp.kemlu.go.id; no feed |
| esdm.go.id/feed/ | 404 error page | untested lead: legacy `esdm.go.id/rss` paths existed pre-redesign |
| pu.go.id/feed/ | 404 | |
| kemenkes → kemkes.go.id/feed/ | kemenkes.go.id NXDOMAIN; kemkes.go.id/feed/ 404 (11:18:58Z) | correct domain is kemkes.go.id |
| kemendikdasmen.go.id/feed/ | 404 (redirects to /en/feed) | custom |
| kehutanan.go.id/feed/ | 404 | |
| kemenperin.go.id/feed/ | 404, tiny "Not Found" | untested lead: legacy `/rss.php` era endpoints |
| setneg.go.id (root) | 200 HTML 128 KB | zero rss/feed/.xml hrefs in homepage markup |
| polri.go.id/feed/ | 404 "Error Page 404" | |
| humas.polri.go.id/feed/ | 404 Next.js default page | Next.js site — a future probe could try its /_next data routes |
| tni.mil.id/feed/ | 404 **JSON** `{"message":"no Route matched with those values"}` | Kong API gateway fronting a headless site; no public route map found |
| danantaraindonesia.com/feed/ | 301→ www.danantaraindonesia.co.id/feed → 404; root 200 (11:18:58Z, 224 KB) | Next.js; strings `media-center`, `press-release` present → scrape lead at those paths, unverified |

- **BIN: not probed by design.** No public activity surface exists — the absence IS the finding; print it as such (absence-is-content law).
- Danantara stays on the CUR watch: the paper tracks its zero financial reports; a /press-release scrape probe is 1 request next wave.

## BLOCKED — procurement cluster (the sore spot)

### isb.lkpp.go.id (ISB open-data service) — auth-gated
- `https://isb.lkpp.go.id/isb-2/api/publik` → 2026-07-05T11:14:42Z HTTP 200, 34 B body: `URL-NOT-DEFINED: /isb-2/api/publik` — gateway alive, route doesn't exist.
- `https://isb.lkpp.go.id/isb-2/` → 11:18:58Z HTTP 200 = **login form** (username/password/code). Dataset URLs are token-per-account (`/isb-2/api/{token}/json/{datasetId}/…`) issued after registration.
- **Verdict: BLOCKED (keyless).** needs-from-Yose candidate: ISB account registration (LKPP has granted ISB access to non-government requesters; free, form-based). With a token this becomes the single best procurement source in Indonesia (tender/RUP/e-katalog datasets as JSON).

### inaproc.id — WAF
- Root → 2026-07-05T11:14:43Z HTTP 403, 34.6 KB block page (body literally contains "wAF"; not Cloudflare). **Verdict: BLOCKED.** JWT api already known-gated; the public search page is WAF'd against non-browser UAs too.

### sirup.lkpp.go.id — DNS dead from this host
- 2026-07-05T11:14:43Z `curl: (6) Could not resolve host` — NXDOMAIN via this resolver, single check. Could be resolver-specific; re-check once from CI (GitHub Actions) before declaring it gone.

---

## Ranked ingest plan
1. **kemhan /feed** — wire now, same harvester pattern as setkab (WP RSS, full-text, daily). 2× daily poll.
2. **wapresri /feed/** — wire now, twin of setkab lane. 2× daily poll.
3. **tniad /feed/** — wire now; only APARAT feed. Daily poll. Next wave: probe tnial.mil.id + tniau.mil.id (2 requests).
4. **bgn.go.id/news/berita/** — HTML parser (anchors + h3 + date), daily poll; joins sismonbgn numbers.
5. **ISB registration** → needs-from-Yose ledger; unlocks procurement JSON.
6. CUR desk watches the rest; re-probe sirup DNS from CI; danantara /press-release = 1-request lead.

Wiring any of 1–4 = update `sumber.astro` + `DATA_SOURCES` same wave (house law).
Raw probe bodies + results.txt in session scratchpad (ephemeral, not committed).
