// Centralized CMS store for the admin backend. localStorage-persisted, mock data
// designed to feel like a real ecommerce ops system. Seeded from products.ts on
// first load. Frontend still reads products.ts directly; CMS data is admin-only
// except for PromoBar and first-order discount (consumed where applicable).

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { products as seedProducts, shapes, categories as seedCategories } from "./products";

const KEY = "miravue_cms_v1";

// ── Types ───────────────────────────────────────────────────────────────────
export type CMSProductStatus = "draft" | "published" | "unpublished";
export type CMSNewOverride = "auto" | "force-in" | "force-out";

export type CMSVariant = {
  color: string;
  hex: string;
  images: string[]; // URLs
};

export type CMSProduct = {
  id: string;
  name: string;        // 中文/前台显示名
  nameEn: string;      // 英文名
  subtitle: string;    // 副标题/短卖点
  sku: string;
  status: CMSProductStatus;
  price: number;       // 售价 USD
  cost: number;        // 成本 USD
  originalPrice?: number;
  joinSitePromo: boolean;
  publishedAt: number; // 上架时间
  sortOrder: number;   // 排序权重 越小越前
  featured: boolean;   // 推荐
  hot: boolean;        // 热卖
  newOverride: CMSNewOverride; // 手动新品标记
  material: string;
  shape: string;
  faceShape: string[]; // 适合脸型
  styleTags: string[];
  description: string;
  bullets: string[];   // 卖点
  dims: { frameWidth: number; lensWidth: number; lensHeight: number; bridge: number; temple: number; weight: string };
  variants: CMSVariant[];
  categoryIds: string[];
  seoTitle: string;
  seoDesc: string;
};

export type CMSCategoryType = "main" | "gender" | "shape" | "series" | "campaign" | "hidden";
export type CMSCategory = {
  id: string;
  name: string;
  nameEn: string;
  type: CMSCategoryType;
  slug: string;
  image: string;
  sortOrder: number;
  showInNav: boolean;
  showOnHome: boolean;
  enabled: boolean;
};

export type CMSReview = {
  id: string;
  productId: string;
  user: string;
  country: string;
  stars: number;
  body: string;
  images: string[];
  publishedAt: number;
  visible: boolean;
  sortOrder: number;
  featured: boolean;
};

export type CMSPromotionType = "first-order" | "second-half" | "sitewide";
export type CMSPromotion = {
  id: string;
  type: CMSPromotionType;
  title: string;
  frontCopy: string;
  percent: number;
  enabled: boolean;
  priority: number;
  startAt?: number;
  endAt?: number;
};

export type CMSHero = {
  id: string;
  desktopImage: string;
  mobileImage: string;
  title: string;
  subtitle: string;
  btn1Text: string;
  btn1Link: string;
  btn2Text: string;
  btn2Link: string;
  sortOrder: number;
  active: boolean;
  startAt?: number;
  endAt?: number;
};
export type CMSHomeCard = {
  id: string;
  image: string;
  title: string;
  link: string;
  sortOrder: number;
  active: boolean;
};
export type CMSShapeBanner = {
  id: string;
  shape: string;
  image: string;
  link: string;
  sortOrder: number;
  active: boolean;
};
export type CMSPromoBar = {
  text: string;
  link: string;
  active: boolean;
};

export type CMSAssetKind = "hero-desktop" | "hero-mobile" | "category" | "shape" | "product" | "pdp" | "review";
export type CMSAsset = {
  id: string;
  kind: CMSAssetKind;
  url: string;
  uploadedAt: number;
  note?: string;
};

export const ASSET_DIMS: Record<CMSAssetKind, { label: string; w: number; h: number }> = {
  "hero-desktop": { label: "首页 Hero (桌面)", w: 1920, h: 760 },
  "hero-mobile":  { label: "首页 Hero (移动)", w: 900, h: 1200 },
  category:       { label: "分类卡片", w: 800, h: 1000 },
  shape:          { label: "镜型 Banner", w: 900, h: 520 },
  product:        { label: "商品主图", w: 1200, h: 1200 },
  pdp:            { label: "PDP 详情图", w: 1600, h: 1600 },
  review:         { label: "评价图片", w: 800, h: 800 },
};

