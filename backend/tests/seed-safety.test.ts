import { describe, expect, it } from 'vitest';
import { assertSafeSeedTarget, formatDatabaseTarget, resolveSeedProfile } from '../src/db/target-safety.js';

const development = {
  NODE_ENV: 'development', APP_ENV: 'development', DATABASE_ENVIRONMENT: 'development', ALLOW_SEED: '1',
  DATABASE_URL: 'postgresql://local:password@127.0.0.1:5432/loning_wave1_dev',
};
const disposableTest = {
  NODE_ENV: 'test', APP_ENV: 'test', DATABASE_ENVIRONMENT: 'test', ALLOW_SEED: '1', ALLOW_DISPOSABLE_DB_MUTATION: '1',
  DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-test-wave1',
  DATABASE_URL: 'postgresql://loning_test:disposable@127.0.0.1:55432/loning_wave1_test',
};

describe('seed target safety', () => {
  it('requires an explicit and matching profile', () => {
    expect(() => resolveSeedProfile([], development)).toThrow('SEED_PROFILE_REFUSED');
    expect(resolveSeedProfile(['--profile', 'development'], { ...development, SEED_PROFILE: undefined })).toBe('development');
    expect(resolveSeedProfile(['--profile', 'test'], { ...disposableTest, SEED_PROFILE: 'test' })).toBe('test');
    expect(() => resolveSeedProfile(['--profile', 'test'], { ...development, SEED_PROFILE: 'development' })).toThrow('SEED_PROFILE_REFUSED');
  });

  it.each([
    ['production NODE_ENV', 'development', { ...development, NODE_ENV: 'production' }],
    ['production APP_ENV', 'development', { ...development, APP_ENV: 'production' }],
    ['production database marker', 'development', { ...development, DATABASE_URL: 'postgresql://user:password@db.example.test:5432/loning_prod' }],
    ['missing profile marker', 'development', { ...development, DATABASE_ENVIRONMENT: undefined }],
    ['test target named production', 'test', { ...disposableTest, DATABASE_URL: 'postgresql://loning_test:password@127.0.0.1:55432/loning_production_test' }],
    ['test target with remote host', 'test', { ...disposableTest, DATABASE_URL: 'postgresql://loning_test:password@db.example.test:55432/loning_wave1_test' }],
  ] as const)('rejects %s without exposing the connection password', (_name, profile, env) => {
    try { assertSafeSeedTarget(profile, env); throw new Error('expected refusal'); }
    catch (error) { expect(String(error)).toContain('REFUSED'); expect(String(error)).not.toContain('password'); }
  });

  it('accepts explicit loopback development and disposable test targets', () => {
    expect(assertSafeSeedTarget('development', development)).toMatchObject({ database: 'loning_wave1_dev' });
    expect(assertSafeSeedTarget('test', disposableTest)).toMatchObject({ database: 'loning_wave1_test' });
  });

  it('requires both disposable test markers and prints only a redacted target fingerprint', () => {
    expect(() => assertSafeSeedTarget('test', { ...disposableTest, ALLOW_DISPOSABLE_DB_MUTATION: undefined })).toThrow('SEED_TARGET_REFUSED');
    expect(() => assertSafeSeedTarget('test', { ...disposableTest, DISPOSABLE_COMPOSE_PROJECT: undefined })).toThrow('SEED_TARGET_REFUSED');
    expect(() => assertSafeSeedTarget('test', { ...disposableTest, DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-local' })).toThrow('SEED_TARGET_REFUSED');
    const target = formatDatabaseTarget(assertSafeSeedTarget('test', disposableTest));
    expect(target).not.toContain('disposable');
    expect(target).not.toContain('postgresql://');
    expect(target).toContain('target:');
  });

  it('keeps preview seeding disabled', () => {
    expect(() => resolveSeedProfile(['--profile', 'preview'], { ...disposableTest, SEED_PROFILE: 'preview' })).toThrow('SEED_PROFILE_DISABLED');
  });
});
