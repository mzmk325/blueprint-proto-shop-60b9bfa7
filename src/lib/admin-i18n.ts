// Chinese labels for the operations backend. Frontend still uses the
// English STATUS_META / FULFILLMENT_LABEL from cart-store.ts.
import type { OrderStatus, FulfillmentType, PrescriptionStatus } from "./cart-store";

export const STATUS_LABEL_ZH: Record<OrderStatus, string> = {
  paid: "已付款",
  "rx-pending": "处方待审",
  "rx-clarification": "等待客户回复",
  "rx-approved": "处方已通过",
  sourcing: "采购中",
  "sent-to-lab": "已寄本地工坊",
  "in-production": "镜片加工中",
  qc: "质检中",
  "ready-to-ship": "待发货",
  shipped: "已发货",
  delivered: "已送达",
  "after-sale": "售后处理中",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  paid: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  "rx-pending": "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  "rx-clarification": "bg-red-500/15 text-red-800 dark:text-red-200",
  "rx-approved": "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  sourcing: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  "sent-to-lab": "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200",
  "in-production": "bg-purple-500/15 text-purple-800 dark:text-purple-200",
  qc: "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200",
  "ready-to-ship": "bg-teal-500/15 text-teal-800 dark:text-teal-200",
  shipped: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200",
  delivered: "bg-green-500/15 text-green-800 dark:text-green-200",
  "after-sale": "bg-orange-500/15 text-orange-800 dark:text-orange-200",
};

export const FULFILLMENT_LABEL_ZH: Record<FulfillmentType, string> = {
  "frame-only": "仅镜框",
  "non-rx": "平光镜片",
  prescription: "处方镜片",
};

export const FT_BADGE_TONE: Record<FulfillmentType, string> = {
  "frame-only": "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  "non-rx": "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  prescription: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
};

export const RX_STATUS_ZH: Record<PrescriptionStatus, string> = {
  none: "无需处方",
  pending: "待人工复核",
  uploaded: "已上传 — 待复核",
  "pd-unknown": "PD 未知 — 待复核",
  "prism-review": "含棱镜 — 待复核",
  clarification: "需客户澄清",
};

// Risk message translation (substring match)
const RISK_MAP: [RegExp, string][] = [
  [/PD missing/i, "PD 缺失"],
  [/PD/i, "PD 信息"],
  [/Axis/i, "缺少 AXIS 轴位"],
  [/Prism/i, "含棱镜，需人工复核"],
  [/address/i, "收货地址不完整"],
  [/Tracking number missing/i, "缺少国际运单号"],
  [/QC photo missing/i, "缺少质检照片"],
  [/QC checklist incomplete/i, "质检清单未完成"],
  [/Sourcing info incomplete/i, "采购信息不完整"],
  [/Margin below target/i, "毛利低于目标"],
  [/Strong prescription/i, "高度数处方，建议升级薄镜片"],
  [/Customer reply needed/i, "需客户回复"],
  [/Shipping delay/i, "物流延迟"],
];

export function translateRisk(msg: string): string {
  for (const [re, zh] of RISK_MAP) if (re.test(msg)) return zh;
  return msg;
}

// Common UI labels
export const L = {
  // nav
  dashboard: "仪表盘",
  orders: "订单管理",
  products: "商品管理",
  categories: "分类管理",
  homeCms: "首页装修",
  assets: "图片素材",
  reviews: "评价管理",
  promotions: "活动/折扣设置",
  langCurrency: "语言与币种",
  rxReview: "处方审核",
  qcWorkbench: "质检工作台",
  shipping: "发货管理",
  afterSales: "售后问题",
  aiConsole: "AI 操作台",
  // common
  search: "搜索",
  filter: "筛选",
  all: "全部",
  new: "新建",
  edit: "编辑",
  duplicate: "复制",
  delete: "删除",
  save: "保存",
  cancel: "取消",
  publish: "上架",
  unpublish: "下架",
  preview: "预览",
  back: "返回",
  enable: "启用",
  disable: "停用",
  enabled: "已启用",
  disabled: "已停用",
  yes: "是",
  no: "否",
  active: "生效中",
  inactive: "未生效",
  status: "状态",
  sortOrder: "排序权重",
  actions: "操作",
  total: "合计",
  apply: "应用",
  reset: "重置",
  confirm: "确认",
  uploadPlaceholder: "（占位）上传图片",
  copyLabel: "复制",
  loading: "加载中…",
  empty: "暂无数据",
};

