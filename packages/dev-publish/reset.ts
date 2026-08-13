const invokeUrl = process.env.PUBLISH_INVOKE_URL
const token = process.env.PUBLISH_TOKEN

if (!invokeUrl || !token) {
  throw new Error('PUBLISH_INVOKE_URL and PUBLISH_TOKEN are required')
}

// AWS Lambda Function URLs and API Gateway endpoints receive the HTTP
// request directly; the MiniStack Invoke API expects the Lambda event
// envelope in the request body.
const isProdUrl =
  invokeUrl.includes('.lambda-url.') || invokeUrl.includes('.execute-api.')
const allowProd = process.argv.includes('--allow-prod')

if (isProdUrl && !allowProd) {
  throw new Error(
    'Refusing to reset a production endpoint; pass --allow-prod to override',
  )
}

interface ListedPost {
  slug: string
}

async function request(
  method: 'GET' | 'DELETE',
  path: string,
  query: Record<string, string> = {},
) {
  const search = new URLSearchParams(query).toString()
  const url = `${invokeUrl}${path}${search ? `?${search}` : ''}`

  if (isProdUrl) {
    return fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const event = {
    httpMethod: method,
    path,
    queryStringParameters: query,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: '',
  }

  return fetch(invokeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
}

async function main() {
  let deleted = 0

  for (let round = 0; round < 10; round++) {
    const listResponse = await request('GET', '/', { limit: '100' })
    const payload = (await listResponse.json()) as { posts?: ListedPost[] }
    const posts = payload.posts ?? []

    if (posts.length === 0) {
      break
    }

    for (const post of posts) {
      const deleteResponse = await request(
        'DELETE',
        `/posts/${encodeURIComponent(post.slug)}`,
      )
      console.log(`delete ${post.slug}: ${deleteResponse.status}`)

      if (!deleteResponse.ok) {
        console.log(await deleteResponse.text())
        process.exitCode = 1
        return
      }

      deleted++
    }
  }

  console.log(`reset_content deleted=${deleted}`)
}

main().catch((error) => {
  console.error('reset_failed', error)
  process.exitCode = 1
})
