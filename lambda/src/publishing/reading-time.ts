const wordsPerMinute = 180

export function calculateReadingTime(markdown: string) {
  const wordCount = markdown
    .replace(/[`#*_>\-[\]()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}
