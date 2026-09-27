const invokeUrl = process.env.MCP_INVOKE_URL ?? 'http://localhost:4566/2015-03-31/functions/nexsift-local-mcp/invocations'
const token = process.env.TF_VAR_mcp_token

if (!token) throw new Error('TF_VAR_mcp_token is required; load .env.mcp.local')

async function invoke(method: string, params: Record<string, unknown>, authorization?: string) {
  const response = await fetch(invokeUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      version: '2.0',
      rawPath: '/',
      requestContext: { http: { method: 'POST' } },
      headers: {
        ...(authorization ? { authorization: `Bearer ${authorization}` } : {}),
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  })
  if (!response.ok) throw new Error(`MiniStack invoke returned ${response.status}`)
  return response.json() as Promise<{ statusCode: number; body: string }>
}

async function main() {
  const denied = await invoke('tools/list', {})
  if (denied.statusCode !== 401) throw new Error(`Expected anonymous request to return 401, got ${denied.statusCode}`)

  const allowed = await invoke('tools/list', {}, token)
  if (allowed.statusCode !== 200) throw new Error(`Expected authorized request to return 200, got ${allowed.statusCode}`)
  const list = JSON.parse(allowed.body) as { result?: { tools?: { name: string }[] }; error?: unknown }
  if (!list.result?.tools) throw new Error('The authorized response did not include MCP tools')

  const instructions = await invoke('tools/call', { name: 'editorialInstructions', arguments: {} }, token)
  const bundle = JSON.parse(instructions.body) as { result?: { content?: { text: string }[] } }
  const version = bundle.result?.content?.[0]?.text.match(/^version: ([\d-]+)/m)?.[1]
  if (!version) throw new Error('editorialInstructions did not return a bundle version')

  const resolved = await invoke('tools/call', {
    name: 'resolvePost',
    arguments: { title: 'Verificação local do MCP', topic: 'development', signalDate: '2026-09-27' },
  }, token)
  const lookup = JSON.parse(resolved.body) as { result?: { isError?: boolean; content?: { text: string }[] } }
  const identity = lookup.result?.content?.[0]?.text
  if (lookup.result?.isError || !identity || !JSON.parse(identity).slug) {
    throw new Error(`MCP could not reach the local publish API: ${identity ?? 'no response'}`)
  }

  console.log(`MCP local: anonymous=401 authorized=200 backend=reachable bundle=${version}`)
  console.log(`Tools: ${list.result.tools.map((tool) => tool.name).join(', ')}`)
}

main().catch((error) => {
  console.error('MCP local check failed:', error)
  process.exitCode = 1
})
