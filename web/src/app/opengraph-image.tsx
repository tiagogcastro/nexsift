import { ImageResponse } from 'next/og'

export const alt = 'NexSift, menos ruído e mais sinal'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#090b0d',
        color: '#f4f7f2',
        padding: '72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 7,
            border: '1px solid #354239',
            background: '#101418',
          }}
        >
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-1px',
              color: '#c7f66b',
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
              background: '#c7f66b',
            }}
          />
        </div>
        <div style={{ fontSize: 28, letterSpacing: '-0.03em' }}>NEXSIFT</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: '-0.06em' }}>
          Menos ruído.
        </div>
        <div
          style={{
            fontSize: 84,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            color: '#c7f66b',
          }}
        >
          Mais sinal.
        </div>
      </div>
      <div style={{ fontSize: 24, color: '#98a29a' }}>
        IA · Cloud · Desenvolvimento · DevOps · Carreira
      </div>
    </div>,
    size,
  )
}
