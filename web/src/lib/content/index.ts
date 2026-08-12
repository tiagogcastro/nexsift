import type { Topic } from '@nexsift/contracts'
import {
  getFilesystemPost,
  listFilesystemPosts,
  listFilesystemPostsByTopic,
} from './filesystem'
import { getS3Post, listS3Posts, listS3PostsByTopic } from './s3'

function useS3() {
  return process.env.CONTENT_SOURCE === 's3'
}

export function listPosts() {
  return useS3() ? listS3Posts() : listFilesystemPosts()
}

export function getPostBySlug(slug: string) {
  return useS3() ? getS3Post(slug) : getFilesystemPost(slug)
}

export function listPostsByTopic(topic: Topic) {
  return useS3()
    ? listS3PostsByTopic(topic)
    : listFilesystemPostsByTopic(topic)
}
