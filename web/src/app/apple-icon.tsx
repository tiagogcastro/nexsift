import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#171c20',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 26,
          border: '3px solid #4d5a52',
          background: '#212830',
        }}
      >
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: '-6px',
            color: '#c7f66b',
          }}
        >
          N/
        </span>
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: '#c7f66b',
          }}
        />
      </div>
    </div>,
    size,
  )
}
