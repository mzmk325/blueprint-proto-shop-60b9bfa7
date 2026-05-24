// Centralized CMS store for the admin backend. localStorage-persisted operational
// data for the storefront. Seeded from products.ts on first install; the storefront
// reads from this CMS via storefront-cms bridge (published items only).


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
  id: string;          // DB uuid OR seed legacy id (e.g. "p-jace") before hydration
  slug?: string;       // canonical URL slug (from DB)
  legacyId?: string | null; // legacy text id, for backward-compat redirect
  name: string;        // 中文/前台显示名
  nameEn: string;      // 英文名
  subtitle: string;    // 副标题/短卖点
  sku: string;
  status: CMSProductStatus;
  price: number;       // 售价 USD
  cost: number;        // 成本 USD (admin-only; never sent to public)
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
  description?: string;        // optional rich description (DB-backed)
  descriptionEn?: string;
  isDbBacked?: boolean;        // present in DB (drives admin write-through)
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
  name?: string;
  note?: string;
  storagePath?: string;        // present when uploaded to product-images bucket
  isDbBacked?: boolean;
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

export const CMS_SCHEMA_VERSION = 3;

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
    promoBar: { text: "First pair 15% off · {ship}", link: "/", active: true },
    assets: [],
    settings: { newArrivalDays: 30, defaultSort: "sort" },
    aiLogs: [
      { id: "ai-spring-upload", instruction: "批量上架春季新品，参考表格", source: "csv", preview: "新增 12 个商品 · 修改 3 个分类排序", createdAt: now - 3 * 86400_000, appliedAt: now - 3 * 86400_000 + 60_000, rolledBackAt: null },
      { id: "ai-bold-copy", instruction: "把所有 Bold 系列商品的卖点加上'意大利设计'前缀", source: "text", preview: "修改 4 个商品的 bullets 字段", createdAt: now - 86400_000, appliedAt: null, rolledBackAt: null },
    ],
  };
}

// ── Store ───────────────────────────────────────────────────────────────────
let state: CMSState = seed();
let hydrated = false;
const listeners = new Set<() => void>();

function migrate(s: CMSState): CMSState {
  const v = s.schemaVersion ?? 1;
  if (v >= CMS_SCHEMA_VERSION) return s;
  // v1 -> v2: replace legacy promo bar copy
  if (s.promoBar && s.promoBar.text === "FREE SHIPPING OVER $75 · USE CODE") {
    s.promoBar = { ...s.promoBar, text: "First pair 15% off · {ship}" };
  }
  // v2 -> v3: convert hardcoded "$75" into currency-aware {ship} template
  if (s.promoBar && typeof s.promoBar.text === "string" && /Free shipping over \$75/i.test(s.promoBar.text)) {
    s.promoBar = { ...s.promoBar, text: s.promoBar.text.replace(/Free shipping over \$75/gi, "{ship}") };
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

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());
}

