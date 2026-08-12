const url = process.env.NEXT_PUBLIC_SITE_URL

if (!url) {
  throw new Error('NEXT_PUBLIC_SITE_URL is required')
}

export const siteConfig = {
  name: 'NexSift',
  defaultTitle: 'NexSift | Menos ruído. Mais sinal.',
  description:
    'Inteligência tech para desenvolvedores. Sinais verificados sobre IA, cloud, desenvolvimento, DevOps e carreira.',
  url,
  author: 'NexSift Editorial',
  creator: 'Tiago Castro',
  githubUrl: 'https://github.com/tiagogcastro',
  linkedinUrl: 'https://www.linkedin.com/in/tiagogcastro',
} as const
