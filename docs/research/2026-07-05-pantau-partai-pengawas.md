# Pantau PARTAI (suara partai own-voice) + PENGAWAS — endpoint cookbook

Probed 2026-07-05 (~11:48–11:51 UTC, timestamps per row) from the deploy
datacenter. UA: `detak-detik/1.0 (koran sipil; josejr2498@gmail.com)`,
≥2s spacing per host, **25 requests total** (budget fully spent),
`curl -k -m 15` used throughout (defensive; no 200 below depended on
skipping TLS verification).

Tiers: **GOLD** = keyless + structured + fresh, wire it. **PARSE** = open
HTML worth a scraper. **CUR** = works but sparse/unproven, curate or
revisit. **BLOCKED** = documented dead end.

Headline: of the 8 DPR parties, only **2 have a live machine-readable
voice** (Gerindra, PKS — both same-week full-text RSS). Golkar's domain is
hosting-suspended; Demokrat and PSI hide behind bot walls; the rest 404.
On the watchdog side **KontraS is GOLD** and **ICW works via the Drupal
side door** `/rss.xml` (the advertised `/feed/` 500s). No oversight or
electoral body (Ombudsman, Komnas HAM, PPATK, KPU, Bawaslu) exposes a feed.

---

## GOLD

### 1. gerindra.id — party news RSS, full text — **GOLD**

The freshest party voice in Indonesia, full stop — newest item published
**32 minutes before the probe**.

- Endpoint: `https://gerindra.id/feed/`
- Probe: `curl -ksL -m 15 -A "$UA" https://gerindra.id/feed/` →
  **HTTP 200**, 54,564 B, `application/rss+xml` @ 2026-07-05T11:48:15Z
- Format: WordPress RSS 2.0, 10 items, `<content:encoded>` present
  (20 tags = **full text**), pubDate, categories.
- Freshness: top pubDate `Sun, 05 Jul 2026 11:16:35 +0000` — **same hour
  as probe**; three items inside 15 minutes. Intraday cadence.
- Sample title: "Danang Wicaksana Dorong Sinergi Pusat–Daerah Percepat
  Infrastruktur Jawa Barat".
- Civic value: kader-in-DPR claims in the party's own words — perfect
  for the suara-partai lane (label as own-voice, not neutral reporting).

### 2. pks.id — party news RSS, full text — **GOLD**

`/feed/` 404s (custom CMS, not WP) but **`/rss` pays out**.

- Endpoint: `https://pks.id/rss/` (probe of `/rss` 301s to trailing slash)
- Probe: `curl -ksL -m 15 -A "$UA" https://pks.id/rss` →
  **HTTP 200**, 51,328 B, `application/rss+xml` @ 2026-07-05T11:50:43Z
- Format: RSS 2.0, 10 items, `<description>` (lede) AND
  `<content:encoded>` (**full text**). Note pubDate is WIB (+0700).
- Freshness: top pubDate `Fri, 03 Jul 2026 12:52:00 +0700` — **2 days**.
  Several items same-day clusters; weekday cadence.
- Sample title: "Bahas RUU SDI, Legislator PKS Usulkan Konsep Layanan
  Proaktif 'Sekali Lapor'".
- Dead sibling for the record: `https://pks.id/feed/` → 404 branded page
  @ 2026-07-05T11:48:20Z.

### 3. kontras.org — human-rights watchdog RSS, full text — **GOLD**

- Endpoint: `https://kontras.org/feed/`
- Probe: `curl -ksL -m 15 -A "$UA" https://kontras.org/feed/` →
  **HTTP 200**, 53,137 B, `application/rss+xml` @ 2026-07-05T11:49:37Z
- Format: WordPress RSS 2.0, 10 items, `<content:encoded>` present
  (**full text**).
- Freshness: top pubDate `Thu, 02 Jul 2026 04:23:32 +0000` — **3 days**.
  Cadence ~2–4 statements/week (advocacy rhythm, not daily news).
- Sample title: "Catatan Kritis Revisi Undang-Undang No.39 Tahun 1999
  tentang Hak Asasi Manusia Tahun 2026".
- Civic value: high — police/impunity accountability statements that
  directly counter-weight the aparat lane.

### 4. antikorupsi.org (ICW) — Drupal RSS side door — **GOLD (summary-only)**

The advertised WordPress-style path 500s; the Drupal-native path works.

- Endpoint: `https://antikorupsi.org/rss.xml`
- Probe: `curl -ksL -m 15 -A "$UA" https://antikorupsi.org/rss.xml` →
  **HTTP 200**, 11,110 B, `application/rss+xml` @ 2026-07-05T11:50:43Z
- Dead sibling: `https://antikorupsi.org/feed/` → **HTTP 500** (74 B)
  @ 2026-07-05T11:49:35Z — always use `/rss.xml`.
- Format: RSS 2.0, 10 items, title + link + pubDate; `<description>`
  present but effectively empty, **no `content:encoded`** — headline
  feed only, fetch the article page for body text.
- Freshness: top pubDate `Mon, 22 Jun 2026 10:41:33 +0000` — **13 days**,
  just inside the 2-week window. Bursty cadence (3 items same day).
- Sample title: "Perkuat Pengawasan Pengadaan Publik, ICW Bersama
  Kelompok Orang Muda Laporkan Temuan Pemantauan PBJP kepada Inspektorat
  DKI Jakarta".

---

## PARSE / CUR

### 5. pshk.or.id — legislative-process watchdog RSS — **CUR (gold structure, slow pulse)**

