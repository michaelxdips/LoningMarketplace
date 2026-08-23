/**
 * Theme resolver V2 — logika murni, tanpa React.
 *
 * Kontrak dengan tokens.css (jangan diubah sepihak):
 *   - preferensi "system" => atribut data-theme DIHAPUS, sehingga
 *     `@media (prefers-color-scheme: dark) [data-ui="v2"]:not([data-theme="light"])`
 *     yang bekerja. Konsekuensi penting: mode sistem berfungsi TANPA JavaScript,
 *     jadi tidak ada kedip tema (FOUC) saat first paint.
 *   - preferensi "light"/"dark" => data-theme di-set eksplisit dan menang atas
 *     media query.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** Key localStorage. Mengikuti pola penamaan `loning_*` yang sudah dipakai. */
export const THEME_STORAGE_KEY = 'loning_v2_theme';

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/**
 * Tema efektif dari preferensi + kondisi sistem.
 * Dipisah sebagai fungsi murni supaya bisa diuji tanpa DOM.
 */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemPrefersDark ? 'dark' : 'light';
}

/** Preferensi tersimpan; nilai rusak/asing diperlakukan sebagai 'system'. */
export function readStoredPreference(storage?: Pick<Storage, 'getItem'>): ThemePreference {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  } catch {
    // Safari private mode / storage diblokir: jangan sampai melempar.
    return 'system';
  }
}

export function writeStoredPreference(
  preference: ThemePreference,
  storage?: Pick<Storage, 'setItem' | 'removeItem'>,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return;
    if (preference === 'system') store.removeItem(THEME_STORAGE_KEY);
    else store.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* abaikan: preferensi tema tidak layak membuat UI gagal */
  }
}

/**
 * Terapkan preferensi ke elemen root V2.
 * 'system' menghapus atribut agar CSS media query yang memutuskan.
 */
export function applyThemePreference(element: HTMLElement, preference: ThemePreference): void {
  if (preference === 'system') element.removeAttribute('data-theme');
  else element.setAttribute('data-theme', preference);
}

/** Urutan siklus tombol toggle: system -> light -> dark -> system. */
export function nextPreference(current: ThemePreference): ThemePreference {
  const index = PREFERENCES.indexOf(current);
  return PREFERENCES[(index + 1) % PREFERENCES.length];
}

export function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}
