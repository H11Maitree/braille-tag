import { zipSync, strToU8 } from 'fflate'
import type { TriangleMesh } from '../geometry/model'

const esc = (value: number) => Number(value.toFixed(5)).toString()
export function create3mf(mesh: TriangleMesh): Uint8Array {
  const { vertices, triangles } = mesh
  if (!vertices.length || !triangles.length || vertices.length % 3 || triangles.length % 3) throw new Error('Geometry contains no valid triangles.')
  if ([...vertices].some((n) => !Number.isFinite(n))) throw new Error('Geometry contains non-finite vertices.')
  const count = vertices.length / 3
  if ([...triangles].some((i) => i >= count)) throw new Error('Geometry contains invalid triangle indices.')
  const vertexXml = Array.from({ length: count }, (_, i) => `<vertex x="${esc(vertices[i*3])}" y="${esc(vertices[i*3+1])}" z="${esc(vertices[i*3+2])}"/>`).join('')
  const triangleXml = Array.from({ length: triangles.length / 3 }, (_, i) => `<triangle v1="${triangles[i*3]}" v2="${triangles[i*3+1]}" v3="${triangles[i*3+2]}"/>`).join('')
  const model = `<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices>${vertexXml}</vertices><triangles>${triangleXml}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`
  return zipSync({ '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'), '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'), '3D/3dmodel.model': strToU8(model) })
}

export function download3mf(bytes: Uint8Array) { const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'model/3mf' })); const a = document.createElement('a'); a.href = url; a.download = 'braille-tag.3mf'; a.click(); URL.revokeObjectURL(url) }
