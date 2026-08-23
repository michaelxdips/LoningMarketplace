// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  applyThemePreference,
  isThemePreference,
  nextPreference,
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeStoredPreference,
} from './theme';

describe('resolveTheme', () => {
  it('preferensi eksplisit mengabaikan kondisi sistem', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('preferensi system mengikuti kondisi sistem', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('isThemePreference', () => {
  it('menerima hanya tiga nilai sah', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('DARK')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });
});

describe('readStoredPreference', () => {
  it('membaca nilai tersimpan yang sah', () => {
    const storage = { getItem: vi.fn().mockReturnValue('dark') };
    expect(readStoredPreference(storage)).toBe('dark');
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });

  it('nilai rusak diperlakukan sebagai system', () => {
    expect(readStoredPreference({ getItem: () => 'bukan-tema' })).toBe('system');
    expect(readStoredPreference({ getItem: () => null })).toBe('system');
  });

  it('storage yang melempar tidak merusak UI (Safari private mode)', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage diblokir');
      },
    };
    expect(() => readStoredPreference(storage)).not.toThrow();
    expect(readStoredPreference(storage)).toBe('system');
  });
});

describe('writeStoredPreference', () => {
  it('system menghapus entri, bukan menyimpan string "system"', () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeStoredPreference('system', storage);
    expect(storage.removeItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('light/dark disimpan eksplisit', () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeStoredPreference('dark', storage);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
  });

  it('storage yang melempar tidak merusak UI', () => {
    const storage = {
      setItem: () => {
        throw new Error('storage penuh');
      },
      removeItem: () => {
        throw new Error('storage diblokir');
      },
    };
    expect(() => writeStoredPreference('dark', storage)).not.toThrow();
    expect(() => writeStoredPreference('system', storage)).not.toThrow();
  });
});

describe('applyThemePreference — kontrak dengan tokens.css', () => {
  it('system MENGHAPUS data-theme agar media query CSS yang memutuskan (tanpa JS, tanpa FOUC)', () => {
    const el = document.createElement('div');
    el.setAttribute('data-theme', 'dark');
    applyThemePreference(el, 'system');
    // Ini inti kontraknya: selector [data-ui="v2"]:not([data-theme="light"])
    // hanya bekerja kalau atributnya benar-benar absen.
    expect(el.hasAttribute('data-theme')).toBe(false);
  });

  it('light/dark menulis atribut eksplisit agar menang atas media query', () => {
    const el = document.createElement('div');
    applyThemePreference(el, 'dark');
    expect(el.getAttribute('data-theme')).toBe('dark');
    applyThemePreference(el, 'light');
    expect(el.getAttribute('data-theme')).toBe('light');
  });
});

describe('nextPreference', () => {
  it('siklus system -> light -> dark -> system', () => {
    expect(nextPreference('system')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
  });
});
