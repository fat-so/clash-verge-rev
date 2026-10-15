import { useEffect, useState } from 'react'

import logo from '@/assets/image/ark-logo.png'
import { Scenery } from '@/components/ark-scenery'
import { arkClient } from '@/store/ark-client'

import './ark.css'

const labels = {
  idle: '準備出發',
  connecting: '正在取得配置',
  applied: '配置已套用',
  disconnecting: '正在斷線',
  renewing: '正在更新入口',
  error: '需要處理',
}
export default function ArkPage() {
  const [origin, setOrigin] = useState('http://127.0.0.1:3100')
  const [token, setToken] = useState('')
  const [state, setState] = useState(arkClient.snapshot)

  const active = Boolean(state.lease)
  const busy = ['connecting', 'disconnecting', 'renewing'].includes(state.phase)
  useEffect(() => arkClient.subscribe(setState), [])
  const connect = () => {
    void arkClient.connect(origin, token)
  }
  return (
    <main className="ark-page">
      <header className="ark-header">
        <img src={logo} alt="方舟 VPN" />
        <div>
          <strong>方舟 VPN</strong>
          <small>ARK VPN · YOUR EVERYDAY COMPANION</small>
        </div>
        <span>會員連線</span>
      </header>
      <section className="ark-hero">
        <Scenery />
        <div className="ark-copy">
          <span className="ark-eyebrow">ARK VPN / EVERYWHERE</span>
          <h1>
            世界很大，
            <br />
            安心出發。
          </h1>
          <p>由方舟為你配置專屬連線入口。</p>
        </div>
        <div className="ark-card">
          <span
            className={`ark-status ${state.phase === 'applied' ? 'on' : ''}`}
          >
            {labels[state.phase]}
          </span>
          <h2>
            {state.phase === 'applied' ? '專屬配置已就緒' : '你的下一段旅程'}
          </h2>
          <p>
            核心接受配置後才會確認派發。
            <br />
            此狀態不代表已驗證外網連通。
          </p>
          <button
            className="ark-power"
            aria-label={active ? '斷線' : '連線'}
            disabled={busy || (!active && (!token || !origin))}
            onClick={() => {
              if (active) void arkClient.disconnect()
              else connect()
            }}
          >
            ⏻
          </button>
          <strong>{busy ? '請稍候…' : active ? '斷線' : '連線'}</strong>
          {active && (
            <button
              className="ark-renew"
              disabled={busy}
              onClick={() => {
                void arkClient.renew()
              }}
            >
              更新入口 IP
            </button>
          )}
        </div>
      </section>
      <section className="ark-bottom">
        <div className="ark-settings">
          <h2>連線設定</h2>
          <label>
            API 伺服器
            <input
              type="url"
              value={origin}
              disabled={active || busy}
              onChange={(event) => setOrigin(event.target.value)}
            />
          </label>
          <label>
            會員存取權杖
            <input
              type="password"
              autoComplete="off"
              value={token}
              disabled={active || busy}
              onChange={(event) => setToken(event.target.value)}
              placeholder="輸入會員 Bearer token"
            />
          </label>
          <p>權杖僅保留於本次頁面記憶體。</p>
        </div>
        <div className="ark-details">
          <h2>連線資訊</h2>
          <dl>
            <dt>配置到期</dt>
            <dd>
              {state.lease
                ? new Date(state.lease.expireAt).toLocaleString()
                : '尚未派發'}
            </dd>
            <dt>外網連通</dt>
            <dd>未驗證</dd>
            <dt>流量與延遲</dt>
            <dd>未採樣</dd>
          </dl>
          <p>
            不自動更動系統代理或
            TUN。應用程式開啟時維持心跳，關閉後租約依伺服器期限回收。
          </p>
        </div>
      </section>
      {state.phase === 'error' && active && (
        <button
          onClick={() => {
            void arkClient.recover()
          }}
        >
          重新同步租約
        </button>
      )}
      {state.error && (
        <div className="ark-error" role="alert">
          {state.error}
        </div>
      )}
    </main>
  )
}
