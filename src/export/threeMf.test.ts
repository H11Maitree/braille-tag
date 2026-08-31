import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { create3mf } from './threeMf'
describe('3MF writer', () => it('writes required OPC parts and millimetres', () => {
  const zip = unzipSync(create3mf({ vertices: new Float32Array([0,0,0, 1,0,0, 0,1,0]), triangles: new Uint32Array([0,1,2]) }))
  expect(Object.keys(zip)).toEqual(expect.arrayContaining(['[Content_Types].xml', '_rels/.rels', '3D/3dmodel.model']))
  expect(strFromU8(zip['3D/3dmodel.model'])).toContain('unit="millimeter"')
}))
