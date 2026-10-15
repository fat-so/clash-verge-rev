import type { ArkApi, ArkLease } from './ark-api'

export interface ArkProfileAdapter {
  apply(lease: ArkLease): Promise<void>
  clear(): Promise<void>
}
export type ArkState = {
  phase:
    | 'idle'
    | 'connecting'
    | 'applied'
    | 'disconnecting'
    | 'renewing'
    | 'error'
  lease?: ArkLease
  error?: string
}
export class ArkSession {
  state: ArkState = { phase: 'idle' }
  private busy = false
  constructor(
    private api: Pick<
      ArkApi,
      'connect' | 'disconnect' | 'heartbeat' | 'renew' | 'ack' | 'session'
    >,
    private profiles: ArkProfileAdapter,
    private changed: (state: ArkState) => void,
  ) {}
  private publish(state: ArkState) {
    this.state = state
    this.changed(state)
  }
  private async run(work: () => Promise<void>) {
    if (this.busy) return
    this.busy = true
    try {
      await work()
    } catch (error) {
      this.publish({
        ...this.state,
        phase: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      this.busy = false
    }
  }
  private async apply(lease: ArkLease) {
    this.publish({ ...this.state, lease })
    try {
      await this.profiles.apply(lease)
    } catch (error) {
      try {
        await this.api.ack(lease.leaseId, false)
      } catch {
        /* The server ACK deadline still bounds cleanup. */
      }
      throw error
    }
    await this.api.ack(lease.leaseId, true)
    this.publish({ phase: 'applied', lease })
  }
  recover = () =>
    this.run(async () => {
      const lease = await this.api.session()
      if (
        !lease ||
        !['ready', 'connected'].includes(lease.status) ||
        Date.parse(lease.expireAt) <= Date.now()
      ) {
        await this.profiles.clear()
        this.publish({ phase: 'idle' })
        return
      }
      this.publish({ phase: 'connecting', lease })
      await this.apply(lease)
    })
  connect = () =>
    this.run(async () => {
      this.publish({ phase: 'connecting' })
      await this.apply(await this.api.connect())
    })
  disconnect = () =>
    this.run(async () => {
      const lease = this.state.lease
      if (!lease) return
      this.publish({ ...this.state, phase: 'disconnecting' })
      await this.profiles.clear()
      await this.api.disconnect(lease.leaseId)
      this.publish({ phase: 'idle' })
    })
  renew = () =>
    this.run(async () => {
      const lease = this.state.lease
      if (!lease) return
      this.publish({ ...this.state, phase: 'renewing' })
      await this.apply(await this.api.renew(lease.leaseId))
    })
  heartbeat = () =>
    this.run(async () => {
      const lease = this.state.lease
      if (!lease || this.state.phase !== 'applied') return
      const reply = await this.api.heartbeat(lease.leaseId)
      if (['expired', 'failed', 'grace'].includes(reply.status))
        throw new Error('伺服器租約已停止，請斷線後重新連線')
      if (reply.replacement) await this.apply(reply.replacement)
      else if (Date.parse(lease.expireAt) <= Date.now()) {
        this.publish({ ...this.state, phase: 'renewing' })
        await this.apply(await this.api.renew(lease.leaseId))
      }
    })
}
