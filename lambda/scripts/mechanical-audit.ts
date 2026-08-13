import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateSourceUrl } from '../src/publishing/validate-source'
import { discoverArchivedCopy } from '../src/publishing/audit-sources'

// One-off mechanical audit of the production sources. Uses the real lambda
// code paths so the results match what the deployed validator would record.
async function main() {
  const dir = '/tmp/opencode/nexsift-audit/posts'
  const output: Record<string, unknown>[] = []

  for (const entry of await readDir(dir)) {
    if (!entry.endsWith('.json')) {
      continue
    }

    const post = JSON.parse(await readFile(path.join(dir, entry), 'utf8')) as {
      slug: string
      sources: Array<{
        title: string
        url: string
        lastSuccessfulAt?: string
        lastCheckedAt?: string
        verifiedAtPublication?: boolean
        editorialStatus?: string
      }>
    }

    for (const source of post.sources) {
      let result: Record<string, unknown> | null = null

      try {
        const check = await validateSourceUrl(source.url)
        result = {
          status: 'fulfilled',
          ok: check.ok,
          finalUrl: check.finalUrl,
          httpStatus: check.status,
          sourceStatus: check.sourceStatus,
          pageTitle: check.pageTitle,
          contentType: check.contentType,
          checkedAt: check.checkedAt,
        }
      } catch (error) {
        const check = (error as { check?: Record<string, unknown> }).check
        result = {
          status: 'rejected',
          reason: (error as Error).message,
          ...(check ? { check } : {}),
        }
      }

      const archived = await discoverArchivedCopy(source.url)

      output.push({
        slug: post.slug,
        title: source.title,
        url: source.url,
        lastSuccessfulAt: source.lastSuccessfulAt ?? null,
        lastCheckedAt: source.lastCheckedAt ?? null,
        verifiedAtPublication: source.verifiedAtPublication ?? null,
        editorialStatus: source.editorialStatus ?? null,
        archivedCopyAvailable: archived,
        ...result,
      })

      console.log(
        JSON.stringify({
          slug: post.slug,
          url: source.url.slice(0, 70),
          status: result?.sourceStatus ?? result?.httpStatus,
          archive: archived ? 'yes' : 'no',
        }),
      )
    }
  }

  await writeFile(
    '/tmp/opencode/nexsift-audit/mechanical-audit.json',
    JSON.stringify(output, null, 2),
  )
  console.log('written /tmp/opencode/nexsift-audit/mechanical-audit.json')
}

async function readDir(dir: string) {
  const { readdir } = await import('node:fs/promises')
  return readdir(dir)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
