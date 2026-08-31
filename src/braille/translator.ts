// The stable native-liblouis wrapper supplies the browser WASM runtime. We add
// the official Liblouis 3.37 Thai Grade-1 table pair to its in-memory FS.
// @ts-ignore no declaration is shipped for the generated Emscripten factory
import LibLouisFactory from 'native-liblouis/build/liblouis-web/liblouis.js'
import thaiTable from './tables/th-g1.utb?raw'
import thaiIndicators from './tables/th-g1.uti?raw'

export interface BrailleTranslator { initialize(): Promise<void>; translate(text: string): Promise<string> }
type Louis = { FS: { open(path: string, flags: number, mode: number): unknown; write(stream: unknown, data: Uint8Array, offset: number, length: number, position: number): void; close(stream: unknown): void }; _malloc(n: number): number; _free(ptr: number): void; allocateUTF8(s: string): number; setValue(ptr: number, value: number, type: string): void; getValue(ptr: number, type: string): number; ccall(name: string, returnType: string, argTypes: string[], args: number[]): number }

export class LiblouisTranslator implements BrailleTranslator {
  private lib: Louis | null = null
  async initialize() {
    if (this.lib) return
    const lib = await LibLouisFactory() as Louis
    this.writeTable(lib, '/tables/th-g1.utb', thaiTable)
    this.writeTable(lib, '/tables/th-g1.uti', thaiIndicators)
    this.lib = lib
  }
  async translate(text: string) {
    await this.initialize(); const lib = this.lib!
    const inputLength = text.length; const maxOutput = Math.max(32, inputLength * 12)
    const inLen = lib._malloc(4), outLen = lib._malloc(4), input = lib._malloc((inputLength + 1) * 2), output = lib._malloc((maxOutput + 1) * 2), tables = lib.allocateUTF8('/tables/unicode.dis,/tables/th-g1.utb')
    try {
      lib.setValue(inLen, inputLength, 'i32'); lib.setValue(outLen, maxOutput, 'i32')
      for (let i = 0; i < inputLength; i++) lib.setValue(input + i * 2, text.charCodeAt(i), 'i16')
      lib.setValue(input + inputLength * 2, 0, 'i16')
      if (!lib.ccall('lou_translateString', 'number', Array(8).fill('number'), [tables, input, inLen, output, outLen, 0, 0, 0])) throw new Error('Liblouis could not translate this input using th-g1.utb.')
      const size = lib.getValue(outLen, 'i32'); return Array.from({ length: size }, (_, i) => String.fromCharCode(lib.getValue(output + i * 2, 'i16'))).join('')
    } finally { [tables, input, output, inLen, outLen].forEach((pointer) => lib._free(pointer)) }
  }
  private writeTable(lib: Louis, path: string, contents: string) {
    const bytes = new TextEncoder().encode(contents)
    const stream = lib.FS.open(path, 577, 438) // O_CREAT | O_TRUNC | O_WRONLY, 0666
    lib.FS.write(stream, bytes, 0, bytes.length, 0)
    lib.FS.close(stream)
  }
}
export const translator = new LiblouisTranslator()
