import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const sizes = [32, 180, 512]
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
