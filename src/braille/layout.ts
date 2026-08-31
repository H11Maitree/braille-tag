import { BRAILLE } from './constants'
import { brailleCells, unicodeBrailleToDots } from './unicodeBraille'
import type { BrailleLine, TagLayout } from '../types/tag'

export const brailleLineWidth = (cells: number) => cells === 0 ? 0 : BRAILLE.dotDiameter + BRAILLE.intraCellPitch + (cells - 1) * BRAILLE.cellPitch
export const brailleContentHeight = (lines: number) => lines === 0 ? 0 : BRAILLE.dotDiameter + 2 * BRAILLE.intraCellPitch + (lines - 1) * BRAILLE.linePitch

export function makeLayout(lines: BrailleLine[], padding: number, keychain = false): TagLayout {
  const contentWidth = Math.max(0, ...lines.map((line) => brailleLineWidth(line.cells.length)))
  // An empty inscription retains a small square printable plate; normal text follows the formulas exactly.
  const plateWidth = Math.max(padding * 2, contentWidth + padding * 2)
  const plateHeight = Math.max(padding * 2, brailleContentHeight(lines.length) + padding * 2)
  const dots = lines.flatMap((line, lineIndex) => line.cells.flatMap((cell, cellIndex) =>
    unicodeBrailleToDots(cell).map((dot) => {
      const column = dot >= 4 ? 1 : 0
      const row = (dot - 1) % 3
      return {
        dot,
        x: padding + BRAILLE.dotRadius + cellIndex * BRAILLE.cellPitch + column * BRAILLE.intraCellPitch,
        y: plateHeight - padding - BRAILLE.dotRadius - lineIndex * BRAILLE.linePitch - row * BRAILLE.intraCellPitch,
      }
    })))
  return { plateWidth, plateHeight, translatedLines: lines, dots, keychainCenter: keychain ? { x: 0, y: plateHeight } : undefined }
}

export function linesFromTranslation(source: string, translated: string[]): BrailleLine[] {
  const sources = source.replace(/\r\n?/g, '\n').split('\n')
  return sources.map((line, index) => ({ source: line, text: translated[index] ?? '', cells: brailleCells(translated[index] ?? '') }))
}
