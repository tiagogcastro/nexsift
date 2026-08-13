import type { Topic } from '@nexsift/schemas/topic'
import type { getTranslations } from 'next-intl/server'

export const topicOrder: readonly Topic[] = [
  'ai',
  'development',
  'cloud',
  'devops',
  'security',
  'industry',
  'design',
] as const

export interface TopicMeta {
  label: string
  shortLabel: string
  description: string
}

type Translator = Awaited<ReturnType<typeof getTranslations>>

export function getTopicMeta(t: Translator, topic: Topic): TopicMeta {
  switch (topic) {
    case 'ai':
      return {
        label: t('topicItems.ai.label'),
        shortLabel: t('topicItems.ai.shortLabel'),
        description: t('topicItems.ai.description'),
      }
    case 'cloud':
      return {
        label: t('topicItems.cloud.label'),
        shortLabel: t('topicItems.cloud.shortLabel'),
        description: t('topicItems.cloud.description'),
      }
    case 'development':
      return {
        label: t('topicItems.development.label'),
        shortLabel: t('topicItems.development.shortLabel'),
        description: t('topicItems.development.description'),
      }
    case 'devops':
      return {
        label: t('topicItems.devops.label'),
        shortLabel: t('topicItems.devops.shortLabel'),
        description: t('topicItems.devops.description'),
      }
    case 'security':
      return {
        label: t('topicItems.security.label'),
        shortLabel: t('topicItems.security.shortLabel'),
        description: t('topicItems.security.description'),
      }
    case 'industry':
      return {
        label: t('topicItems.industry.label'),
        shortLabel: t('topicItems.industry.shortLabel'),
        description: t('topicItems.industry.description'),
      }
    case 'design':
      return {
        label: t('topicItems.design.label'),
        shortLabel: t('topicItems.design.shortLabel'),
        description: t('topicItems.design.description'),
      }
  }
}