export function useCMS<T>(selector: (s: CMSState) => T): T {
  useEffect(() => { hydrate(); }, []);
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

// Find every place an image URL is currently used. Returns a list of human-readable
// references so the operator can see why a delete is blocked.
export type AssetUsage = { kind: string; label: string; id: string };
export function assetUsages(url: string): AssetUsage[] {
  if (!url) return [];
  const out: AssetUsage[] = [];
  for (const p of state.products) {
    p.variants.forEach((v, vi) => {
      if (v.images.includes(url)) out.push({ kind: "product", label: `商品「${p.name}」· ${v.color} 变体`, id: `${p.id}:${vi}` });
    });
  }
  for (const c of state.categories) if (c.image === url) out.push({ kind: "category", label: `分类「${c.name}」封面`, id: c.id });
  for (const h of state.heroes) {
    if (h.desktopImage === url) out.push({ kind: "hero", label: `首页 Hero「${h.title || h.id}」桌面图`, id: h.id });
    if (h.mobileImage === url) out.push({ kind: "hero", label: `首页 Hero「${h.title || h.id}」移动图`, id: h.id });
  }
  for (const c of state.homeCards) if (c.image === url) out.push({ kind: "home-card", label: `首页卡片「${c.title || c.id}」`, id: c.id });
  for (const b of state.shapeBanners) if (b.image === url) out.push({ kind: "shape", label: `镜型 Banner「${b.shape}」`, id: b.id });
  for (const r of state.reviews) if (r.images.includes(url)) out.push({ kind: "review", label: `评价 ${r.user}`, id: r.id });
  return out;
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
  addAsset(kind: CMSAssetKind, url: string, opts?: { name?: string; note?: string }) { mutate((s) => { s.assets.unshift({ id: uid("img"), kind, url, uploadedAt: Date.now(), name: opts?.name, note: opts?.note }); }); },
  updateAsset(id: string, patch: Partial<Pick<CMSAsset, "name" | "note" | "kind">>) { mutate((s) => { const a = s.assets.find((x) => x.id === id); if (a) Object.assign(a, patch); }); },
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

// ════════════════════════════════════════════════════════════════════════════
// DB HYDRATION + WRITE-THROUGH (Phase 2b)
// ════════════════════════════════════════════════════════════════════════════
// The CMS store now treats the DB as source of truth for products, categories,
// variants/images, and assets. Other slices (heroes, home cards, shape banners,
// promo bar, reviews, promotions, AI logs, settings) remain localStorage-only
// until later phases.

import {
  listPublishedCatalog,
  type FullProduct,
  type PublicCategory,
} from "./catalog.functions";
import {
  adminListCatalog,
  upsertProduct as fnUpsertProduct,
  setProductStatus as fnSetProductStatus,
  deleteProduct as fnDeleteProduct,
  setProductCategories as fnSetProductCategories,
  upsertVariants as fnUpsertVariants,
  setProductImages as fnSetProductImages,
  upsertCategory as fnUpsertCategory,
  deleteCategory as fnDeleteCategory,
  createAsset as fnCreateAsset,
  deleteAsset as fnDeleteAsset,
} from "./catalog-admin.functions";

// ── Mapping: DB row → CMS shape ────────────────────────────────────────────

type DbProductRow = FullProduct & {
  cost?: number | null; // present in admin listing
};

function dbProductToCms(p: DbProductRow): CMSProduct {
  // Group images by variant for the CMS variant.images structure.
  const imagesByVariant = new Map<string | null, string[]>();
  // Sort: primary first, then by sort_order.
  const sorted = [...p.images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  for (const im of sorted) {
    const key = im.variant_id ?? null;
    const arr = imagesByVariant.get(key) ?? [];
    arr.push(im.url);
    imagesByVariant.set(key, arr);
  }
  const fallbackImages = imagesByVariant.get(null) ?? [];

  const variants: CMSVariant[] = p.variants.length
    ? p.variants.map((v) => ({
        color: v.name_en,
        hex: v.color_hex ?? "#1a1a1a",
        images: imagesByVariant.get(v.id) ?? fallbackImages,
      }))
    : [{
        color: "Default",
        hex: "#1a1a1a",
        images: fallbackImages,
      }];

  return {
    id: p.id,
    slug: p.slug,
    legacyId: p.legacy_id,
    name: p.name_zh || p.name_en,
    nameEn: p.name_en,
    subtitle: p.descriptor_en ?? "",
    sku: p.variants[0]?.sku ?? "",
    status: p.status,
    price: Number(p.price),
    cost: p.cost != null ? Number(p.cost) : 0,
    originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
    joinSitePromo: true,
    publishedAt: p.published_at ? new Date(p.published_at).getTime() : new Date(p.created_at).getTime(),
    sortOrder: 100,
    featured: !!p.is_featured,
    hot: !!p.is_hot,
    newOverride: p.is_new ? "force-in" : "auto",
    material: p.material ?? "Acetate",
    shape: p.shape ?? "Square",
    faceShape: [],
    styleTags: [],
    description: p.description_en ?? "",
    bullets: (p.selling_points ?? [])
      .map((sp) => sp.en || sp.zh || "")
      .filter(Boolean),
    dims: {
      frameWidth: p.frame_width_mm ?? 140,
      lensWidth: p.lens_width_mm ?? 52,
      lensHeight: p.lens_height_mm ?? 42,
      bridge: p.bridge_mm ?? 18,
      temple: p.temple_length_mm ?? 145,
      weight: p.weight_g != null ? `${p.weight_g}g` : "22g",
    },
    variants,
    categoryIds: p.category_ids,
    seoTitle: p.seo_title ?? "",
    seoDesc: p.seo_description ?? "",
  };
}

function dbCategoryToCms(c: PublicCategory & { sort_order?: number }): CMSCategory {
  return {
    id: c.id,
    name: c.name_zh || c.name_en,
    nameEn: c.name_en,
    type: "main",
    slug: c.slug,
    image: c.hero_image_url ?? "",
    sortOrder: c.sort_order ?? 0,
    showInNav: c.is_published,
    showOnHome: false,
    enabled: c.is_published,
    description: c.description_zh ?? undefined,
    descriptionEn: c.description_en ?? undefined,
    isDbBacked: true,
  };
}

type DbAssetRow = {
  id: string;
  url: string;
  name: string;
  note: string | null;
  type: string;
  storage_path?: string | null;
  created_at: string;
};

function dbAssetToCms(a: DbAssetRow): CMSAsset {
  const kindMap: Record<string, CMSAssetKind> = {
    product: "product",
    category: "category",
    hero: "hero-desktop",
    home_card: "category",
    other: "product",
  };
  return {
    id: a.id,
    kind: kindMap[a.type] ?? "product",
    url: a.url,
    uploadedAt: new Date(a.created_at).getTime(),
    name: a.name,
    note: a.note ?? undefined,
    storagePath: a.storage_path ?? undefined,
    isDbBacked: true,
  };
}

// ── Hydration ──────────────────────────────────────────────────────────────

let hydrating: Promise<void> | null = null;

/**
 * Pull catalog from DB and overwrite products/categories/assets slices.
 * If `asAdmin` true, includes drafts/unpublished. Idempotent — concurrent calls
 * share the same in-flight promise.
 */
export async function hydrateCatalogFromDb(asAdmin = false): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      if (asAdmin) {
        const res = await adminListCatalog();
        const linksByProduct = new Map<string, string[]>();
        for (const l of res.links ?? []) {
          const arr = linksByProduct.get(l.product_id as string) ?? [];
          arr.push(l.category_id as string);
          linksByProduct.set(l.product_id as string, arr);
        }
        const variantsByProduct = new Map<string, any[]>();
        for (const v of res.variants ?? []) {
          const arr = variantsByProduct.get(v.product_id as string) ?? [];
          arr.push(v);
          variantsByProduct.set(v.product_id as string, arr);
        }
        const imagesByProduct = new Map<string, any[]>();
        for (const i of res.images ?? []) {
          const arr = imagesByProduct.get(i.product_id as string) ?? [];
          arr.push(i);
          imagesByProduct.set(i.product_id as string, arr);
        }
        const full: DbProductRow[] = (res.products ?? []).map((p: any) => ({
          ...(p as any),
          variants: variantsByProduct.get(p.id as string) ?? [],
          images: imagesByProduct.get(p.id as string) ?? [],
          category_ids: linksByProduct.get(p.id as string) ?? [],
        }));
        state = {
          ...state,
          products: full.map(dbProductToCms),
          categories: (res.categories ?? []).map((c: any) => dbCategoryToCms(c)),
          assets: (res.assets ?? []).map((a: any) => dbAssetToCms(a)),
        };
      } else {
        const res = await listPublishedCatalog();
        state = {
          ...state,
          products: res.products.map((p) => dbProductToCms(p as DbProductRow)),
          categories: res.categories.map(dbCategoryToCms),
          assets: (res.assets ?? []).map((a: any) => dbAssetToCms(a)),
        };
      }
      emit();
    } catch (err) {
      console.error("[cms-store] hydration failed:", err);
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

// Helper: convert CMSProduct → server fn upsert input.
function cmsProductToDbInput(p: CMSProduct) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
  const weightG = parseFloat(p.dims.weight.replace(/[^\d.]/g, "")) || null;
  return {
    id: isUuid ? p.id : undefined,
    slug: p.slug || (p.nameEn || p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || `p-${Date.now().toString(36)}`,
    legacy_id: p.legacyId ?? null,
    name_en: p.nameEn || p.name,
    name_zh: p.name || null,
    descriptor_en: p.subtitle || null,
    descriptor_zh: null,
    description_en: p.description || null,
    description_zh: null,
    selling_points: p.bullets.map((b) => ({ en: b })),
    seo_title: p.seoTitle || null,
    seo_description: p.seoDesc || null,
    price: p.price,
    original_price: p.originalPrice ?? null,
    cost: p.cost,
    currency: "USD",
    gender: null,
    shape: p.shape,
    material: p.material,
    badges: [] as string[],
    is_featured: p.featured,
    is_hot: p.hot,
    is_new: p.newOverride === "force-in",
    frame_width_mm: p.dims.frameWidth || null,
    lens_width_mm: p.dims.lensWidth || null,
    lens_height_mm: p.dims.lensHeight || null,
    bridge_mm: p.dims.bridge || null,
    temple_length_mm: p.dims.temple || null,
    weight_g: weightG,
    status: p.status,
  };
}

// ── DB-backed admin mutations ──────────────────────────────────────────────
// Each function (a) performs the DB write, (b) re-hydrates as admin. The legacy
// `cms.*` sync methods continue to mutate local state so the existing admin UI
// remains responsive while the DB write is in flight.

export const cmsDb = {
  async upsertProduct(p: CMSProduct, opts?: { variantHexByColor?: Record<string, string> }) {
    const input = cmsProductToDbInput(p);
    const { id: productId } = await fnUpsertProduct({ data: input });

    // Sync variants
    const variantInputs = p.variants.map((v, i) => ({
      name_en: v.color,
      color_hex: v.hex,
      sort_order: i,
      stock: 100,
    }));
    const varRes = await fnUpsertVariants({
      data: { product_id: productId, variants: variantInputs },
    });

    // Map variant id by color for image attach
    const varIdByColor = new Map<string, string>();
    for (const v of varRes.variants ?? []) {
      varIdByColor.set((v as any).name_en, (v as any).id);
    }

    // Sync images (flatten variant images → product_images with variant_id)
    const images: Array<{
      url: string;
      variant_id: string | null;
      is_primary: boolean;
      sort_order: number;
    }> = [];
    p.variants.forEach((v, vi) => {
      const vid = varIdByColor.get(v.color) ?? null;
      v.images.filter(Boolean).forEach((url, ii) => {
        images.push({
          url,
          variant_id: vid,
          is_primary: vi === 0 && ii === 0,
          sort_order: vi * 10 + ii,
        });
      });
    });
    await fnSetProductImages({ data: { product_id: productId, images } });

    // Sync categories — only DB-backed category ids (uuids)
    const dbCatIds = p.categoryIds.filter((cid) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(cid),
    );
    await fnSetProductCategories({
      data: { product_id: productId, category_ids: dbCatIds },
    });

    await hydrateCatalogFromDb(true);
    return productId;
  },

  async setProductStatus(id: string, status: CMSProductStatus) {
    if (!/^[0-9a-f]{8}-/i.test(id)) throw new Error("Product is not DB-backed yet");
    await fnSetProductStatus({ data: { id, status } });
    await hydrateCatalogFromDb(true);
  },

  async deleteProduct(id: string) {
    if (!/^[0-9a-f]{8}-/i.test(id)) throw new Error("Product is not DB-backed yet");
    await fnDeleteProduct({ data: { id } });
    await hydrateCatalogFromDb(true);
  },

  async upsertCategory(c: CMSCategory) {
    const isUuid = /^[0-9a-f]{8}-/i.test(c.id);
    const { id } = await fnUpsertCategory({
      data: {
        id: isUuid ? c.id : undefined,
        slug: c.slug,
        name_en: c.nameEn || c.name,
        name_zh: c.name || null,
        description_en: c.descriptionEn ?? null,
        description_zh: c.description ?? null,
        hero_image_url: c.image || null,
        seo_title: null,
        seo_description: null,
        sort_order: c.sortOrder,
        is_published: c.enabled,
      },
    });
    await hydrateCatalogFromDb(true);
    return id;
  },

  async deleteCategory(id: string) {
    if (!/^[0-9a-f]{8}-/i.test(id)) throw new Error("Category is not DB-backed yet");
    await fnDeleteCategory({ data: { id } });
    await hydrateCatalogFromDb(true);
  },

  async createAsset(input: {
    url: string;
    storage_path?: string;
    name: string;
    note?: string;
    type?: "product" | "category" | "hero" | "home_card" | "other";
    width?: number | null;
    height?: number | null;
    size_bytes?: number | null;
    mime_type?: string | null;
  }) {
    const row = await fnCreateAsset({
      data: {
        url: input.url,
        storage_path: input.storage_path ?? null,
        name: input.name,
        note: input.note ?? null,
        type: input.type ?? "product",
        width: input.width ?? null,
        height: input.height ?? null,
        size_bytes: input.size_bytes ?? null,
        mime_type: input.mime_type ?? null,
      },
    });
    await hydrateCatalogFromDb(true);
    return row;
  },

  async deleteAsset(id: string) {
    if (!/^[0-9a-f]{8}-/i.test(id)) {
      // Local-only legacy asset — just remove from state
      cms.removeAsset(id);
      return;
    }
    await fnDeleteAsset({ data: { id } });
    await hydrateCatalogFromDb(true);
  },
};

