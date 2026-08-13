import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'NexSift'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const background = '#090b0d'
const surface = '#101418'
const border = '#263029'
const borderSoft = '#354239'
const signal = '#c7f66b'

export default async function OpenGraphImage() {
  const custom = await loadCustomImage()

  if (custom) {
    return new ImageResponse(custom as never, size)
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background,
        padding: '72px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${border} 1px, transparent 1px), linear-gradient(to bottom, ${border} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          opacity: 0.45,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 7,
            border: `1px solid ${borderSoft}`,
            background: surface,
          }}
        >
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-1px',
              color: signal,
            }}
          >
            N/
          </span>
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 5,
              height: 5,
              borderRadius: 999,
              background: signal,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          alignSelf: 'center',
          width: 18,
          height: 18,
          borderRadius: 999,
          background: signal,
          boxShadow: '0 0 60px 18px rgba(199, 246, 107, 0.35)',
        }}
      />
    </div>,
    size,
  )
}

// When the user attaches their own image as web/public/og.png, the site
// serves it instead of the generated fallback.
async function loadCustomImage() {
  try {
    const data = await readFile(join(process.cwd(), 'public', 'og.png'))
    return new Uint8Array(data)
  } catch {
    return null
  }
}
