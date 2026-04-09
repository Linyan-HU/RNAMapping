# T-DATA-001 — Schema & Provenance Display Contract

Owner: `research_data_steward`
Date: 2026-03-06
Scope: Shared Home/Browse/Detail MVP in `/Users/macmini/coding/web_template`

## 1) Canonical entity envelope

All records rendered by shared modules MUST conform to this envelope:

```json
{
  "entity_id": "RIBO:000001",
  "entity_type": "riboswitch|aptamer|rRNA_centre",
  "display_name": "Adenine riboswitch (B. subtilis)",
  "summary": "Short synthetic summary for UI preview.",
  "organism": {
    "taxon_id": "224308",
    "scientific_name": "Bacillus subtilis"
  },
  "status": "active|deprecated|draft",
  "evidence": [],
  "provenance": {},
  "updated_at": "2026-03-06T00:00:00Z"
}
```

## 2) Required fields by page module

### Home (overview cards)
Required:
- `entity_id`
- `display_name`
- `entity_type`
- `updated_at`

### Browse (result table)
Required:
- `entity_id`
- `display_name`
- `entity_type`
- `organism.scientific_name`
- `status`
- `updated_at`

### Detail (overview/evidence/provenance)
Required:
- All browse fields
- `summary`
- `evidence[]`
- `provenance.source_dataset_id`
- `provenance.license`
- `provenance.collection_date`
- `provenance.preprocessing_steps[]`
- `provenance.version`
- `provenance.curation_owner`

## 3) Evidence object contract

Each evidence item MUST include:

```json
{
  "evidence_id": "EVID:0001",
  "method": "SHAPE-MaP",
  "score": 0.93,
  "direction": "supporting|contradicting|neutral",
  "publication": {
    "pmid": "12345678",
    "title": "Example publication"
  },
  "replicates": 3,
  "quality_flag": "pass|warn|fail"
}
```

Rules:
- `score` range: `[0,1]`
- `replicates >= 1`
- `quality_flag=fail` blocks downstream KPI aggregation until reviewed.

## 4) Provenance object contract

```json
{
  "source_dataset_id": "SRC-RIBO-2026-03",
  "source_url": "https://example.org/datasets/src-ribo-2026-03",
  "license": "CC-BY-4.0",
  "collection_date": "2026-02-20",
  "ingest_timestamp": "2026-03-01T03:15:00Z",
  "preprocessing_steps": [
    "normalize_text_fields:v2",
    "deduplicate_key:entity_id+source_dataset_id"
  ],
  "version": "v0.3.0",
  "curation_owner": "research_data_steward",
  "confidence_status": "verified|provisional|retracted"
}
```

Hard checks:
- `license` must be non-empty and approved.
- `collection_date <= ingest_timestamp`.
- `preprocessing_steps` must be non-empty for non-manual imports.
- `confidence_status=retracted` must render a high-visibility warning badge.

## 5) Data quality gates (blockers)

Block release if any are true:
1. Missing required provenance fields in >0 records on Detail page sample set.
2. Duplicate key collisions on `(entity_id, source_dataset_id)`.
3. Leakage risk: any field in `summary` or labels contains holdout-only annotations.
4. Label noise threshold exceeded (`quality_flag=fail` > 5% in sampled evidence).

## 6) Machine-readable schema artifact

A JSON Schema mirror of this contract is maintained at:

- `docs/data-stewardship/schema-provenance-contract.schema.json`

This file is the normative input for automation hooks (pre-merge checks, fixture validation, and CI linting).

## 7) Acceptance evidence for T-DATA-001

- Contract file committed in repo.
- Validation checklist committed in repo.
- JSON schema artifact committed in repo.
- `npm test` and `npm run build` output captured.
- Commit hash provided in status report.

## 8) Finalization notes (2026-03-07)

This contract is now marked **final for MVP** and is the mandatory baseline for all fixture payloads used by Home/Browse/Detail visual review.

Operational enforcement:
- Any payload that fails JSON Schema validation is a release blocker.
- Any record with missing provenance lineage is a release blocker.
- Any record with `confidence_status = retracted` must render with explicit warning treatment in all themes.

## 9) Hourly checkpoint attestation (2026-03-07 07:56 CST)

During hourly task processing, T-DATA-001 artifacts were revalidated in canonical workdir.

Attestation:
- Contract + checklist remain synchronized with schema artifact.
- No exception paths are allowed for missing provenance/license metadata.
- Completion reporting remains invalid without command outputs + commit hash evidence.
