import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  applyThemePreference,
  nextPreference,
  readStoredPreference,
  resolveTheme,
  systemPrefersDark,
  writeStoredPreference,
  type ResolvedTheme,
  type ThemePreference,
} from './theme';

/**
 * Binding React untuk theme resolver.
 * Seluruh logika keputusannya ada di theme.ts (fungsi murni, sudah diuji);
 * hook ini hanya mengurus efek samping: listener sistem + tulis atribut.
 */
export function useTheme(rootRef: RefObject<HTMLElement | null>): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  cycle: () => void;
} {
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  // Ikuti perubahan tema OS saat preferensi masih 'system'.
  useEffect(() => {
    const query = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (element) applyThemePreference(element, preference);
  }, [preference, rootRef]);

  // Tulis preferensi ke storage saat BERUBAH (bukan di dalam updater state):
  // updater `setState` wajib murni — side-effect di sana bisa dipanggil dua kali
  // oleh StrictMode dan menimbulkan perilaku tak menentu.
  useEffect(() => {
    writeStoredPreference(preference);
  }, [preference]);

  const cycle = useCallback(() => {
    setPreference((current) => nextPreference(current));
  }, []);

  return { preference, resolved: resolveTheme(preference, systemDark), cycle };
}
