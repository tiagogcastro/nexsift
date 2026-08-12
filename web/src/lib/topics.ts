import type { Topic } from '@nexsift/contracts'

export const topicMeta: Record<
  Topic,
  { label: string; shortLabel: string; description: string }
> = {
  ai: {
    label: 'Inteligência Artificial',
    shortLabel: 'IA',
    description: 'Modelos, agentes, ferramentas e mudanças práticas no ecossistema de IA.',
  },
  'aws-cloud': {
    label: 'AWS & Cloud',
    shortLabel: 'CLOUD',
    description: 'Infraestrutura, serviços gerenciados, arquitetura e custos de cloud.',
  },
  development: {
    label: 'Desenvolvimento',
    shortLabel: 'DEV',
    description: 'Frameworks, runtimes, plataformas e práticas de engenharia de software.',
  },
  devops: {
    label: 'DevOps',
    shortLabel: 'OPS',
    description: 'CI/CD, IaC, observabilidade, automação e operação de sistemas.',
  },
  career: {
    label: 'Carreira',
    shortLabel: 'CAREER',
    description: 'Mercado, habilidades, contratação e movimentos que afetam profissionais tech.',
  },
}
