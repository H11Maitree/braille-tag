/** Returns raised 6-dot numbers for a Unicode Braille cell. */
export function unicodeBrailleToDots(char: string): number[] {
  if (char === ' ' || char === '\u2800') return []
  const point = char.codePointAt(0) ?? 0
  if (point < 0x2800 || point > 0x28ff) return []
  const mask = point - 0x2800
  return [1, 2, 3, 4, 5, 6].filter((dot) => (mask & (1 << (dot - 1))) !== 0)
}

export function brailleCells(text: string): string[] {
  return [...text].map((char) => (char === ' ' ? '\u2800' : char))
}
