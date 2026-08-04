import assert from 'node:assert/strict';
import test from 'node:test';
import { findHygieneViolations, scanSecretText } from './repository-safety.mjs';

test('secret scanner detects a secret-shaped fixture without echoing its value', () => {
  const value = 'sk-live-' + '1234567890abcdefghijklmnopqrstuv';
  const findings = scanSecretText('fixture.env', `OPENAI_API_KEY=${value}\n`);
  assert.deepEqual(findings, [{ file: 'fixture.env', line: 1, kind: 'openai-api-key' }, { file: 'fixture.env', line: 1, kind: 'sensitive-assignment' }]);
  assert.equal(JSON.stringify(findings).includes(value), false);
});

test('secret scanner permits narrow local and test placeholders', () => {
  const findings = scanSecretText('backend/.env.example', 'DATABASE_URL=postgresql://loning:loning_local_dev@localhost:5432/loning_local_dev\nS3_SECRET_ACCESS_KEY=\n');
  assert.deepEqual(findings, []);
});

test('repository hygiene flags tracked artifacts without deleting them', () => {
  assert.deepEqual(findHygieneViolations(['frontend/.env', 'test-results/result.json', 'backend/audit-media-temp-1.jpg', 'backend/src/app.ts']), ['frontend/.env', 'test-results/result.json', 'backend/audit-media-temp-1.jpg']);
});
