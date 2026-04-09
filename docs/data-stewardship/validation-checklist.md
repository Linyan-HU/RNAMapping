# T-DATA-001 — Validation Checklist

Owner: `research_data_steward`
Applies to: Home/Browse/Detail MVP data payloads

## A. Lineage & Licensing
- [ ] Every displayed record has `provenance.source_dataset_id`.
- [ ] Every displayed record has `provenance.source_url`.
- [ ] License exists and is in approved list (`CC-BY-4.0`, `CC0-1.0`, `MIT`, `ODC-By`).
- [ ] `collection_date` present and parseable.
- [ ] `ingest_timestamp` present and parseable.

## B. Schema Completeness
- [ ] Home-required fields present for all Home cards.
- [ ] Browse-required fields present for all Browse rows.
- [ ] Detail-required fields present for all Detail sections.
- [ ] `evidence` is array for all Detail payloads.
- [ ] `provenance.preprocessing_steps` is non-empty array when import is automated.

## C. Integrity Checks
- [ ] No duplicate keys on `(entity_id, source_dataset_id)`.
- [ ] `updated_at` is ISO-8601 and not in the future.
- [ ] `collection_date <= ingest_timestamp`.
- [ ] Evidence `score` within `[0,1]`.
- [ ] Evidence `replicates >= 1`.

## D. Risk Controls
- [ ] Leakage scan: no holdout-only labels/features shown.
- [ ] Label-noise scan: `quality_flag=fail` <= 5% in sampled batch.
- [ ] Distribution drift check logged for entity type and organism fields.
- [ ] Retracted confidence records visibly marked.

## E. Sign-off
- [ ] Engineer + Data Steward reviewed sample payload set.
- [ ] Reviewer acknowledged no critical data integrity blockers.
- [ ] Checklist archived with date + commit hash in task report.

## F. Evidence Capture Template

Fill this block in task reports:

- Validation date:
- Sample size:
- Failing records count:
- Leakage findings:
- Drift findings:
- Decision: `pass` / `block`
- Related commit hash:

## G. MVP Sign-off rule (T-DATA-001)

Mark T-DATA-001 complete only when all are true:
- Sections A-D all pass with no unresolved criticals.
- Evidence block is filled and attached to task report.
- Report includes required hard evidence (`pwd`, changed files, command outputs, commit hash).

## H. Hourly audit trail entry (2026-03-07 07:56 CST)

- [x] Canonical workdir confirmed before edits.
- [x] Contract/checklist pair re-reviewed for lineage + license blocker rules.
- [x] Ready for completion only with validated command output evidence and commit hash.
