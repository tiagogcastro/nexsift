import { ImageResponse } from 'next/og'

export const alt = 'NexSift'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const background = '#090b0d'
const surface = '#101418'
const borderSoft = '#354239'
const signal = '#c7f66b'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 180,
          height: 180,
          borderRadius: 40,
          border: `3px solid ${borderSoft}`,
          background: surface,
        }}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 82,
            fontWeight: 700,
            letterSpacing: '-6px',
            color: signal,
          }}
        >
          N/
        </span>
        <span
          style={{
            position: 'absolute',
            top: 22,
            right: 22,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: signal,
          }}
        />
      </div>
    </div>,
    size,
  )
}