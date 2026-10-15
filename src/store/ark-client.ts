import { ArkApi } from '../services/ark-api'
import { ArkProfiles } from '../services/ark-profiles'
import { ArkSession, type ArkState } from '../services/ark-session'

let session: ArkSession | undefined
let state: ArkState = { phase: 'idle' }
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<(state: ArkState) => void>()
function publish(next: ArkState) {
  state = next
  if (timer) clearInterval(timer)
  timer = undefined
  if (next.phase === 'applied') {
    timer = setInterval(
      () => {
        void session?.heartbeat()
      },
      Math.max(5, next.lease?.heartbeatSeconds ?? 30) * 1000,
    )
  }
  for (const listener of listeners) listener(next)
}
export const arkClient = {
  snapshot: () => state,
  subscribe(listener: (state: ArkState) => void) {
    listeners.add(listener)
    listener(state)
    return () => {
      listeners.delete(listener)
    }
  },
  connect(origin: string, token: string) {
    if (state.lease || state.phase === 'connecting') return
    session = new ArkSession(
      new ArkApi(origin, token),
      new ArkProfiles(),
      publish,
    )
    return session.connect()
  },
  recover: () => session?.recover(),
  disconnect: () => session?.disconnect(),
  renew: () => session?.renew(),
}
