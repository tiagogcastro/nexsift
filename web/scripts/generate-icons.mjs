import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const sizes = [32, 180, 192, 512]
const svgPath = resolve(import.meta.dirname, '../src/app/icon.svg')
const publicDir = resolve(import.meta.dirname, '../public')
const svg = readFileSync(svgPath)

await mkdir(publicDir, { recursive: true })

for (const size of sizes) {
  const png = await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer()

  await writeFile(resolve(publicDir, `icon-${size}.png`), png)
  console.log(`icon-${size}.png (${png.length} bytes)`)
}

const favicon = await sharp(svg, { density: 300 })
  .resize(32, 32)
  .png()
  .toBuffer()
const ico = buildIco(favicon, 32)

await writeFile(resolve(publicDir, 'favicon.ico'), ico)
console.log(`favicon.ico (${ico.length} bytes)`)

// Minimal ICO container wrapping a single PNG image.
function buildIco(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size === 256 ? 0 : size, 0)
  entry.writeUInt8(size === 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(1, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12)

  return Buffer.concat([header, entry, png])
}
