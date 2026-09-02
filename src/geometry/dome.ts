import { BRAILLE } from '../braille/constants'

export const DOME_CIRCULAR_SEGMENTS = 16

/** Radius of the sphere whose intersection with the plate top is the dot footprint. */
export const DOME_RADIUS = (BRAILLE.dotRadius ** 2 + BRAILLE.dotHeight ** 2) / (2 * BRAILLE.dotHeight)

export function domeCenterZ(plateThickness: number): number {
  return plateThickness + BRAILLE.dotHeight - DOME_RADIUS
}

/** Polar angle needed to keep the dome on or above the plate underside. */
export function domeThetaLength(plateThickness: number): number {
  const lowerHemisphereLimit = -domeCenterZ(plateThickness) / DOME_RADIUS
  return Math.acos(Math.max(-1, Math.min(1, lowerHemisphereLimit)))
}
