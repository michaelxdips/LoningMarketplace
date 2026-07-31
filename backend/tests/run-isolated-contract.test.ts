import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(resolve(import.meta.dirname, '../../scripts/run-isolated.mjs'), 'utf8');

describe('isolated harness mode dispatch', () => {
  it('runs the authenticated integration smoke in integration and full modes', () => {
    expect(script).toContain("if (mode === 'integration' || mode === 'full') await integration();");
  });
});
