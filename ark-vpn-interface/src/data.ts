export type Region = "亞洲" | "歐洲" | "美洲";
export interface Location {
  id: string;
  country: string;
  city: string;
  english: string;
  code: string;
  ping: number;
  region: Region;
  tag?: string;
}
export const locations: Location[] = [
  {
    id: "jp-tokyo",
    country: "日本",
    city: "東京",
    english: "Japan · Tokyo",
    code: "jp",
    ping: 32,
    region: "亞洲",
    tag: "推薦",
  },
  {
    id: "tw-taipei",
    country: "台灣",
    city: "台北",
    english: "Taiwan · Taipei",
    code: "tw",
    ping: 18,
    region: "亞洲",
  },
  {
    id: "hk-central",
    country: "香港",
    city: "中環",
    english: "Hong Kong · Central",
    code: "hk",
    ping: 26,
    region: "亞洲",
  },
  {
    id: "sg-marina",
    country: "新加坡",
    city: "濱海灣",
    english: "Singapore · Marina Bay",
    code: "sg",
    ping: 54,
    region: "亞洲",
  },
  {
    id: "jp-osaka",
    country: "日本",
    city: "大阪",
    english: "Japan · Osaka",
    code: "jp",
    ping: 39,
    region: "亞洲",
  },
  {
    id: "kr-seoul",
    country: "韓國",
    city: "首爾",
    english: "South Korea · Seoul",
    code: "kr",
    ping: 46,
    region: "亞洲",
  },
  {
    id: "us-la",
    country: "美國",
    city: "洛杉磯",
    english: "United States · Los Angeles",
    code: "us",
    ping: 142,
    region: "美洲",
  },
  {
    id: "uk-london",
    country: "英國",
    city: "倫敦",
    english: "United Kingdom · London",
    code: "uk",
    ping: 186,
    region: "歐洲",
  },
  {
    id: "de-frankfurt",
    country: "德國",
    city: "法蘭克福",
    english: "Germany · Frankfurt",
    code: "de",
    ping: 178,
    region: "歐洲",
  },
];
export const initialRules = [
  {
    id: 1,
    name: "私人網路",
    match: "GEOIP · LAN",
    target: "直接連線",
    type: "系統",
  },
  {
    id: 2,
    name: "本地服務",
    match: "GEOSITE · cn",
    target: "直接連線",
    type: "系統",
  },
  {
    id: 3,
    name: "影音串流",
    match: "GEOSITE · streaming",
    target: "自動選擇",
    type: "自訂",
  },
  {
    id: 4,
    name: "全球網路",
    match: "GEOSITE · geolocation-!cn",
    target: "代理連線",
    type: "系統",
  },
  { id: 5, name: "其他流量", match: "MATCH", target: "代理連線", type: "系統" },
];
