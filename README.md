# Braille Tag Maker

> Screenshot placeholder: run `npm run dev`, then capture the responsive editor and 3D preview.

A static, browser-only tool for creating printable raised-Braille name tags and optional keychain tags. Text, geometry, booleans, preview, and 3MF creation stay on the device; there is no API, backend, database, or cloud processing.

## Input and translation

The editor accepts English, Thai, punctuation, numbers, spaces, and explicit newlines. Lines are normalized with `\r\n? → \n` then translated independently, so blank lines and manual row breaks are preserved and no automatic wrapping occurs.

Translation uses Liblouis through the stable `native-liblouis` WebAssembly runtime. The app vendors official Liblouis **3.37.0** `th-g1.utb` and `th-g1.uti` table assets; `th-g1.utb` includes the bundled `en-ueb-g1.ctb`, providing one mixed Thai + English Grade-1 path. Output is Unicode Braille via `unicode.dis`.

The Liblouis runtime/table assets are LGPL-2.1-or-later; the Thai table carries its own copyright notice. Review those licenses before redistribution. The application code in this project is supplied independently of Liblouis.

## Physical model

Braille dimensions are intentionally fixed at signage values: 1.55 mm dot diameter, 0.70 mm raised height, 2.40 mm intra-cell pitch, 6.20 mm cell pitch, and 10.00 mm line pitch. The tag expands around that geometry rather than scaling tactile characters.

The plate is an extruded rounded outline. Its padding is also its corner radius. Enabling a keychain changes just the top-left corner to square, unions a disk whose centre is the original top-left corner, then subtracts a full through-hole. The hole is validated using radial clearance to raised Braille and a 1.2 mm minimum wall; its radius is not compared to plate thickness, because those are independent dimensions.

The preview uses composited Three.js meshes for responsiveness. Export builds the same numeric layout with `manifold-3d`: plate → lobe union → hole subtraction → dome unions. Raised dots use intersecting spherical caps, producing a single printable manifold solid.

## 3MF export

The in-browser writer uses `fflate` to generate a standards-shaped OPC package with `[Content_Types].xml`, `_rels/.rels`, and `3D/3dmodel.model`. It sets `unit="millimeter"` and writes one indexed mesh object. Geometry is checked for finite vertices, valid indices, and non-empty triangles before download.

## Development

Requires current Node LTS (Node 24 recommended).

```bash
npm install
npm run dev
npm test
npm run build
```

Modern WebAssembly-capable Chromium, Firefox, and Safari are supported. The production build is entirely static.

## GitHub Pages

The included workflow deploys automatically after each push to `main`. In the repository’s **Settings → Pages**, choose **GitHub Actions** as the publishing source once. The first successful workflow publishes the static `dist/` artifact; no server configuration is required.

## Slicer verification

The generated 3MF package has automated structure tests. Manual import checks in OrcaSlicer, Bambu Studio, and PrusaSlicer remain a release checklist item for the environment where the app is deployed; do not claim slicer certification until those imports have been performed.

This tool uses selected tactile dimensions but is not a substitute for professional review or a determination of legal accessibility-signage compliance.
