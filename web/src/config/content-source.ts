export type ContentSource = 'static' | 's3'

// The portfolio site ships bundled content by default. Set CONTENT_SOURCE=s3
// to point the web app back at the AWS content bucket without code changes.
export const contentSource: ContentSource =
  process.env.CONTENT_SOURCE === 's3' ? 's3' : 'static'
