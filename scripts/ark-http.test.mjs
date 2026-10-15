import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
async function load(file) {
  const code = stripTypeScriptTypes(
    await readFile(new URL(file, import.meta.url), 'utf8'),
    { mode: 'transform' },
  )
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  )
}
const { ArkApi } = await load('../src/services/ark-api.ts')
const { ArkSession } = await load('../src/services/ark-session.ts')
test('real loopback HTTP transport recovers lost ACK and heartbeat, then disconnects', async () => {
  let current = null
  let loseAck = true
  let failHeartbeat = false
  let applied = 0
  let cleared = 0
  const seen = []
  const server = createServer(async (req, res) => {
    const parts = []
    for await (const chunk of req) parts.push(chunk)
    const body = parts.length
      ? JSON.parse(Buffer.concat(parts).toString())
      : null
    seen.push({
      path: req.url,
      method: req.method,
      auth: req.headers.authorization,
      body,
    })
    let response
    if (req.url.endsWith('/connect')) {
      current = {
        leaseId: 'http-lease',
        status: 'ready',
        config: 'mock YAML',
        expireAt: new Date(Date.now() + 120000).toISOString(),
        heartbeatSeconds: 30,
      }
      response = current
    } else if (req.url.endsWith('/ack')) {
      current.status = 'connected'
      if (loseAck) {
        loseAck = false
        req.socket.destroy()
        return
      }
      response = { status: 'connected' }
    } else if (req.url.endsWith('/session')) response = current
    else if (req.url.endsWith('/heartbeat')) {
      if (failHeartbeat) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ code: 'TEMPORARY', message: 'try recovery' }))
        return
      }
      response = {
        status: 'connected',
        expireAt: current.expireAt,
        replacement: null,
      }
    } else if (req.url.endsWith('/disconnect')) {
      current = null
      response = { status: 'grace' }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const api = new ArkApi(
      `http://127.0.0.1:${server.address().port}`,
      'test-only-member',
    )
    const session = new ArkSession(
      api,
      {
        apply: async () => {
          applied++
        },
        clear: async () => {
          cleared++
        },
      },
      () => {},
    )
    await session.connect()
    assert.equal(session.state.phase, 'error')
    await session.recover()
    assert.equal(session.state.phase, 'applied')
    failHeartbeat = true
    await session.heartbeat()
    assert.equal(session.state.phase, 'error')
    assert.match(session.state.error, /TEMPORARY/)
    failHeartbeat = false
    await session.recover()
    assert.equal(session.state.phase, 'applied')
    await session.disconnect()
    assert.equal(session.state.phase, 'idle')
    assert.equal(cleared, 1)
    assert.equal(applied, 3)
    assert.ok(seen.every((item) => item.auth === 'Bearer test-only-member'))
    assert.ok(
      seen
        .filter((item) => item.method === 'POST')
        .every((item) => item.body.requestId),
    )
    assert.equal(
      seen.filter((item) => item.path.endsWith('/connect')).length,
      1,
    )
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
