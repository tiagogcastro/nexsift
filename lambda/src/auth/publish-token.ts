import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

let cachedToken: string | null = null

export async function getPublishToken() {
  if (cachedToken) {
    return cachedToken
  }

  if (process.env.PUBLISH_TOKEN) {
    cachedToken = process.env.PUBLISH_TOKEN
    return cachedToken
  }

  const parameterName = process.env.PUBLISH_TOKEN_PARAMETER

  if (!parameterName) {
    throw new Error('PUBLISH_TOKEN or PUBLISH_TOKEN_PARAMETER is required')
  }

  const endpoint = process.env.AWS_ENDPOINT_URL || undefined
  const client = new SSMClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint,
  })
  const response = await client.send(
    new GetParameterCommand({ Name: parameterName, WithDecryption: true }),
  )
  const token = response.Parameter?.Value

  if (!token) {
    throw new Error(`Publish token parameter ${parameterName} has no value`)
  }

  cachedToken = token
  return cachedToken
}