// Translate the English nextAction() labels from cart-store.ts into Chinese.
// We do not touch the cart-store labels themselves because the storefront
// order detail page and timeline messages stay English-first.
const NEXT_ACTION_MAP: Record<string, string> = {
  "Review prescription":                  "审核处方",
  "Contact customer":                     "联系客户",
  "Start sourcing":                       "开始采购",
  "Start frame & lens sourcing":          "开始采购镜框和镜片",
  "Mark frame ready & ship":              "标记镜框就绪并发货",
  "Send to local lab":                    "寄送本地工坊",
  "Follow up with optical shop":          "跟进镜片加工",
  "Prepare quality check":                "准备质检",
  "Upload QC photo & approve":            "上传质检照片并通过",
  "Create Yanwen label & enter tracking": "创建燕文面单并填写单号",
  "Monitor delivery":                     "监控物流到货",
  "Close order":                          "关单",
  "Resolve after-sale":                   "处理售后",
};
export function translateNextAction(label: string): string {
  return NEXT_ACTION_MAP[label] ?? label;
}

// ──────────────────────────────────────────────────────────────────────────────
// Language & currency presets (preparation only — full i18n in next round)
// Public storefront = English-first; Chinese is hidden internal preview only.
// ──────────────────────────────────────────────────────────────────────────────
export type StorefrontCurrency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "CNY";

export type StorefrontLanguage = {
  code: string;        // e.g. "en-US"
  name: string;        // 中文显示名
  nativeName: string;  // 自身语言显示名
  currency: StorefrontCurrency;
  enabled: boolean;    // 启用此语言
  publicVisible: boolean; // 是否在前台语言选择器显示
  internalPreview?: boolean; // 仅供内部预览
};

export const DEFAULT_LANGUAGES: StorefrontLanguage[] = [
  { code: "en-US", name: "英语（美国）",     nativeName: "English (US)",   currency: "USD", enabled: true,  publicVisible: true },
  { code: "en-GB", name: "英语（英国）",     nativeName: "English (UK)",   currency: "GBP", enabled: true,  publicVisible: true },
  { code: "de-DE", name: "德语",             nativeName: "Deutsch",        currency: "EUR", enabled: true,  publicVisible: true },
  { code: "fr-FR", name: "法语",             nativeName: "Français",       currency: "EUR", enabled: true,  publicVisible: true },
  { code: "es-ES", name: "西班牙语",         nativeName: "Español",        currency: "EUR", enabled: true,  publicVisible: true },
  { code: "it-IT", name: "意大利语",         nativeName: "Italiano",       currency: "EUR", enabled: true,  publicVisible: true },
  { code: "nl-NL", name: "荷兰语",           nativeName: "Nederlands",     currency: "EUR", enabled: true,  publicVisible: true },
  { code: "zh-CN", name: "中文（内部预览）", nativeName: "中文",            currency: "CNY", enabled: true,  publicVisible: false, internalPreview: true },
];

export type RoundingRule = "none" | "nearest-1" | "nearest-0.5" | "psychological-99" | "psychological-95";

export type StorefrontCurrencyConfig = {
  code: StorefrontCurrency;
  symbol: string;
  name: string;
  enabled: boolean;
  baseRate: number;            // 实时汇率占位（vs USD）
  overrideRate?: number;       // 人工覆盖汇率
  rounding: RoundingRule;
};

export const DEFAULT_CURRENCIES: StorefrontCurrencyConfig[] = [
  { code: "USD", symbol: "$",  name: "美元",     enabled: true,  baseRate: 1,     rounding: "psychological-99" },
  { code: "EUR", symbol: "€",  name: "欧元",     enabled: true,  baseRate: 0.92,  rounding: "psychological-99" },
  { code: "GBP", symbol: "£",  name: "英镑",     enabled: true,  baseRate: 0.79,  rounding: "psychological-99" },
  { code: "CAD", symbol: "C$", name: "加拿大元", enabled: true,  baseRate: 1.36,  rounding: "psychological-99" },
  { code: "AUD", symbol: "A$", name: "澳元",     enabled: true,  baseRate: 1.52,  rounding: "psychological-99" },
  { code: "CNY", symbol: "¥",  name: "人民币",   enabled: false, baseRate: 7.2,   rounding: "nearest-1" },
];

export const ROUNDING_LABEL: Record<RoundingRule, string> = {
  none: "不取整",
  "nearest-1": "取整到 1",
  "nearest-0.5": "取整到 0.5",
  "psychological-99": "心理价 .99",
  "psychological-95": "心理价 .95",
};

