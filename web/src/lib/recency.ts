export function isSignalWithinDays(publishedAt: string, days: number) {
  return Date.now() - new Date(publishedAt).getTime() <=
    days * 24 * 60 * 60 * 1000
}
