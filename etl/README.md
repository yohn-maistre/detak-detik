# ETL · heavy to collect, light to serve

DuckDB transforms in GitHub Actions turn raw scrapes into Parquet + PMTiles.
The browser queries those artifacts over HTTP range requests; no database
server exists anywhere.

- `sources.ts` is the SOURCES ledger as code (statuses verified June 2026).
- Each source becomes an independent Actions job: one dead portal never
  fails the run; a dark source becomes a Data Hilang story.
- Fat artifacts (Parquet, PMTiles, the putusan corpus) go to R2 or Releases,
  never into the Pages bundle.
- Every record carries provenance columns from ingestion:
  `source_id`, `source_url`, `retrieved_at`, `content_hash`.
  Nightly builds emit signed manifests per dataset.

Build order (per docs/CLAUDE.md): regions table first, then the Hukum
extraction pipeline end to end, then breadth.
