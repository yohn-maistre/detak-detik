# JEJAK UDARA? — Tracking the Indonesian presidential fleet via public ADS-B

> Research cookbook generated **2026-07-05** (live web + curl probes, real
> User-Agent `detak-detik/1.0`, ≥2s between requests to a host). Status:
> **decided**. Read the verdict first (§5). This is a *supplementary-annotation*
> feasibility study only — the paper's location record always comes from official
> Setkab / Sekretariat Presiden publications; **citation-or-silence is house law**
> and ADS-B could never be the primary source.

**One-line verdict: NO-GO for any standing/automated "JEJAK UDARA" feature.**
Technically the jets *are* visible and *one* feed (adsb.lol, ODbL) is legally
redistributable — but the data adds nothing over Setkab's own record, is
intermittent, and systematically publishing a head of state's movements is a
security-pattern risk the paper should not author. A rare, hand-curated,
already-public, already-past corroboration is the *only* defensible use, and the
default is silence.

---

## 1. The fleet (public references)

Registrations and ICAO 24-bit Mode-S hex resolved via **adsbdb.com**
(`https://api.adsbdb.com/v0/aircraft/<reg>`, probed 2026-07-05 ~08:43Z) unless
noted. Indonesia's civil hex block is `8A0000`–`8A7FFF`; note TNI-AU VIP jets
sit inside the *civil* range, not a military block.

