import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Globe2,
  Layers3,
  Menu,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { locations, initialRules, type Location } from "./data";
import { Scenery } from "./Scenery";
type Page = "home" | "locations" | "rules" | "subscriptions" | "settings";
const nav = [
  { id: "home", label: "總覽", icon: Compass },
  { id: "locations", label: "連線位置", icon: Globe2 },
  { id: "rules", label: "流量規則", icon: Workflow },
  { id: "subscriptions", label: "訂閱管理", icon: Layers3 },
  { id: "settings", label: "偏好設定", icon: Settings2 },
] as const;
function Flag({ code }: { code: string }) {
  return (
    <span className={`flag flag-${code}`} aria-hidden="true">
      {
        (
          {
            tw: "🇹🇼",
            hk: "🇭🇰",
            sg: "🇸🇬",
            kr: "🇰🇷",
            us: "🇺🇸",
            uk: "🇬🇧",
          } as Record<string, string>
        )[code]
      }
    </span>
  );
}
function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${value ? "on" : ""}`}
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  );
}
function App() {
  const [page, setPage] = useState<Page>("home");
  const [selected, setSelected] = useState(locations[0]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("全部位置");
  const [favorites, setFavorites] = useState([
    "jp-tokyo",
    "tw-taipei",
    "sg-marina",
  ]);
  const [mode, setMode] = useState("規則模式");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [ruleQuery, setRuleQuery] = useState("");
  const [rules, setRules] = useState(initialRules);
  const [addRule, setAddRule] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDomain, setRuleDomain] = useState("");
  const [settings, setSettings] = useState({
    system: true,
    tun: false,
    startup: false,
    auto: true,
    ipv6: false,
    lan: false,
  });
  const [subscription, setSubscription] = useState("Ark VPN Global");
  const [subModal, setSubModal] = useState(false);
  const [subName, setSubName] = useState("");
  const [extraSubs, setExtraSubs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("今天 09:24");
  const [help, setHelp] = useState(false);
  const say = (text: string) => setToast(text);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setPicker(false);
        setSubModal(false);
        setAddRule(false);
        setHelp(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const dialogOpen = picker || addRule || subModal || help;
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const selectors =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]';
    const items = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>(selectors) || []);
    (dialog?.querySelector<HTMLElement>("input") || items()[0])?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = items(),
        first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [dialogOpen]);
  const toggleConnect = () => {
    if (connecting) return;
    if (connected) {
      setConnected(false);
      setElapsed(0);
      return;
    }
    setConnecting(true);
    timer.current = setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 850);
  };
  const navigate = (p: Page) => {
    setPage(p);
    setMenu(false);
    setQuery("");
    setTab("全部位置");
  };
  const choose = (loc: Location) => {
    setSelected(loc);
    setPicker(false);
    say(`已選擇 ${loc.country}・${loc.city}`);
  };
  const favorite = (id: string) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  const filtered = locations.filter(
    (l) =>
      `${l.country}${l.city}${l.english}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (tab === "全部位置" ||
        (tab === "推薦位置" && l.ping < 50) ||
        (tab === "我的最愛" && favorites.includes(l.id))),
  );
  const duration = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const switchSetting = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  const locationList = (
    <>
      <div className="searchbox">
        <Search size={18} />
        <input
          aria-label="搜尋國家或城市"
          placeholder="搜尋國家或城市"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button aria-label="清除搜尋" onClick={() => setQuery("")}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="tabs">
        {["全部位置", "推薦位置", "我的最愛"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="location-list">
        {["亞洲", "歐洲", "美洲"].map((region) => {
          const rows = filtered.filter((l) => l.region === region);
          return (
            rows.length > 0 && (
              <section key={region}>
                <h3 className="region-label">
                  {region}
                  <span>{rows.length} 個位置</span>
                </h3>
                {rows.map((loc) => (
                  <div
                    className={`location-row ${selected.id === loc.id ? "selected" : ""}`}
                    key={loc.id}
                  >
                    <button
                      className="location-select"
                      onClick={() => choose(loc)}
                    >
                      <Flag code={loc.code} />
                      <span className="location-copy">
                        <strong>
                          {loc.country} <span>・{loc.city}</span>
                        </strong>
                        <small>{loc.english}</small>
                      </span>
                      {loc.tag && <span className="tag">{loc.tag}</span>}
                      <span className="latency">
                        <Signal size={15} />
                        {loc.ping} ms
                      </span>
                      {selected.id === loc.id ? (
                        <Check size={18} />
                      ) : (
                        <ChevronRight size={17} />
                      )}
                    </button>
                    <button
                      className={`favorite ${favorites.includes(loc.id) ? "saved" : ""}`}
                      aria-label={`${favorites.includes(loc.id) ? "取消收藏" : "收藏"}${loc.city}`}
                      aria-pressed={favorites.includes(loc.id)}
                      onClick={() => favorite(loc.id)}
                    >
                      <Star size={17} />
                    </button>
                  </div>
                ))}
              </section>
            )
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">
            <Search size={32} />
            <h3>找不到符合的位置</h3>
            <p>試試其他國家或城市名稱。</p>
          </div>
        )}
      </div>
    </>
  );
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="mobile-shade"
          aria-label="關閉選單背景"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "mobile-open" : ""}`}>
        <button
          className="mobile-close icon-button"
          aria-label="關閉選單"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <a
          className="brand"
          aria-label="方舟VPN Ark VPN，返回總覽"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-wordmark"><strong>方舟VPN</strong><small>Ark VPN</small></span>
        </a>
        <p className="brand-caption">留一點自由，給生活。</p>
        <nav aria-label="主選單">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-mini">
            <span className="mini-icon">
              <Layers3 size={17} />
            </span>
            <div>
              <strong>{subscription}</strong>
              <small>本月剩餘 168.4 GB</small>
            </div>
            <button
              aria-label="查看訂閱"
              onClick={() => navigate("subscriptions")}
            >
              <ArrowUpRight size={17} />
            </button>
            <div className="mini-progress">
              <i />
            </div>
          </div>
          <button className="help-link" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            使用指南
            <ArrowUpRight size={14} />
          </button>
          <div className="version">
            <span>ARK VPN FOR DESKTOP</span>
            <span>1.0.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="開啟選單"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span>你的自由空間</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="top-status">
            <span className={connected ? "dot green" : "dot"} />
            {connected ? "連線已啟用" : "尚未連線"}
            <span className="top-divider" />
            <span className="avatar">A</span>
          </div>
        </header>
        <main>
          {page === "home" ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">A LITTLE MORE FREEDOM</p>
                  <h1>世界很大，自由連上。</h1>
                  <p className="subtitle">選一個目的地，讓每一次連線更自在。</p>
                </div>
                <span className="outline-badge">
                  <ShieldCheck size={15} />
                  你的連線，由你掌握
                </span>
              </div>
              <div className="home-layout">
                <section
                  className={`connection-card ${connected ? "is-connected" : ""}`}
                >
                  <Scenery />
                  <div className="hero-top">
                    <span className="hero-label">
                      <span className={`dot ${connected ? "green" : ""}`} />
                      {connected ? "已連線" : "準備就緒"}
                    </span>
                    <span className="hero-number">01 / CONNECT</span>
                  </div>
                  <div className="connection-core">
                    <p className="connection-state">
                      {connecting
                        ? "正在連線"
                        : connected
                          ? "自在，已連線。"
                          : "你的下一站，由此開始。"}
                    </p>
                    <p className="connection-hint">
                      {connected
                        ? `${selected.country}・${selected.city}　${duration}`
                        : "輕觸一下，出發吧。"}
                    </p>
                    <button
                      className={`power-button ${connected ? "connected" : ""} ${connecting ? "connecting" : ""}`}
                      aria-label={connected ? "中斷連線" : "開始連線"}
                      disabled={connecting}
                      onClick={toggleConnect}
                    >
                      <span className="power-inner">
                        <Power size={48} strokeWidth={1.6} />
                      </span>
                    </button>
                    <span className="power-caption">
                      {connecting
                        ? "連線中…"
                        : connected
                          ? "點擊中斷連線"
                          : "點擊連線"}
                    </span>
                  </div>
                  <button
                    className="selected-location"
                    onClick={() => {
                      setPicker(true);
                      setQuery("");
                    }}
                  >
                    <Flag code={selected.code} />
                    <span>
                      <small>目前位置</small>
                      <strong>
                        {selected.country}・{selected.city}
                      </strong>
                    </span>
                    <span className="location-ping">
                      <Signal size={14} />
                      {selected.ping} ms
                    </span>
                    <ChevronDown size={20} />
                  </button>
                  <div className="hero-bottom">
                    <span>
                      <ShieldCheck size={14} />
                      每一次出發，都從容。
                    </span>
                    <span>ARK VPN / EVERYWHERE</span>
                  </div>
                </section>
                <aside className="home-right">
                  <section className="quick-panel">
                    <div className="section-title">
                      <h2>連線偏好</h2>
                      <SlidersHorizontal size={17} />
                    </div>
                    <label className="field-label" htmlFor="mode">
                      代理模式
                    </label>
                    <div className="mode-select">
                      <Workflow size={17} />
                      <select
                        id="mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        {["規則模式", "全域模式", "直接連線"].map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} />
                    </div>
                    <p className="field-help">
                      {mode === "規則模式"
                        ? "依照規則，自動分配每一段流量。"
                        : mode === "全域模式"
                          ? "所有流量皆使用選定的代理位置。"
                          : "所有流量皆使用本機網路。"}
                    </p>
                    <div className="setting-line">
                      <div>
                        <strong>系統代理</strong>
                        <small>為日常瀏覽接上自由</small>
                      </div>
                      <Toggle
                        value={settings.system}
                        onChange={() => switchSetting("system")}
                        label="系統代理"
                      />
                    </div>
                    <div className="setting-line">
                      <div>
                        <strong>TUN 模式</strong>
                        <small>接管裝置的網路流量</small>
                      </div>
                      <Toggle
                        value={settings.tun}
                        onChange={() => switchSetting("tun")}
                        label="TUN 模式"
                      />
                    </div>
                  </section>
                  <section className="recommended">
                    <div className="section-title">
                      <h2>為你推薦</h2>
                      <Sparkles size={16} />
                    </div>
                    <p>近一點，也快一點。</p>
                    {locations.slice(0, 3).map((l) => (
                      <button
                        className="recommend-row"
                        key={l.id}
                        onClick={() => choose(l)}
                      >
                        <Flag code={l.code} />
                        <span>
                          <strong>
                            {l.country}・{l.city}
                          </strong>
                          <small>{l.english.split(" · ")[0]}</small>
                        </span>
                        <span className="latency">{l.ping} ms</span>
                        {selected.id === l.id ? (
                          <Check size={17} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    ))}
                    <button
                      className="text-button"
                      onClick={() => navigate("locations")}
                    >
                      探索所有位置
                      <ArrowUpRight size={16} />
                    </button>
                  </section>
                </aside>
              </div>
              <section className="traffic-strip">
                <div className="traffic-title">
                  <span className="stat-icon">
                    <Zap size={20} />
                  </span>
                  <div>
                    <strong>連線動態</strong>
                    <small>{connected ? "本次連線" : "等候下一段旅程"}</small>
                  </div>
                </div>
                <div className="traffic-stat">
                  <small>
                    <ArrowDown size={13} />
                    下載速率
                  </small>
                  <strong>
                    {connected ? "24.8" : "0.0"}
                    <span>Mbps</span>
                  </strong>
                </div>
                <div className="traffic-stat">
                  <small>
                    <ArrowUp size={13} />
                    上傳速率
                  </small>
                  <strong>
                    {connected ? "3.2" : "0.0"}
                    <span>Mbps</span>
                  </strong>
                </div>
                <div className="traffic-stat">
                  <small>連線時間</small>
                  <strong className="timer">{duration}</strong>
                </div>
                <svg
                  className="sparkline"
                  viewBox="0 0 165 38"
                  aria-hidden="true"
                >
                  <path
                    d={
                      connected
                        ? "M0 33 15 30 22 33 35 15 45 26 55 6 69 15 82 10 94 26 110 13 125 20 140 4 165 10"
                        : "M0 30H165"
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </section>
              <footer className="page-footer">
                <span>
                  <span className="dot green" />
                  一切井然有序。
                </span>
                <span>TAKE A BREATH. GO ANYWHERE.</span>
              </footer>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {page === "locations"
                      ? "FIND YOUR NEXT STOP"
                      : page === "rules"
                        ? "YOUR TRAFFIC, YOUR WAY"
                        : page === "subscriptions"
                          ? "ROOM FOR EVERY JOURNEY"
                          : "MAKE YOURSELF AT HOME"}
                  </p>
                  <h1>{nav.find((n) => n.id === page)?.label}</h1>
                  <p className="subtitle">
                    {page === "locations"
                      ? "無論下一站在哪裡，都有一條適合你的路。"
                      : page === "rules"
                        ? "把每一段流量，交給最合適的路線。"
                        : page === "subscriptions"
                          ? "所有連線資源，都在這裡妥善安排。"
                          : "依你的習慣，找到最舒服的連線方式。"}
                  </p>
                </div>
                {page === "rules" ? (
                  <button
                    className="primary-button"
                    onClick={() => setAddRule(true)}
                  >
                    <Plus size={17} />
                    新增規則
                  </button>
                ) : page === "subscriptions" ? (
                  <button
                    className="primary-button"
                    onClick={() => setSubModal(true)}
                  >
                    <Plus size={17} />
                    新增訂閱
                  </button>
                ) : null}
              </div>
              {page === "locations" && (
                <div className="locations-page">
                  <section className="content-panel">{locationList}</section>
                  <aside className="location-aside">
                    <span className="round-icon">
                      <Globe2 size={28} />
                    </span>
                    <p className="eyebrow">YOUR CURRENT DESTINATION</p>
                    <h2>
                      {selected.country}・{selected.city}
                    </h2>
                    <p>{selected.english}</p>
                    <div className="destination-art">
                      <Scenery />
                      <span>
                        <Flag code={selected.code} />
                      </span>
                    </div>
                    <div className="info-pair">
                      <span>回應時間</span>
                      <strong className="green-text">{selected.ping} ms</strong>
                    </div>
                    <div className="info-pair">
                      <span>連線方式</span>
                      <strong>自動選擇</strong>
                    </div>
                    <button
                      className="primary-button full"
                      onClick={() => navigate("home")}
                    >
                      返回總覽
                      <ArrowUpRight size={16} />
                    </button>
                  </aside>
                </div>
              )}
              {page === "rules" && (
                <>
                  <div className="mode-cards">
                    {[
                      {
                        name: "規則模式",
                        icon: Workflow,
                        desc: "聰明分流，各走其路。",
                      },
                      {
                        name: "全域模式",
                        icon: Globe2,
                        desc: "所有流量，同一個目的地。",
                      },
                      {
                        name: "直接連線",
                        icon: ArrowUpRight,
                        desc: "透過本機網路，直接抵達。",
                      },
                    ].map((m) => (
                      <button
                        className={`mode-card ${mode === m.name ? "active" : ""}`}
                        key={m.name}
                        onClick={() => setMode(m.name)}
                      >
                        <m.icon size={23} />
                        <strong>{m.name}</strong>
                        <p>{m.desc}</p>
                        <span className="radio">
                          {mode === m.name && <span />}
                        </span>
                      </button>
                    ))}
                  </div>
                  <section className="content-panel rule-panel">
                    <div className="section-title">
                      <h2>
                        分流規則 <span className="count">{rules.length}</span>
                      </h2>
                      <span className="muted">由上至下依序比對</span>
                    </div>
                    <div className="searchbox">
                      <Search size={18} />
                      <input
                        aria-label="搜尋規則"
                        placeholder="搜尋名稱、網域或規則類型"
                        value={ruleQuery}
                        onChange={(e) => setRuleQuery(e.target.value)}
                      />
                    </div>
                    <div className="rules-list">
                      <div className="rule-table-head">
                        <span>規則名稱 / 比對方式</span>
                        <span>路由策略</span>
                        <span />
                      </div>
                      {rules
                        .filter((r) =>
                          (r.name + r.match + r.type)
                            .toLowerCase()
                            .includes(ruleQuery.toLowerCase()),
                        )
                        .map((r, i) => (
                          <div className="rule-row" key={r.id}>
                            <span className="rule-index">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <strong>{r.name}</strong>
                              <small>{r.match}</small>
                            </div>
                            <span
                              className={`route-tag ${r.target === "直接連線" ? "direct" : ""}`}
                            >
                              {r.target}
                            </span>
                            {r.type === "自訂" ? (
                              <button
                                className="icon-button"
                                aria-label={`刪除${r.name}`}
                                onClick={() =>
                                  setRules((rs) =>
                                    rs.filter((x) => x.id !== r.id),
                                  )
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span className="system-label">系統</span>
                            )}
                          </div>
                        ))}
                      {rules.filter((r) =>
                        (r.name + r.match + r.type)
                          .toLowerCase()
                          .includes(ruleQuery.toLowerCase()),
                      ).length === 0 && (
                        <p className="empty">沒有符合的規則。</p>
                      )}
                    </div>
                  </section>
                </>
              )}
              {page === "subscriptions" && (
                <>
                  <section className="subscription-hero">
                    <div>
                      <span className="light-badge">
                        <span className="dot" />
                        使用中
                      </span>
                      <h2>{subscription}</h2>
                      <p>讓世界，離你更近一點。</p>
                      <div className="quota">
                        <strong>
                          168.4<span>GB 剩餘</span>
                        </strong>
                        <span>共 200 GB</span>
                      </div>
                      <div className="quota-bar">
                        <i />
                      </div>
                      <div className="quota-labels">
                        <span>已使用 31.6 GB</span>
                        <span>2026 / 11 / 01 重設</span>
                      </div>
                    </div>
                    <div className="subscription-art">
                      <Globe2 size={160} strokeWidth={0.7} />
                      <span className="orbit-dot" />
                      <span className="orbit-dot two" />
                    </div>
                  </section>
                  <section className="content-panel subscriptions-list">
                    <div className="section-title">
                      <h2>
                        我的訂閱{" "}
                        <span className="count">{2 + extraSubs.length}</span>
                      </h2>
                      <button
                        className="text-button"
                        disabled={refreshing}
                        onClick={() => {
                          setRefreshing(true);
                          timer.current = setTimeout(() => {
                            setRefreshing(false);
                            setLastUpdate("剛剛");
                            say("訂閱資訊已重新整理");
                          }, 700);
                        }}
                      >
                        <RefreshCw
                          size={15}
                          className={refreshing ? "spin" : ""}
                        />
                        {refreshing ? "重新整理中" : "全部重新整理"}
                      </button>
                    </div>
                    {["Ark VPN Global", "日常備用", ...extraSubs].map(
                      (name, i) => (
                        <div className="subscription-row" key={name}>
                          <span
                            className={`subscription-icon ${i === 1 ? "peach" : ""}`}
                          >
                            <Layers3 size={23} />
                          </span>
                          <div className="sub-copy">
                            <strong>
                              {name}
                              {subscription === name && (
                                <span className="tag">使用中</span>
                              )}
                            </strong>
                            <small>
                              {i === 0
                                ? "9 個位置 · 每日自動更新"
                                : i === 1
                                  ? "6 個位置 · 手動更新"
                                  : "本機設定檔 · 手動更新"}
                            </small>
                          </div>
                          <span className="sub-updated">{lastUpdate}</span>
                          <button
                            className={
                              subscription === name
                                ? "secondary-button selected-sub"
                                : "secondary-button"
                            }
                            onClick={() => {
                              setSubscription(name);
                              say(`已切換至 ${name}`);
                            }}
                            disabled={subscription === name}
                          >
                            {subscription === name ? (
                              <>
                                <Check size={14} />
                                已選取
                              </>
                            ) : (
                              "使用訂閱"
                            )}
                          </button>
                        </div>
                      ),
                    )}
                  </section>
                </>
              )}
              {page === "settings" && (
                <div className="settings-layout">
                  <section className="content-panel">
                    <div className="section-title">
                      <h2>一般設定</h2>
                      <Settings2 size={19} />
                    </div>
                    {(
                      [
                        {
                          key: "startup",
                          title: "登入時啟動 Ark VPN",
                          desc: "每次開機，都準備好出發。",
                        },
                        {
                          key: "auto",
                          title: "記住上次連線位置",
                          desc: "下次開啟時，回到熟悉的目的地。",
                        },
                        {
                          key: "system",
                          title: "系統代理",
                          desc: "將系統網路請求交給 Ark VPN。",
                        },
                        {
                          key: "tun",
                          title: "TUN 模式",
                          desc: "使用虛擬網路介面接管裝置流量。",
                        },
                        {
                          key: "ipv6",
                          title: "IPv6 支援",
                          desc: "允許 IPv6 位址解析與路由。",
                        },
                        {
                          key: "lan",
                          title: "允許區域網路連線",
                          desc: "讓同一網路中的裝置使用代理。",
                        },
                      ] as const
                    ).map((s) => (
                      <div className="setting-line large" key={s.key}>
                        <div>
                          <strong>{s.title}</strong>
                          <small>{s.desc}</small>
                        </div>
                        <Toggle
                          value={settings[s.key]}
                          onChange={() => switchSetting(s.key)}
                          label={s.title}
                        />
                      </div>
                    ))}
                    <div className="setting-line large">
                      <div>
                        <strong>語言</strong>
                        <small>讓每個細節，都容易理解。</small>
                      </div>
                      <span className="value-pill">繁體中文</span>
                    </div>
                  </section>
                  <aside className="settings-note">
                    <span className="round-icon">
                      <ShieldCheck size={27} />
                    </span>
                    <h2>
                      簡單一點，
                      <br />
                      自在一點。
                    </h2>
                    <p>
                      好的連線，應該融入生活。
                      <br />
                      把偏好設定好，剩下的時間，
                      <br />
                      留給真正重要的事。
                    </p>
                    <div className="note-line" />
                    <span>ARK VPN · YOUR EVERYDAY COMPANION</span>
                  </aside>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(false)}>
          <section
            className="modal location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">WHERE TO NEXT?</p>
                <h2 id="picker-title">選擇連線位置</h2>
              </div>
              <button
                className="icon-button"
                aria-label="關閉位置選擇"
                onClick={() => setPicker(false)}
              >
                <X size={21} />
              </button>
            </div>
            {locationList}
          </section>
        </div>
      )}
      {addRule && (
        <div className="modal-backdrop" onClick={() => setAddRule(false)}>
          <form
            className="modal form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setRules((rs) => [
                {
                  id: Date.now(),
                  name: ruleName.trim(),
                  match: `DOMAIN-SUFFIX · ${ruleDomain.trim()}`,
                  target: "代理連線",
                  type: "自訂",
                },
                ...rs,
              ]);
              setRuleName("");
              setRuleDomain("");
              setAddRule(false);
              say("已加入分流規則");
            }}
          >
            <div className="modal-heading">
              <h2 id="rule-title">新增分流規則</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="關閉新增規則"
                onClick={() => setAddRule(false)}
              >
                <X size={20} />
              </button>
            </div>
            <label>
              規則名稱
              <input
                required
                maxLength={40}
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="例如：工作空間"
              />
            </label>
            <label>
              網域後綴
              <input
                required
                pattern="[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
                value={ruleDomain}
                onChange={(e) => setRuleDomain(e.target.value)}
                placeholder="example.com"
              />
            </label>
            <p className="field-help">
              符合此網域及其子網域的流量將使用代理連線。
            </p>
            <button
              className="primary-button full"
              disabled={!ruleName.trim() || !ruleDomain.trim()}
            >
              加入規則
            </button>
          </form>
        </div>
      )}
      {subModal && (
        <div className="modal-backdrop" onClick={() => setSubModal(false)}>
          <form
            className="modal form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sub-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const name = subName.trim();
              if (["Ark VPN Global", "日常備用", ...extraSubs].includes(name)) {
                say("此訂閱名稱已存在");
                return;
              }
              setExtraSubs((s) => [...s, name]);
              setSubName("");
              setSubModal(false);
              say("已新增訂閱");
            }}
          >
            <div className="modal-heading">
              <h2 id="sub-title">新增訂閱</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="關閉新增訂閱"
                onClick={() => setSubModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <label>
              訂閱名稱
              <input
                required
                maxLength={40}
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="為這段旅程取個名字"
              />
            </label>
            <label>
              訂閱網址
              <input
                type="url"
                required
                placeholder="https://example.com/subscribe"
              />
            </label>
            <button className="primary-button full" disabled={!subName.trim()}>
              加入訂閱
            </button>
          </form>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2 id="help-title">從這裡，輕鬆出發。</h2>
              <button
                className="icon-button"
                aria-label="關閉使用指南"
                onClick={() => setHelp(false)}
              >
                <X size={20} />
              </button>
            </div>
            <ol className="guide">
              <li>
                <strong>選一個位置</strong>
                <p>依據距離與回應時間，找到喜歡的目的地。</p>
              </li>
              <li>
                <strong>選擇流量模式</strong>
                <p>規則模式智慧分流，全域模式統一路由。</p>
              </li>
              <li>
                <strong>整理你的日常</strong>
                <p>將常用位置加入最愛，集中管理訂閱與偏好。</p>
              </li>
            </ol>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
export default App;
