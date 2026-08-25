import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { siteConfig } from '@/config/site'
import { PostArticle } from '@/features/blog/post-article'
import { postAlternates } from '@/lib/alternates'
import { getPostBySlug, listPosts } from '@/lib/content'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {}
  }

  const canonical = `/blog/${post.slug}`
  const images = post.coverImage
    ? [`${siteConfig.url}/s3/${post.coverImage.objectKey}`]
    : [`${siteConfig.url}/opengraph-image`]

  return {
    title: post.title,
    description: post.description,
    alternates: postAlternates(post.slug),
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${siteConfig.name} - ${post.title}`,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [siteConfig.author],
      tags: post.tags,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteConfig.name} - ${post.title}`,
      description: post.description,
      images,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  if (locale !== 'pt-BR') {
    redirect(`/blog/${slug}`)
  }

  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const allPosts = await listPosts()
  const relatedPosts = allPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((first, second) => {
      const firstMatches = first.topic === post.topic
      const secondMatches = second.topic === post.topic

      if (firstMatches !== secondMatches) {
        return firstMatches ? -1 : 1
      }

      return (
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()
      )
    })
    .slice(0, 4)

  const t = await getTranslations()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: siteConfig.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    image: post.coverImage
      ? [`${siteConfig.url}/s3/${post.coverImage.objectKey}`]
      : undefined,
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  }

  return (
    <>
      <Header
        locale="pt-BR"
        labels={{
          blog: t('nav.blog'),
          topics: t('nav.topics'),
          process: t('nav.process'),
          about: t('nav.about'),
          today: t('nav.today'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <PostArticle post={post} relatedPosts={relatedPosts} />
      <Footer
        locale="pt-BR"
        tagline={t('footer.tagline')}
        builtBy={t('footer.builtBy')}
      />
    </>
  )
}
