export interface ArkLease {
  leaseId: string
  status: string
  config: string
  expireAt: string
  heartbeatSeconds?: number
}
export interface ArkReply {
  status: string
  expireAt?: string
  replacement?: ArkLease | null
}
export class ArkApi {
  constructor(
    private origin: string,
    private token: string,
  ) {}
  async request<T>(path: string, body?: object): Promise<T> {
    const response = await fetch(
      `${this.origin.replace(/\/$/, '')}/api/v1/vpn/${path}`,
      {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(120000),
      },
    )
    const result = await response.json()
    if (!response.ok)
      throw new Error(
        `${result.code ?? response.status}: ${result.message ?? 'API request failed'}`,
      )
    return result as T
  }
  session = () => this.request<ArkLease | null>('session')
  connect = () =>
    this.request<ArkLease>('connect', { requestId: crypto.randomUUID() })
  disconnect = (leaseId: string) =>
    this.request<ArkReply>('disconnect', {
      requestId: crypto.randomUUID(),
      leaseId,
    })
  heartbeat = (leaseId: string) =>
    this.request<ArkReply>('heartbeat', {
      requestId: crypto.randomUUID(),
      leaseId,
    })
  renew = (leaseId: string) =>
    this.request<ArkLease>('renew', { requestId: crypto.randomUUID(), leaseId })
  ack = (leaseId: string, success: boolean) =>
    this.request<ArkReply>('ack', {
      requestId: crypto.randomUUID(),
      leaseId,
      success,
    })
}
