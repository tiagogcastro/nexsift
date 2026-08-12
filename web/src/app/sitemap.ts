import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { routing } from '@/i18n/routing'
import { listPosts } from '@/lib/content'
import { topicMeta } from '@/lib/topics'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPosts()
  const localizedPages = routing.locales.flatMap((locale) => [
    {
      url:
        locale === routing.defaultLocale
          ? `${siteConfig.url}/`
          : `${siteConfig.url}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: locale === 'pt-BR' ? 1 : 0.7,
    },
    {
      url:
        locale === routing.defaultLocale
          ? `${siteConfig.url}/about`
          : `${siteConfig.url}/${locale}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ])

  return [
    ...localizedPages,
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...Object.keys(topicMeta).map((topic) => ({
      url: `${siteConfig.url}/topics/${topic}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: post.featured ? 0.9 : 0.8,
    })),
  ]
}
