import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/content'

export const alt = 'NexSift, sinais verificados para desenvolvedores'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const topicColors: Record<string, string> = {
  ai: '#c9a7ff',
  development: '#ff9c73',
  cloud: '#6de7e7',
  devops: '#c7f66b',
  security: '#ff8a7a',
  industry: '#ffd166',
  design: '#f0a6d8',
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const topic = post?.topics[0]
  const accent = topic ? topicColors[topic] : '#c7f66b'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 7,
              border: '1px solid #354239',
              background: '#101418',
              position: 'relative',
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
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 18,
            letterSpacing: '0.1em',
            color: accent,
          }}
        >
          {post ? `SIGNAL / ${topic?.toUpperCase() ?? ''}` : '404 / NO SIGNAL'}
        </div>
      </div>
      <div
        style={{
          fontSize: post && post.title.length > 90 ? 44 : 64,
          lineHeight: 1.05,
          letterSpacing: '-0.05em',
          maxWidth: 900,
        }}
      >
        {post ? post.title : 'Tópico não encontrado'}
      </div>
      <div style={{ fontSize: 24, color: '#98a29a' }}>
        {post ? post.description : 'NexSift, menos ruído e mais sinal'}
      </div>
    </div>,
    size,
  )
}
