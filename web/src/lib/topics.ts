import type { Topic } from '@nexsift/schemas/topic'
import type { getTranslations } from 'next-intl/server'

export const topicOrder: readonly Topic[] = [
  'ai',
  'cloud',
  'development',
  'devops',
  'career',
  'finance',
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
    case 'career':
      return {
        label: t('topicItems.career.label'),
        shortLabel: t('topicItems.career.shortLabel'),
        description: t('topicItems.career.description'),
      }
    case 'finance':
      return {
        label: t('topicItems.finance.label'),
        shortLabel: t('topicItems.finance.shortLabel'),
        description: t('topicItems.finance.description'),
      }
  }
}
