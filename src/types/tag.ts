export interface TagState {
  textContent: string
  plateThickness: number
  platePadding: number
  keychain: { enabled: boolean; innerRadius: number; outerRadius: number }
}

export type Vec2 = { x: number; y: number }
export type BrailleDot = Vec2 & { dot: number }
export interface BrailleLine { source: string; text: string; cells: string[] }
export interface TagLayout {
  plateWidth: number
  plateHeight: number
  translatedLines: BrailleLine[]
  dots: BrailleDot[]
  keychainCenter?: Vec2
}
