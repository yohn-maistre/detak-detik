# Public data sources — verified June 2026

Field-checked availability for candidate daily metrics. Verdicts: TRIVIAL
(free JSON, no/instant key) · EASY (free key or stable structure) · SCRAPE
(public HTML, doable) · HARD (manual/PDF assembly) · DEAD (gone).

**Cross-cutting gotcha:** many .go.id sites block datacenter IPs — run the
fetches from the Cloudflare Worker cron (edge IPs fare better) and treat
every dark source as a Data Hilang note, never a crash. Stable exceptions:
BMKG, data.go.id CKAN, DJPK.

## TRIVIAL — wire these first

| Metric | Endpoint | Auth | Cadence |
|---|---|---|---|
| Gempa (BMKG) | `data.bmkg.go.id/DataMKG/TEWS/autogempa.json` (+ `gempaterkini.json`) | none, sebut sumber | real-time |
| BTC/ETH dalam Rp | `api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr` | none | ~1 min |
| Kurs USD/IDR | `open.er-api.com/v6/latest/USD` · `api.frankfurter.app/latest?from=USD&to=IDR` · resmi: JISDOR SOAP `bi.go.id/biwebservice/wskursbi.asmx` | none | harian |
| Kualitas udara | `api.waqi.info/feed/jakarta/?token=…` (token gratis, email saja) | free token | per jam |
| IHSG | `query1.finance.yahoo.com/v8/finance/chart/%5EJKSE` (IDX sendiri di balik Cloudflare) | none | harian |

## EASY

| Metric | Endpoint | Notes |
|---|---|---|
| Inflasi/CPI + UMP | `webapi.bps.go.id/v1/api/…` | free key; bot-protection dari IP datacenter dilaporkan |
| Panel harga pangan | `api-panelhargav2.badanpangan.go.id/api/front/…` | unofficial frontend API — **sinyal harian terbaik**, bisa berubah |
| Deforestasi | `data-api.globalforestwatch.org` (GLAD/integrated, per wilayah admin) | free key |
| Emas Antam | scrape `logammulia.com/id/harga-emas-hari-ini` (09.30 WIB, Sen–Sab) | wrapper komunitas ada |
| Katalog + bencana | CKAN `data.go.id/api/3/action/package_search` · **BNPB `dibi.bnpb.go.id`** (GeoJSON stabil) | none |

## SCRAPE

- **BBM**: `mypertamina.id/fuels-harga` — tabel per provinsi, ganti ~tanggal 1.
- **Tarif PLN**: `web.pln.co.id/...tariff-adjustment` — kuartalan.
- **Agenda presiden**: `setkab.go.id/category/berita/` (WordPress → RSS +
  `wp-json/wp/v2/posts`) — tidak ada feed agenda terstruktur; ekstraksi
  lokasi/perjalanan dari berita harian (NLP, fuzzy tapi feasible).
- **Putusan MA**: `putusan3.mahkamahagung.go.id` — korpus raksasa, ribuan
  putusan/hari, tapi server kronis lambat; paginasi pelan-pelan.
- **Dana Desa**: `djpk.kemenkeu.go.id/portal/data/tkdd` + dashboard SIKD —
  alokasi per desa (tahunan), file Excel/PDF.
- **Jumlah kementerian lintas rezim**: Wikipedia API + setkab — teknisnya
  trivial, tapi dataset statis sekali-jadi (pas untuk grafik sejarah).
- **Gaji DPR**: PP 75/2000, Keppres 59/2003, S-520/MK.02/2015 (PDF di
  peraturan.bpk.go.id) — riset sekali, jadi explainer abadi.

## HARD / DEAD

- **RUU per tahun + lama draf→sah**: dpr.go.id tanpa API; Prolegnas = PDF
  BPHN. HARD sebagai otomasi, EASY sebagai grafik historis rakitan tangan
  (DPR 2019–2024 mengesahkan 225 UU — Kompas).
- **APBN**: `data.anggaran.kemenkeu.go.id` & `data.treasury.kemenkeu.go.id`
  **DNS mati**; APBN KiTa = PDF bulanan. Mining PDF saja.
- **Anggaran operasional presiden**: hanya lampiran DIPA/RKA-KL tahunan (PDF).

## Delapan feed harian terbaik (urutan pemasangan)

1. BMKG gempa · 2. USD/IDR · 3. CoinGecko · 4. WAQI udara ·
5. Panel Harga Pangan · 6. IHSG ^JKSE · 7. Emas Antam · 8. BNPB bencana

Pengisi irama lambat: BBM (bulanan), tarif PLN (kuartalan), CPI BPS
(bulanan), berita Setkab (harian, butuh ekstraksi).
