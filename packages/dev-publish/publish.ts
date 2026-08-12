import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { postDraftSchema } from '@nexsift/schemas/post'

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
  throw new Error('Refusing to publish to a production endpoint; pass --allow-prod to override')
}

async function main() {
  const fileArg = process.argv.find((arg) => arg.startsWith('--file='))
  const filePath = fileArg?.slice('--file='.length) ?? 'payloads/example.json'

  const body = await readFile(path.resolve(filePath), 'utf8')
  const payload = JSON.parse(body) as { post?: unknown }
  const draft = postDraftSchema.parse(payload.post)

  const event = {
    httpMethod: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ post: draft }),
  }

  const response = await fetch(invokeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: isProdUrl ? JSON.stringify({ post: draft }) : JSON.stringify(event),
  })

  const text = await response.text()
  console.log(`status=${response.status} body=${text}`)

  if (!response.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('publish_failed', error)
  process.exitCode = 1
})
