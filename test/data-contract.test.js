import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaPath = resolve(process.cwd(), 'docs/data-stewardship/schema-provenance-contract.schema.json');
const checklistPath = resolve(process.cwd(), 'docs/data-stewardship/validation-checklist.md');

test('schema-provenance contract includes mandatory top-level envelope requirements', () => {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

  assert.equal(schema.type, 'object');
  assert.ok(Array.isArray(schema.required));

  const mustHave = [
    'entity_id',
    'entity_type',
    'display_name',
    'summary',
    'organism',
    'status',
    'evidence',
    'provenance',
    'updated_at'
  ];

  for (const key of mustHave) {
    assert.ok(schema.required.includes(key), `missing required field: ${key}`);
  }
});

test('schema enforces stewardship constraints for provenance and evidence', () => {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const evidence = schema.properties?.evidence?.items;
  const provenance = schema.properties?.provenance;

  assert.deepEqual(evidence.properties?.quality_flag?.enum, ['pass', 'warn', 'fail']);
  assert.equal(evidence.properties?.score?.minimum, 0);
  assert.equal(evidence.properties?.score?.maximum, 1);
  assert.equal(evidence.properties?.replicates?.minimum, 1);

  assert.deepEqual(provenance.properties?.license?.enum, ['CC-BY-4.0', 'CC0-1.0', 'MIT', 'ODC-By']);
  assert.deepEqual(provenance.properties?.confidence_status?.enum, ['verified', 'provisional', 'retracted']);
  assert.equal(provenance.properties?.curation_owner?.const, 'research_data_steward');
});

test('validation checklist retains blocker-oriented controls', () => {
  const checklist = readFileSync(checklistPath, 'utf8');

  assert.match(checklist, /Leakage scan: no holdout-only labels\/features shown\./);
  assert.match(checklist, /Label-noise scan: `quality_flag=fail` <= 5% in sampled batch\./);
  assert.match(checklist, /Decision: `pass` \/ `block`/);
});