- Endpoint: `https://pshk.or.id/feed/`
- Probe: `curl -ksL -m 15 -A "$UA" https://pshk.or.id/feed/` →
  **HTTP 200**, 51,018 B, `application/rss+xml` @ 2026-07-05T11:49:39Z
- Format: WordPress RSS 2.0, full text (`content:encoded` ×18).
- Freshness: top pubDate `Wed, 17 Jun 2026 09:23:04 +0000` — **18 days**,
  outside the 2-week bar; publication rhythm looks ~2–3 items/month.
- Sample title: "Satu Dekade UU Penyandang Disabilitas dan Arah Reformasi
  Inklusif".
- Verdict: wire it cheap (it costs nothing to poll weekly) but do not
  promise freshness from it; treat as long-form legislative analysis lane.

### 6. pkb.id — WP present, feed broken — **CUR**

- `curl -ksL -m 15 -A "$UA" https://pkb.id/feed/` → **HTTP 200** but
  `text/html` (25,309 B, themed WordPress page with empty `<title>`)
  @ 2026-07-05T11:48:19Z — the feed route renders HTML, not XML.
- `curl -ksL -m 15 -A "$UA" 'https://pkb.id/wp-json/wp/v2/posts?per_page=2'`
  → **HTTP 404** (217 B Apache default) @ 2026-07-05T11:50:41Z — REST
  API disabled too.
- Verdict: only an HTML scraper of their news listing would work; revisit
  if the suara-partai lane needs PKB specifically.

### 7. partaiperindo.com — Nuxt SPA, no RSS — **CUR**

- `curl -ksL -m 15 -A "$UA" https://partaiperindo.com/feed/` →
  **HTTP 404** (47,835 B Nuxt-rendered "Halaman tidak ditemukan")
  @ 2026-07-05T11:50:56Z.
- Nuxt frontend implies an internal JSON API exists but it was not probed
  (budget). Revisit only if outside-parliament voices become a lane.

---

## BLOCKED / DEAD (documented findings — a dead party blog is a datum)

| Domain | Probe (all `curl -ksL -m 15 -A "$UA" https://<domain>/feed/`) | Result | Verdict |
|---|---|---|---|
| pdiperjuangan.id | @ 2026-07-05T11:48:12Z; also `/wp-json/wp/v2/posts` @ 11:50:42Z | both **404** (identical 7,522 B custom page) | **BLOCKED** — largest DPR party, no machine-readable voice found |
| partaigolkar.com | @ 2026-07-05T11:48:13Z | 200 → redirect to `/cgi-sys/suspendedpage.cgi` — **hosting account suspended** | **DEAD** — Golkar's main domain is offline; strong civic datum in itself |
| nasdem.id | @ 2026-07-05T11:48:17Z | **404** (355 B Apache default) | **BLOCKED** — no feed route |
| pan.or.id | @ 2026-07-05T11:48:20Z; `/wp-json` retry @ 11:50:44Z | **404** "This Page Does Not Exist"; retry connection failed (exit 000; DNS resolves, host flaky) | **BLOCKED** |
| demokrat.or.id | @ 2026-07-05T11:48:22Z | **403** "Bot Verification" page | **BLOCKED** — bot wall |
| psi.id | @ 2026-07-05T11:50:56Z | **403** Cloudflare "Just a moment…" | **BLOCKED** — CF challenge |
| ppp.or.id | @ 2026-07-05T11:50:57Z | connection failed (exit 000; DNS resolves to 153.92.9.43) | **DEAD/unreachable** at probe time |
| formappi.org | @ 2026-07-05T11:49:40Z | **NXDOMAIN** — no DNS resolution at all | **DEAD** — the parliament watchdog's domain no longer resolves |
| komnasham.go.id | @ 2026-07-05T11:49:41Z | **403** Cloudflare "Just a moment…" | **BLOCKED** |
| ombudsman.go.id | @ 2026-07-05T11:49:40Z | **404** (1,175 B) | **BLOCKED** — no feed route found |
| ppatk.go.id | @ 2026-07-05T11:49:41Z (301s to www) | **404** "Laman Tidak Ditemukan" | **BLOCKED** |
| kpu.go.id | @ 2026-07-05T11:49:42Z (301s to www, strips slash) | **404** (1,552 B) | **BLOCKED** |
| bawaslu.go.id | @ 2026-07-05T11:49:43Z | **404** branded page | **BLOCKED** |

---

## Recommended polling plan

1. **Wire now (suara-partai lane):** `gerindra.id/feed/` +
   `pks.id/rss/` — hourly poll is defensible (both intraday-capable,
   WP/CMS feeds are cheap). Label lane as **own-voice/partisan** in UI.
2. **Wire now (pengawas lane):** `kontras.org/feed/` +
   `antikorupsi.org/rss.xml` — every 6 h is plenty. ICW is
   headline-only: link out or fetch article HTML per item.
3. **Weekly poll:** `pshk.or.id/feed/` (long-form legislative analysis).
4. **Balance warning:** with only Gerindra + PKS machine-readable, an
   automated suara-partai board over-represents 2 of 8 DPR parties.
   Print the absence rows ("PDIP: no feed — probed 2026-07-05") per the
   absence-is-content doctrine, or hold the lane until curated parity.
5. **License note:** party pressers and NGO statements are publicity
   material; quote with attribution + link, don't re-host full text.
   All feeds keyless; no CORS tested (server-side harvest assumed).
