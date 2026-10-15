import type { ArkLease } from './ark-api'
import type { ArkProfileAdapter } from './ark-session'
import {
  createProfile,
  deleteProfile,
  getProfiles,
  patchProfilesConfig,
} from './cmds'
import { mutate } from './mutate'

export class ArkProfiles implements ArkProfileAdapter {
  private previous?: string
  private current?: string
  private captured = false
  private async select(uid: string) {
    const result = await mutate(() => patchProfilesConfig({ current: uid }), {
      id: 'patch-profiles-config',
      errorNotice: false,
    })
    if (!result.ok || result.value.status !== 'valid')
      throw new Error('核心未接受 Ark 配置')
  }
  async apply(lease: ArkLease) {
    if (!this.captured) {
      this.previous = (await getProfiles()).current
      this.captured = true
    }
    const uid = `ark-${lease.leaseId}`
    if (this.current === uid && (await getProfiles()).current === uid) return
    await mutate(
      () =>
        createProfile(
          {
            uid,
            type: 'local',
            name: 'Ark VPN',
            desc: `Managed lease ${lease.leaseId}`,
          },
          lease.config,
        ),
      { id: `create-profile:${uid}`, errorNotice: false },
    )
    try {
      await this.select(uid)
    } catch (error) {
      await mutate(() => deleteProfile(uid), {
        id: `delete-profile:${uid}`,
        errorNotice: false,
      })
      throw error
    }
    const old = this.current
    this.current = uid
    if (old && old !== uid)
      await mutate(() => deleteProfile(old), {
        id: `delete-profile:${old}`,
        errorNotice: false,
      })
  }
  async clear() {
    if (!this.current) return
    const profiles = await getProfiles()
    if (profiles.current === this.current) {
      if (
        this.previous &&
        profiles.items?.some((item) => item.uid === this.previous)
      )
        await this.select(this.previous)
      else {
        const uid = `ark-idle-${crypto.randomUUID()}`
        await mutate(
          () =>
            createProfile(
              { uid, type: 'local', name: 'Ark disconnected' },
              'proxies: []\nproxy-groups: []\nrules:\n  - MATCH,REJECT\n',
            ),
          { id: `create-profile:${uid}`, errorNotice: false },
        )
        await this.select(uid)
        this.previous = uid
      }
    }
    const uid = this.current
    await mutate(() => deleteProfile(uid), {
      id: `delete-profile:${uid}`,
      errorNotice: false,
    })
    this.current = undefined
  }
}
