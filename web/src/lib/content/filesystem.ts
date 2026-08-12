import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  postSchema,
  postSummarySchema,
  type Post,
  type PostSummary,
  type Topic,
} from '@nexsift/contracts'

async function getPostsDirectory() {
  const candidates = [
    path.join(process.cwd(), 'content', 'posts'),
    path.join(process.cwd(), 'web', 'content', 'posts'),
  ]

  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      continue
    }
  }

  throw new Error('Unable to locate bundled post content')
}

function toSummary(post: Post): PostSummary {
  return postSummarySchema.parse(post)
}

export async function listFilesystemPosts() {
  const directory = await getPostsDirectory()
  const fileNames = await readdir(directory)
  const posts = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.json'))
      .map(async (fileName) => {
        const body = await readFile(path.join(directory, fileName), 'utf8')
        return postSchema.parse(JSON.parse(body))
      }),
  )

  return posts
    .sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime(),
    )
    .map(toSummary)
}

export async function getFilesystemPost(slug: string) {
  try {
    const body = await readFile(
      path.join(await getPostsDirectory(), `${slug}.json`),
      'utf8',
    )
    return postSchema.parse(JSON.parse(body))
  } catch (error) {
    if (isMissingFile(error)) {
      return null
    }
    throw error
  }
}

function isMissingFile(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT',
  )
}

export async function listFilesystemPostsByTopic(topic: Topic) {
  const posts = await listFilesystemPosts()
  return posts.filter((post) => post.topics.includes(topic))
}
