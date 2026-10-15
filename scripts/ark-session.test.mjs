import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
const source = await readFile(
  new URL('../src/services/ark-session.ts', import.meta.url),
  'utf8',
)
const { ArkSession } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64')}`
)
const lease = (id = 'a') => ({
  leaseId: id,
  status: 'ready',
  config: 'yaml',
  expireAt: new Date(Date.now() + 60000).toISOString(),
})
function fixture(failApply = false) {
  const calls = []
  const api = {
    connect: async () => {
      calls.push('connect')
      return lease()
    },
    disconnect: async (id) => {
      calls.push(`disconnect:${id}`)
      return { status: 'grace' }
    },
    heartbeat: async () => ({ status: 'connected', replacement: lease('b') }),
    renew: async () => lease('b'),
    ack: async (id, success) => {
      calls.push(`ack:${id}:${success}`)
      return { status: success ? 'connected' : 'failed' }
    },
  }
  const profiles = {
    apply: async (value) => {
      calls.push(`apply:${value.leaseId}`)
      if (failApply) throw new Error('native reject')
    },
    clear: async () => {
      calls.push('clear')
    },
  }
  return { calls, session: new ArkSession(api, profiles, () => {}) }
}
test('ack waits for native apply; disconnect clears owned profile first', async () => {
  const { calls, session } = fixture()
  await session.connect()
  assert.equal(session.state.phase, 'applied')
  await session.disconnect()
  assert.deepEqual(calls, [
    'connect',
    'apply:a',
    'ack:a:true',
    'clear',
    'disconnect:a',
  ])
  assert.equal(session.state.phase, 'idle')
})
test('failed native application sends negative ack and never reports applied', async () => {
  const { calls, session } = fixture(true)
  await session.connect()
  assert.equal(session.state.phase, 'error')
  assert.deepEqual(calls, ['connect', 'apply:a', 'ack:a:false'])
})
test('heartbeat replacement applies and acknowledges new lease', async () => {
  const { calls, session } = fixture()
  await session.connect()
  await session.heartbeat()
  assert.equal(session.state.lease.leaseId, 'b')
  assert.deepEqual(calls.slice(-2), ['apply:b', 'ack:b:true'])
})
test('double-click does not allocate two leases', async () => {
  const { calls, session } = fixture()
  await Promise.all([session.connect(), session.connect()])
  assert.equal(calls.filter((call) => call === 'connect').length, 1)
})