export type CMSSettings = {
  newArrivalDays: number;
  defaultSort: "sort" | "publishedAt" | "price-asc" | "price-desc" | "hot" | "featured" | "new";
};

export type CMSAILog = {
  id: string;
  instruction: string;
  source: "text" | "csv";
  preview: string;
  createdAt: number;
  appliedAt: number | null;
  rolledBackAt: number | null;
};

export const CMS_SCHEMA_VERSION = 2;

export type CMSState = {
  schemaVersion: number;
  products: CMSProduct[];
  categories: CMSCategory[];
  reviews: CMSReview[];
  promotions: CMSPromotion[];
  heroes: CMSHero[];
  homeCards: CMSHomeCard[];
  shapeBanners: CMSShapeBanner[];
  promoBar: CMSPromoBar;
  assets: CMSAsset[];
  settings: CMSSettings;
  aiLogs: CMSAILog[];
};

// ── Seed ────────────────────────────────────────────────────────────────────
function uid(prefix = "id") { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }
function seededId(prefix: string, index: number) { return `${prefix}-${index + 1}`; }

const SERVER_SEED_NOW = Date.UTC(2026, 0, 1);

function seed(now = SERVER_SEED_NOW): CMSState {
  const cats: CMSCategory[] = [
    { id: "cat-all",   name: "全部眼镜",   nameEn: "All Eyeglasses",     type: "main",     slug: "all",                 image: "", sortOrder: 10, showInNav: true,  showOnHome: false, enabled: true },
    { id: "cat-wom",   name: "女款光学镜", nameEn: "Women's Eyeglasses", type: "gender",   slug: "women-eyeglasses",    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800", sortOrder: 20, showInNav: true,  showOnHome: true,  enabled: true },
    { id: "cat-men",   name: "男款光学镜", nameEn: "Men's Eyeglasses",   type: "gender",   slug: "men-eyeglasses",      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800", sortOrder: 30, showInNav: true,  showOnHome: true,  enabled: true },
    { id: "cat-sun",   name: "太阳镜",     nameEn: "Sunglasses",         type: "main",     slug: "sunglasses",          image: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800", sortOrder: 40, showInNav: true,  showOnHome: true,  enabled: true },
    { id: "cat-best",  name: "热销榜",     nameEn: "Best Sellers",       type: "campaign", slug: "best-sellers",        image: "", sortOrder: 50, showInNav: false, showOnHome: true,  enabled: true },
    { id: "cat-new",   name: "新品上架",   nameEn: "New Arrivals",       type: "campaign", slug: "new-arrivals",        image: "", sortOrder: 60, showInNav: false, showOnHome: true,  enabled: true },
    ...shapes.map((s, i) => ({
      id: `cat-shape-${s.toLowerCase().replace(/\s+/g, "-")}`,
      name: ({ Aviator: "飞行员", "Cat eye": "猫眼", Rectangle: "矩形", Square: "方框", Round: "圆框", Geometric: "几何", Butterfly: "蝶形", Oval: "椭圆" } as Record<string, string>)[s] ?? s,
      nameEn: s,
      type: "shape" as const,
      slug: `shape-${s.toLowerCase().replace(/\s+/g, "-")}`,
      image: "",
      sortOrder: 100 + i,
      showInNav: false,
      showOnHome: false,
      enabled: true,
    })),
    ...["Bold", "Dark", "Daily", "El Dorado"].map((c, i) => ({
      id: `cat-series-${c.toLowerCase().replace(/\s+/g, "-")}`,
      name: ({ Bold: "大胆系列", Dark: "黑色系列", Daily: "日常系列", "El Dorado": "黄金系列" } as Record<string, string>)[c] ?? c,
      nameEn: c,
      type: "series" as const,
      slug: `series-${c.toLowerCase().replace(/\s+/g, "-")}`,
      image: "",
      sortOrder: 200 + i,
      showInNav: false,
      showOnHome: false,
      enabled: true,
    })),
  ];

  const products: CMSProduct[] = seedProducts.map((p, i) => {
    const catIds: string[] = ["cat-all"];
    if (p.gender === "Women") catIds.push("cat-wom");
    if (p.gender === "Men") catIds.push("cat-men");
    if (p.gender === "Unisex") { catIds.push("cat-wom", "cat-men"); }
    const sCat = `cat-shape-${p.shape.toLowerCase().replace(/\s+/g, "-")}`;
    catIds.push(sCat);
    const seCat = `cat-series-${p.collection.toLowerCase().replace(/\s+/g, "-")}`;
    catIds.push(seCat);
    if (p.badge === "BESTSELLER" || i < 4) catIds.push("cat-best");
    // published within last 0~40 days for new-arrival logic
    const publishedAt = now - i * 4 * 86400_000;
    return {
      id: p.id,
      name: ({ "Jace": "杰斯", "Perkins": "帕金斯", "Denzel": "丹泽尔", "Athina": "雅典娜", "Dardhan": "达尔丹", "Mira": "米拉", "Orion": "猎户座", "Luna": "露娜", "Kai": "凯", "Noir": "诺瓦", "Soleil": "索莱", "Vera": "薇拉" } as Record<string, string>)[p.name] ?? p.name,
      nameEn: p.name,
      subtitle: p.descriptor,
      sku: p.modelCode,
      status: "published" as const,
      price: p.price,
      cost: Math.round(p.price * 0.35 * 100) / 100,
      originalPrice: p.originalPrice,
      joinSitePromo: true,
      publishedAt,
      sortOrder: (i + 1) * 10,
      featured: p.badge === "BESTSELLER" || i < 3,
      hot: p.badge === "BESTSELLER",
      newOverride: p.badge === "NEW" ? "force-in" : "auto",
      material: p.material,
      shape: p.shape,
      faceShape: p.shape === "Round" || p.shape === "Oval" ? ["方脸", "心形脸"] : ["圆脸", "椭圆脸"],
      styleTags: [p.collection, p.gender],
      description: `${p.name} 是 ${p.collection} 系列中的 ${p.shape} 款，采用 ${p.material} 材质打造，适合日常通勤与休闲场合佩戴。`,
      bullets: [
        `${p.material} 材质，重量仅 ${p.weight}`,
        `${p.dims.frameWidth}mm 框宽，适合中等脸型`,
        "意大利设计，亚洲面部贴合优化",
        "支持渐进/防蓝光/变色等多种镜片",
      ],
      dims: { ...p.dims, weight: p.weight },
      variants: p.colors.map((c, j) => ({
        color: c.name,
        hex: c.hex,
        images: [
          // mock 3 images per variant
          `https://images.unsplash.com/photo-${["1577803645773-f96470509666", "1574258495973-f010dfbb5371", "1612817159949-195b6eb9e31a"][j % 3]}?w=1200&q=80&fit=crop`,
          `https://images.unsplash.com/photo-${["1556306535-0f09a537f0a3", "1508296695146-257a814070b4", "1551803091-e20673f15770"][j % 3]}?w=1200&q=80&fit=crop`,
        ],
      })),
      categoryIds: catIds,
      seoTitle: `${p.name} — ${p.descriptor} | MIRAVUE`,
      seoDesc: `Shop ${p.name} ${p.shape.toLowerCase()} eyeglasses. ${p.descriptor}. Free shipping over $75.`,
    };
  });

  const reviews: CMSReview[] = products.flatMap((p, i) => ([
    { id: seededId("rv", i * 2), productId: p.id, user: ["A. Müller", "J. Roberts", "S. Tanaka"][i % 3], country: ["DE", "US", "JP"][i % 3], stars: 5, body: "镜框很轻，戴一整天也不累，色差和图片几乎一致。", images: [], publishedAt: now - 86400_000 * (i + 1), visible: true, sortOrder: 10, featured: true },
    { id: seededId("rv", i * 2 + 1), productId: p.id, user: ["E. Davis", "L. Schmidt", "M. Chen"][i % 3], country: ["UK", "DE", "CA"][i % 3], stars: 4, body: "整体很好，物流稍微慢了几天。", images: [], publishedAt: now - 86400_000 * (i + 3), visible: true, sortOrder: 20, featured: false },
  ]));

  return {
    schemaVersion: CMS_SCHEMA_VERSION,
    products,
    categories: cats,
    reviews,
    promotions: [
      { id: "promo-first-order", type: "first-order",   title: "首单 15% 折扣", frontCopy: "新客首单自动享 15% 折扣 · 无需优惠码", percent: 15, enabled: true,  priority: 100, startAt: now - 86400_000 * 30, endAt: now + 86400_000 * 60 },
      { id: "promo-second-half", type: "second-half",   title: "第二副半价",      frontCopy: "购买两副镜框 · 第二副自动半价",       percent: 50, enabled: false, priority: 80 },
      { id: "promo-sitewide", type: "sitewide",      title: "全站满减",        frontCopy: "全站满 $80 自动减 $10",                 percent: 12, enabled: false, priority: 60 },
    ],
    heroes: [
      { id: "hero-home", desktopImage: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1920&q=80", mobileImage: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=900&q=80", title: "DESIGNED IN ITALY", subtitle: "Architectural acetate, hand-finished frames.", btn1Text: "Shop Eyeglasses", btn1Link: "/category/all", btn2Text: "Shop Sunglasses", btn2Link: "/category/sunglasses", sortOrder: 10, active: true },
    ],
    homeCards: [
      { id: "hc-women", image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800", title: "Women", link: "/category/women-eyeglasses", sortOrder: 10, active: true },
      { id: "hc-men", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800", title: "Men", link: "/category/men-eyeglasses", sortOrder: 20, active: true },
      { id: "hc-women-sun", image: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800", title: "Women Sun", link: "/category/sunglasses", sortOrder: 30, active: true },
      { id: "hc-men-sun", image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800", title: "Men Sun", link: "/category/sunglasses", sortOrder: 40, active: true },
    ],
    shapeBanners: shapes.map((s, i) => ({
      id: seededId("sb", i),
      shape: s,
      image: "",
      link: `/category/all?shape=${encodeURIComponent(s)}`,
      sortOrder: 10 + i * 10,
      active: true,
    })),
    promoBar: { text: "First pair 15% off · Free shipping over $75", link: "/", active: true },
    assets: [],
    settings: { newArrivalDays: 30, defaultSort: "sort" },
    aiLogs: [
      { id: uid("ai"), instruction: "批量上架春季新品，参考表格", source: "csv", preview: "新增 12 个商品 · 修改 3 个分类排序", createdAt: Date.now() - 3 * 86400_000, appliedAt: Date.now() - 3 * 86400_000 + 60_000, rolledBackAt: null },
      { id: uid("ai"), instruction: "把所有 Bold 系列商品的卖点加上'意大利设计'前缀", source: "text", preview: "修改 4 个商品的 bullets 字段", createdAt: Date.now() - 86400_000, appliedAt: null, rolledBackAt: null },
    ],
  };
}

// ── Store ───────────────────────────────────────────────────────────────────
let state: CMSState = seed();
const listeners = new Set<() => void>();

function migrate(s: CMSState): CMSState {
  const v = s.schemaVersion ?? 1;
  if (v >= CMS_SCHEMA_VERSION) return s;
  // v1 -> v2: replace legacy promo bar copy
  if (s.promoBar && s.promoBar.text === "FREE SHIPPING OVER $75 · USE CODE") {
    s.promoBar = { ...s.promoBar, text: "First pair 15% off · Free shipping over $75" };
  }
  s.schemaVersion = CMS_SCHEMA_VERSION;
  return s;
}

function load(): CMSState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed(Date.now());
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as CMSState;
    const migrated = migrate(parsed);
    if ((parsed.schemaVersion ?? 1) < CMS_SCHEMA_VERSION) {
      try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch { /* noop */ }
    }
    return migrated;
  } catch {
    return seed();
  }
}

function save() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* noop */ }
}

function emit() {
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCMS<T>(selector: (s: CMSState) => T): T {
  useEffect(() => {
    state = load();
    listeners.forEach((l) => l());
  }, []);
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// Sync snapshot for non-React consumers (storefront-cms bridge).
export function cmsSnapshot(): CMSState { return state; }

// ── Derived helpers ─────────────────────────────────────────────────────────
export function isNewArrival(p: CMSProduct, days = state.settings.newArrivalDays) {
  if (p.newOverride === "force-in") return true;
  if (p.newOverride === "force-out") return false;
  return (Date.now() - p.publishedAt) / 86400_000 <= days;
}

export function productCount(catId: string) {
  return state.products.filter((p) => p.categoryIds.includes(catId)).length;
}

export function activePromotion(): CMSPromotion | null {
  const enabled = state.promotions.filter((p) => p.enabled);
  if (enabled.length === 0) return null;
  return [...enabled].sort((a, b) => b.priority - a.priority)[0];
}

// ── Mutations (cms namespace) ───────────────────────────────────────────────
function mutate(fn: (s: CMSState) => void) {
  fn(state);
  state = { ...state };
  emit();
}

export const cms = {
  // products
  upsertProduct(p: CMSProduct) {
    mutate((s) => {
      const i = s.products.findIndex((x) => x.id === p.id);
      if (i >= 0) s.products[i] = p; else s.products.unshift(p);
    });
  },
  createBlankProduct(): CMSProduct {
    const id = uid("p");
    return {
      id, name: "新商品", nameEn: "New Product", subtitle: "", sku: "MV-NEW",
      status: "draft", price: 39, cost: 14, originalPrice: undefined,
      joinSitePromo: true, publishedAt: Date.now(), sortOrder: 999,
      featured: false, hot: false, newOverride: "auto",
      material: "Acetate", shape: "Square", faceShape: [], styleTags: [],
      description: "", bullets: [], dims: { frameWidth: 140, lensWidth: 52, lensHeight: 42, bridge: 18, temple: 145, weight: "22g" },
      variants: [{ color: "Black", hex: "#1a1a1a", images: [""] }],
      categoryIds: [], seoTitle: "", seoDesc: "",
    };
  },
  duplicateProduct(id: string) {
    mutate((s) => {
      const p = s.products.find((x) => x.id === id);
      if (!p) return;
      const c = JSON.parse(JSON.stringify(p)) as CMSProduct;
      c.id = uid("p");
      c.name = p.name + " (副本)";
      c.sku = p.sku + "-COPY";
      c.status = "draft";
      c.sortOrder = p.sortOrder + 1;
      s.products.unshift(c);
    });
  },
  setProductStatus(id: string, status: CMSProductStatus) {
    mutate((s) => { const p = s.products.find((x) => x.id === id); if (p) { p.status = status; if (status === "published" && !p.publishedAt) p.publishedAt = Date.now(); } });
  },
  removeProduct(id: string) { mutate((s) => { s.products = s.products.filter((p) => p.id !== id); }); },

  // categories
  upsertCategory(c: CMSCategory) { mutate((s) => { const i = s.categories.findIndex((x) => x.id === c.id); if (i >= 0) s.categories[i] = c; else s.categories.unshift(c); }); },
  removeCategory(id: string) { mutate((s) => { s.categories = s.categories.filter((c) => c.id !== id); }); },
  createBlankCategory(): CMSCategory { return { id: uid("cat"), name: "新分类", nameEn: "New", type: "main", slug: "new", image: "", sortOrder: 999, showInNav: false, showOnHome: false, enabled: true }; },

  // reviews
  upsertReview(r: CMSReview) { mutate((s) => { const i = s.reviews.findIndex((x) => x.id === r.id); if (i >= 0) s.reviews[i] = r; else s.reviews.unshift(r); }); },
  removeReview(id: string) { mutate((s) => { s.reviews = s.reviews.filter((r) => r.id !== id); }); },
  generateStarterReviews(productId: string) {
    mutate((s) => {
      const samples = [
        { user: "J. Wilson", country: "US", stars: 5, body: "Fits perfectly, lightweight and the color is exactly as shown." },
        { user: "M. Klein", country: "DE", stars: 5, body: "Great build quality, came with a nice case and cloth." },
        { user: "T. Nakamura", country: "JP", stars: 4, body: "Looks premium. Bridge feels slightly narrow for my nose but still wearable." },
      ];
      for (const sm of samples) {
        s.reviews.unshift({ id: uid("rv"), productId, ...sm, images: [], publishedAt: Date.now(), visible: true, sortOrder: 10, featured: false });
      }
    });
  },

  // promotions
  upsertPromotion(p: CMSPromotion) { mutate((s) => { const i = s.promotions.findIndex((x) => x.id === p.id); if (i >= 0) s.promotions[i] = p; else s.promotions.unshift(p); }); },

  // home cms
  upsertHero(h: CMSHero) { mutate((s) => { const i = s.heroes.findIndex((x) => x.id === h.id); if (i >= 0) s.heroes[i] = h; else s.heroes.unshift(h); }); },
  removeHero(id: string) { mutate((s) => { s.heroes = s.heroes.filter((h) => h.id !== id); }); },
  createBlankHero(): CMSHero { return { id: uid("hero"), desktopImage: "", mobileImage: "", title: "", subtitle: "", btn1Text: "", btn1Link: "/", btn2Text: "", btn2Link: "/", sortOrder: 999, active: true }; },

  upsertHomeCard(c: CMSHomeCard) { mutate((s) => { const i = s.homeCards.findIndex((x) => x.id === c.id); if (i >= 0) s.homeCards[i] = c; else s.homeCards.unshift(c); }); },
  removeHomeCard(id: string) { mutate((s) => { s.homeCards = s.homeCards.filter((c) => c.id !== id); }); },
  createBlankHomeCard(): CMSHomeCard { return { id: uid("hc"), image: "", title: "", link: "/", sortOrder: 999, active: true }; },

  upsertShapeBanner(b: CMSShapeBanner) { mutate((s) => { const i = s.shapeBanners.findIndex((x) => x.id === b.id); if (i >= 0) s.shapeBanners[i] = b; else s.shapeBanners.unshift(b); }); },
  removeShapeBanner(id: string) { mutate((s) => { s.shapeBanners = s.shapeBanners.filter((b) => b.id !== id); }); },

  setPromoBar(b: CMSPromoBar) { mutate((s) => { s.promoBar = b; }); },

  // assets
  addAsset(kind: CMSAssetKind, url: string, note?: string) { mutate((s) => { s.assets.unshift({ id: uid("img"), kind, url, uploadedAt: Date.now(), note }); }); },
  removeAsset(id: string) { mutate((s) => { s.assets = s.assets.filter((a) => a.id !== id); }); },

  // settings
  setSettings(p: Partial<CMSSettings>) { mutate((s) => { s.settings = { ...s.settings, ...p }; }); },

  // AI
  addAILog(l: Omit<CMSAILog, "id" | "createdAt" | "appliedAt" | "rolledBackAt"> & Partial<Pick<CMSAILog, "appliedAt">>) { mutate((s) => { s.aiLogs.unshift({ id: uid("ai"), createdAt: Date.now(), appliedAt: l.appliedAt ?? null, rolledBackAt: null, instruction: l.instruction, source: l.source, preview: l.preview }); }); },
  applyAILog(id: string) { mutate((s) => { const l = s.aiLogs.find((x) => x.id === id); if (l) l.appliedAt = Date.now(); }); },
  rollbackAILog(id: string) { mutate((s) => { const l = s.aiLogs.find((x) => x.id === id); if (l) l.rolledBackAt = Date.now(); }); },

  // reset
  resetAll() { mutate((s) => { Object.assign(s, seed()); }); },
};

// Expose categories with derived counts
export function useCategoriesWithCounts() {
  const categories = useCMS((s) => s.categories);
  const products = useCMS((s) => s.products);
  return useMemo(
    () => categories.map((c) => ({ ...c, productCount: products.filter((p) => p.categoryIds.includes(c.id)).length })),
    [categories, products],
  );
}

// Re-export seed for tests
export { seedCategories };
