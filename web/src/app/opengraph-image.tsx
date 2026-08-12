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
            width: '14px',
            height: '14px',
            borderRadius: '999px',
            background: '#c7f66b',
          }}
        />
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
