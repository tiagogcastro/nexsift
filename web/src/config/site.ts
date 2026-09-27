const url =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : undefined)

if (!url) {
  throw new Error('NEXT_PUBLIC_SITE_URL is required')
}

export const siteConfig = {
  name: 'NexSift',
  defaultTitle: 'NexSift - O que mudou em tecnologia, com fonte e contexto',
  description:
    'Posts curtos sobre mudanças em IA, desenvolvimento, cloud e carreira tech, com fontes verificadas e contexto direto.',
  url,
  author: 'NexSift Editorial',
  creator: 'Tiago Castro',
  websiteUrl: 'https://tiagogcastro.com.br',
  repoUrl: 'https://github.com/tiagogcastro/nexsift',
  githubUrl: 'https://github.com/tiagogcastro',
  linkedinUrl: 'https://www.linkedin.com/in/tiagogcastro',
} as const
