const ALLOWED_PHONE_CHARACTERS = /^[+\d\s().-]+$/;
const NORMALIZED_INDONESIAN_PHONE = /^628\d{7,12}$/;

/**
 * Normalizes Indonesian mobile numbers to E.164 digits without `+`.
 * The 10–15 digit limit follows E.164's maximum while requiring Indonesia's 628 mobile prefix.
 */
export function normalizeIndonesianWhatsAppNumber(value: string): string | undefined {
  const input = value.trim();
  if (!input || !ALLOWED_PHONE_CHARACTERS.test(input)) return;
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('08')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  if (!NORMALIZED_INDONESIAN_PHONE.test(digits) || digits.length < 10 || digits.length > 15) return;
  return digits;
}

export const isValidIndonesianWhatsAppNumber = (value: string) => normalizeIndonesianWhatsAppNumber(value) !== undefined;