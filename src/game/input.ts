/** Canonical typing stays accessible; original spelling earns its own reward. */
export const normalizeInput = (text: string): string =>
  text
    .normalize("NFC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\p{Zs}/gu, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

// A Latin keyboard may send one base letter plus combining marks. This avoids
// depending on Intl.Segmenter, which is not present on every native device.
const characters = (text: string): string[] =>
  text.normalize("NFC").match(/\P{M}\p{M}*|\p{M}+/gu) ?? [];

export const isSingleCharacter = (text: string): boolean =>
  characters(text).length === 1;

export const inputTarget = normalizeInput;

const isSpecialLetter = (character: string): boolean =>
  /^\p{L}\p{M}*$/u.test(character) &&
  character.toLowerCase() !== normalizeInput(character);

export function originalCharacterCount(text: string): number {
  return characters(text).filter(isSpecialLetter).length;
}

export function matchCharacter(
  text: string,
  cursor: number,
  character: string,
): { length: number; original: boolean } | null {
  const normalized = normalizeInput(character);
  if (
    !normalized ||
    !/^[\p{L}\p{N}\p{P} +&]+$/u.test(normalized) ||
    !inputTarget(text).slice(cursor).startsWith(normalized)
  )
    return null;

  let position = 0;
  let original = false;
  for (const source of characters(text)) {
    const sourceLength = normalizeInput(source).length;
    if (position === cursor) {
      original =
        isSpecialLetter(source) &&
        sourceLength === normalized.length &&
        source.toLowerCase() === character.normalize("NFC").toLowerCase();
      break;
    }
    position += sourceLength;
    if (position > cursor) break;
  }
  return { length: normalized.length, original };
}