| Aircraft | Reg | Mode-S hex | ICAO type | Callsign(s) | Owner / operator | Source |
|---|---|---|---|---|---|---|
| Boeing 737-8U3 BBJ2 (MSN 41706) — "Indonesia One" | **A-001** | **8A0002** | B738 | "Indonesia One" / "IDAF01" / Indonesian Air Force 01 | Sekretariat Negara; TNI-AU Skadron 17 (Halim); maint. GMF AeroAsia | adsbdb ✓; [Wikipedia](https://en.wikipedia.org/wiki/Indonesian_presidential_aircraft) |
| Boeing 737-73Q(WL) BBJ (MSN 30789) — Prabowo's private jet, now primary | **PK-GRD** | **not resolved** (adsbdb: "unknown aircraft"; see [AirNav mode-s page](https://www.airnavradar.com/data/aircraft/PK-GRD)) | B737 | "Indonesia One" | Indonesia — Government (private/Prabowo) | adsbdb (miss); [Viva](https://www.viva.co.id/berita/nasional/1761203-mengulik-pesawat-kepresidenan-boeing-737-700bbj-pk-grd-yang-dipakai-prabowo-dan-gibran-ke-solo) |
| Boeing 777-3U3ER (long-haul charter) | **PK-GIG** | **8A0452** | B77W | "GIA1" / "Indonesia 1" | Garuda Indonesia (chartered for president) | adsbdb ✓; [Wikipedia](https://en.wikipedia.org/wiki/Indonesian_presidential_aircraft) |
| Boeing 777-3U3ER (2nd jet, repainted Rep. Indonesia livery Sep 2025) | **PK-GIF** | **8A0451** | B77W | "GIA1" / "Indonesia 1" | Garuda Indonesia (chartered) | adsbdb ✓ |
| Boeing 737-4U3 (ex-Garuda PK-GWL) VIP/evac | **A-7305** | **8A0024** | B734 | e.g. "Kencana Zero Four" (Kabul evac 2021) | TNI-AU Skadron 17 | adsbdb ✓; [airspace-review](https://www.airspace-review.com/2019/08/17/boeing-737-400-a-7305-skadron-udara-17-selesai-jalani-pengecatan-ulang/) |
| Boeing 737-8LD (MSN 40856), added Jul 2024, VIP/VVIP | **A-7309** | **8A0A00** | B738 | — | TNI-AU Skadron 17 | [AirNav Radar mode-s](https://www.airnavradar.com/data/mode-s/8A0A00); [airspace-review](https://www.airspace-review.com/2024/07/21/skadron-udara-17-vip-vvip-mendapat-tambahan-pesawat-boeing-737-800-bernomor-registrasi-a-7309/) |

Support rotorcraft/props (Super Puma NAS332, H225M, AW189, Pelita Air Avro RJ85
charter) exist but are out of scope for fixed-wing head-of-state tracking.
Source for fleet composition:
[Wikipedia — Indonesian presidential aircraft](https://en.wikipedia.org/wiki/Indonesian_presidential_aircraft),
[17th Air Squadron](https://en.wikipedia.org/wiki/17th_Air_Squadron_(Indonesia)).

**Key structural nuance:** PK-GIG / PK-GIF / A-7305 are *dual-use* airframes.
The two 777s are ordinary Garuda commercial aircraft (PK-GIG "biasanya layani
rute reguler Jakarta–Sydney" —
[KabarPenumpang](https://www.kabarpenumpang.com/pesawat-kepresidenan-boeing-777-300er-pk-gig-biasanya-layani-rute-reguler-jakarta-sydney/))
that only *become* presidential when chartered and flying callsign GIA1/Indonesia 1.
They are therefore visible on every tracker during normal commercial service —
you cannot separate "president aboard" from "revenue flight" by hex alone; you
need the callsign + a Setkab date. A-001 / PK-GRD / A-7309 are pure state jets.

---

## 2. Probe A — OpenSky (anonymous REST)

Endpoint: `https://opensky-network.org/api/states/all?icao24=<hex>` (lowercase hex).

Exact commands (run 2026-07-05, one host, 3s spacing):

```
curl -s -A "detak-detik/1.0 (civic newspaper research; josejr2498@gmail.com)" \
  "https://opensky-network.org/api/states/all?icao24=8a0002"   # A-001
# repeated for 8a0452 (PK-GIG), 8a0451 (PK-GIF), 8a0024 (A-7305)
```

Results — **all four returned `"states":null`** (nothing currently received):

| hex | reg | time (UTC) | result |
|---|---|---|---|
| 8a0002 | A-001 | 08:43:55Z | `{"time":1783241035,"states":null}` |
| 8a0452 | PK-GIG | 08:44:00Z | `{"time":1783241040,"states":null}` |
| 8a0451 | PK-GIF | 08:44:04Z | `{"time":1783241044,"states":null}` |
| 8a0024 | A-7305 | 08:44:08Z | `{"time":1783241048,"states":null}` |

`states:null` = no live state for that hex at that instant. It is a **snapshot**,
not evidence of filtering — at 08:44Z (15:44 WIB) none of these jets were
airborne within OpenSky's receiver coverage. OpenSky does **not** blanket-filter
military/state aircraft; per their own research, aircraft that don't want to be
tracked "switch their entire transponders off" and military planes suffer from
lack of MLAT
([OpenSky FAQ](https://opensky-network.org/about/faq);
[DASC'17 paper on state-aircraft Mode-S/ADS-B usage](https://opensky-network.org/files/publications/dasc17.pdf)).

**OpenSky licensing = disqualifying for print regardless of visibility.** The
REST API is "provided for non-profit research and educational use only"; any
for-profit/commercial use "requires written permission and a license"; "no
license is granted for any other purpose"
([Terms of Use](https://opensky-network.org/about/terms-of-use)). A published
newspaper cannot redistribute OpenSky feed data. **OpenSky → NO for this project.**

---

## 3. Probe B — adsb.lol (free, unfiltered, ODbL)

Endpoints: `https://api.adsb.lol/v2/reg/<reg>` and `/v2/hex/<hex>` (these return
**currently-tracked / live** aircraft only).

Exact commands (run 2026-07-05, one host, 2s spacing):

```
curl -s -A "detak-detik/1.0 (civic newspaper research; josejr2498@gmail.com)" \
  "https://api.adsb.lol/v2/reg/A-001"     # + hex/8a0002, reg/PK-GIG, hex/8a0452,
                                          #   reg/PK-GIF, hex/8a0451, reg/A-7305,
                                          #   hex/8a0024, reg/PK-GRD, reg/A-7309
```

Results — **all ten returned `{"ac":[],"total":0,"msg":"No error"}`** at
~08:45:00–08:45:29Z. Same reading as OpenSky: nothing airborne in-coverage at
that instant. The `/v2/reg` and `/v2/hex` routes are live-only, so an empty set
is expected whenever the jet is on the ground; it is **not** a filter hit
(adsb.lol's `msg` is literally "No error"). Historical traces live in the
[adsblol/globe_history_2025](https://github.com/adsblol/globe_history_2025)
dumps, not this route.

**adsb.lol is the one feed that could legally feed the paper.** It self-describes
as "unfiltered flight tracking, open data" and does **not** honour the FAA
LADD/PIA block list; the API and historical data are **licensed ODbL 1.0**
([adsb.lol](https://www.adsb.lol/),
[API docs](https://www.adsb.lol/docs/open-data/api/),
[historical data](https://www.adsb.lol/docs/open-data/historical/)). ODbL
permits redistribution **with attribution and share-alike** on any derived
database. That is compatible with a "receipts"-style civic paper *if* attribution
and the share-alike obligation are honoured.

(**adsbexchange** — deliberately **not probed**: its API requires a paid
RapidAPI key. Its public globe is "unfiltered ADS-B/Mode-S/MLAT" like adsb.lol,
but the *feed/API* is commercial. Skip.)

---

## 4. Visibility, in reality (the decisive evidence)

My three live snapshots caught zero aircraft — inconclusive by themselves. The
**documented public record settles it**: Indonesian presidential flights **do**
transmit ADS-B and **have repeatedly been tracked by the public and press.**

- CNN Indonesia, 2022 — a whole explainer on netizens watching **Jokowi's jet do
  a 360° turn over Europe on Flightradar24**:
  [cnnindonesia.com](https://www.cnnindonesia.com/teknologi/20220628123008-185-814450/kenali-flightradar24-app-pengungkap-pesawat-jokowi-putar-360-derajat).
- Detik, 2022 — "Pantau Penerbangan Jokowi ke Eropa Pakai Flightradar24":
  [inet.detik.com](https://inet.detik.com/mobile-apps/d-6149134/pantau-penerbangan-jokowi-ke-eropa-pakai-flightradar24).
- Viva, 2024 — **PK-GRD (Prabowo's BBJ) "can be tracked via flightradar24.com"**:
  [viva.co.id](https://www.viva.co.id/berita/nasional/1761203-mengulik-pesawat-kepresidenan-boeing-737-700bbj-pk-grd-yang-dipakai-prabowo-dan-gibran-ke-solo).

So the mechanism is clear:

- **Not filtered.** On unfiltered aggregators (adsb.lol, OpenSky, adsbexchange)
  these hexes are not blocked. Only FAA-LADD-honouring trackers would hide them,
  and adsb.lol explicitly does not.
- **But intermittent and un-guaranteed.** Visibility depends on (a) the jet
  actually transmitting ADS-B on a given leg — state aircraft can and do switch
  transponders off for sensitive movements — and (b) a ground receiver being in
  range (Indonesian archipelago / oceanic coverage is patchy). You cannot promise
  to catch any *specific* Setkab-announced trip. My 0/10 snapshots are a live
  demonstration of that unreliability.
- **Dual-use confound.** For PK-GIG/PK-GIF/A-7305 a hex hit could be an ordinary
  Garuda revenue flight, not the president. Disambiguation requires the special
  callsign *and* a Setkab date — at which point Setkab is already your source.

---

## 5. Verdict — NO-GO (with one narrowly-defensible exception)

Scoring a hypothetical "JEJAK UDARA" retrospective annotation:

| Dimension | Finding | Reading |
|---|---|---|
| **Technical visibility** | Real but intermittent; 0/10 live probes; press-documented history | PARTIAL |
| **Legal redistribution** | adsb.lol ODbL 1.0 = yes (attrib+share-alike); OpenSky = no; adsbexchange = paid | PARTIAL (one feed only) |
| **Added civic value over Setkab** | ~none — Setkab already publishes who/where/when; ADS-B adds a tail number and a timestamp | FAIL |
| **Ethics — head-of-state security** | Aggregating/publishing a leader's movement pattern is a predictability risk the paper would be *authoring* | FAIL |

**Decision: NO-GO for any continuous, automated, or database-building feature.**
The house rules make this an easy call, not a hard one: a systematic "JEJAK
UDARA" surface would (1) duplicate a fact the paper *already* sources from Setkab
(violating one-fact-one-owner and adding a second, less-authoritative owner of
the president's location), and (2) turn detak-detik into a standing aggregator of
a protected person's movements. "Absence is content" applies with unusual force
here: the *right* JEJAK UDARA panel is the one you don't build.

**The single defensible exception (PARTIAL, manual only):** a one-off, hand-made
annotation that *corroborates an already-public, already-past, Setkab-announced
trip* — e.g. if an official claim about a trip were publicly disputed and an
ADS-B trace from adsb.lol (ODbL, attributed) served as independent verification
of something Setkab itself already stated. Even then: past-tense only, never
live position, never a pattern, never automated, and only when it carries civic
weight beyond novelty. That is a rare editorial act, not a data pipeline.

---

## 6. Recommendation for Yose

Broski — the honest answer is **don't build it.** Not because you *can't*
(you technically could: A-001=`8A0002`, the 777s and A-7305/A-7309 all have
clean hexes, and adsb.lol is genuinely open under ODbL so the *license* box is
even ticked), but because it fails the two tests that actually matter for this
paper. It adds nothing over what Setkab already tells you — the president's
whereabouts is a *published* fact you already cite — so a JEJAK UDARA feed would
be a second, weaker owner of a fact you already own cleanly. And a civic-trust
newspaper systematically charting a sitting head of state's flights is authoring
a security-pattern, however "public" each individual ping is. That's exactly the
kind of thing that reads fine in a screenshot today and is an ethics headline in
six months.

If it ever comes up in an editorial meeting, the fully-worked answer is here:
**one** feed is legally usable (adsb.lol, ODbL 1.0, attribution + share-alike;
OpenSky is research-only and cannot be redistributed; adsbexchange is paid).
Visibility is real but you can't rely on catching any given flight (0/10 on my
live probes; state jets can go dark; ocean coverage is thin). So the *only* shape
that survives is a rare, manual, past-tense corroboration of a trip Setkab
already announced — and if you're leaning on Setkab for the claim anyway, the
ADS-B line is garnish, not evidence. Default to silence. If you ever do print one,
the caption must credit **"jejak ADS-B via adsb.lol (ODbL 1.0)"** and say plainly
it annotates *past* official travel — and `sumber.astro` would need an adsb.lol
row before a single trace ships.

---

## Appendix — source & license ledger

| Source | URL | Role | License / terms |
|---|---|---|---|
| adsbdb.com | `https://api.adsbdb.com/v0/aircraft/<reg>` | reg→hex/type lookup (used here) | Free API; aircraft metadata |
| adsb.lol API | `https://api.adsb.lol/v2/{reg,hex}/<x>` | live tracking (the only printable feed) | **ODbL 1.0** — attribution + share-alike ([docs](https://www.adsb.lol/docs/open-data/api/)) |
| adsb.lol history | [globe_history_2025](https://github.com/adsblol/globe_history_2025) | past traces | ODbL 1.0 |
| OpenSky REST | `https://opensky-network.org/api/states/all?icao24=<hex>` | probe only — **not usable** | Non-profit research/education only; no redistribution ([ToU](https://opensky-network.org/about/terms-of-use)) |
| adsbexchange | (not probed) | unfiltered but **paid API** | Commercial RapidAPI key required |
| Flightradar24 | `flightradar24.com/data/aircraft/<reg>` | reference only (Cloudflare-blocked to curl/WebFetch; honours FAA LADD) | Proprietary — do not scrape/redistribute |
| Wikipedia — presidential aircraft | https://en.wikipedia.org/wiki/Indonesian_presidential_aircraft | fleet composition | CC BY-SA |
| Wikipedia — 17th Air Squadron | https://en.wikipedia.org/wiki/17th_Air_Squadron_(Indonesia) | operator | CC BY-SA |
| CNN Indonesia / Detik / Viva | (linked in §4) | proof of public trackability | news, cite-only |
