import { describe, expect, it } from 'vitest';
import { shouldFocusMain } from './navigation-focus';

describe('navigation focus policy', () => {
  it('focuses main on initial load and pathname changes', () => {
    expect(shouldFocusMain(null, '/', '')).toBe(true);
    expect(shouldFocusMain('/', '/produk/keripik', '')).toBe(true);
  });
  it('preserves control focus on same-path query changes', () => {
    expect(shouldFocusMain('/', '/', '')).toBe(false);
  });
  it('leaves hash navigation to the hash placement contract', () => {
    expect(shouldFocusMain('/', '/produk/keripik', '#detail')).toBe(false);
  });
});
