import { describe, expect, it } from 'vitest'
import { BRAILLE } from './constants'
import { linesFromTranslation, makeLayout } from './layout'
import { unicodeBrailleToDots } from './unicodeBraille'

describe('Braille layout', () => {
  it('preserves explicit and blank lines', () => {
    expect(linesFromTranslation('A\nB', ['⠁', '⠃'])).toHaveLength(2)
    expect(linesFromTranslation('A\n\nB', ['⠁', '', '⠃'])).toHaveLength(3)
  })
  it('uses every blank cell', () => expect(linesFromTranslation('A  B', ['⠁\u2800\u2800⠃'])[0].cells).toHaveLength(4))
  it('grows one line pitch for each additional manual line', () => {
    const one = makeLayout(linesFromTranslation('A', ['⠁']), 4)
    const two = makeLayout(linesFromTranslation('A\nB', ['⠁', '⠃']), 4)
    expect(two.plateHeight - one.plateHeight).toBeCloseTo(BRAILLE.linePitch, 8)
  })
  it('grows width with the longest translated row', () => {
    expect(makeLayout(linesFromTranslation('a', ['⠁']), 4).plateWidth).toBeLessThan(makeLayout(linesFromTranslation('ab', ['⠁⠃']), 4).plateWidth)
  })
  it('keeps standard 1-4 / 2-5 / 3-6 positions', () => {
    const dots = makeLayout(linesFromTranslation('x', ['⠿']), 4).dots
    expect(dots.find(d => d.dot === 1)?.x).toBeLessThan(dots.find(d => d.dot === 4)?.x ?? 0)
    expect(dots.find(d => d.dot === 1)?.y).toBeGreaterThan(dots.find(d => d.dot === 2)?.y ?? 0)
  })
})
describe('Unicode braille decoding', () => it('maps U+283F to all six dots', () => expect(unicodeBrailleToDots('⠿')).toEqual([1,2,3,4,5,6])))
