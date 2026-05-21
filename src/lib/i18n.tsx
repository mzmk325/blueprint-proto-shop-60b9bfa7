import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "zh";

const STORAGE_KEY = "miravue:locale";

const dict = {
  en: {
    "promo.banner": "Free shipping on orders over $75 · 15% off first order with",
    "nav.eyeglasses": "Eyeglasses",
    "nav.women": "Women",
    "nav.men": "Men",
    "nav.sunglasses": "Sunglasses",
    "nav.collections": "Collections",
    "nav.special": "Special",
    "nav.bestSellers": "Best Sellers",
    "nav.newArrivals": "New Arrivals",
    "nav.wishlist": "Wishlist",
    "nav.faq": "FAQ",
    "a11y.search": "Search",
    "a11y.account": "Account",
    "a11y.wishlist": "Wishlist",
    "a11y.menu": "Menu",
    "footer.newsletter.title": "Join the Miravue list.",
    "footer.newsletter.desc": "Early drops, lookbooks, member-only offers. No noise.",
    "footer.newsletter.placeholder": "EMAIL ADDRESS",
    "footer.newsletter.subscribe": "Subscribe",
    "footer.trust.returns": "30-Day Returns",
    "footer.trust.warranty": "365-Day Warranty",
    "footer.trust.fsa": "FSA/HSA Eligible",
    "footer.trust.rating": "★ 4.6 Trustpilot",
    "footer.col.shop": "Shop",
    "footer.col.lenses": "Lenses",
    "footer.col.help": "Help",
    "footer.col.about": "About",
    "footer.col.follow": "Follow",
    "footer.lenses.blueLight": "Blue Light",
    "footer.lenses.photochromic": "Photochromic",
    "footer.lenses.polarized": "Polarized",
    "footer.lenses.progressive": "Progressive",
    "footer.help.shipping": "Shipping",
    "footer.help.returns": "Returns",
    "footer.help.size": "Size Guide",
    "footer.about.story": "Our Story",
    "footer.about.sustainability": "Sustainability",
    "footer.about.lookbook": "Lookbook",
    "footer.about.press": "Press",
    "footer.copyright": "© 2026 Miravue. All rights reserved.",
    "footer.tagline": "Designed in studio · Hand-finished worldwide.",
    "lang.label": "Language",
  },
  zh: {
    "promo.banner": "订单满 $75 免运费 · 首单 85 折，优惠码",
    "nav.eyeglasses": "光学镜",
    "nav.women": "女款",
    "nav.men": "男款",
    "nav.sunglasses": "太阳镜",
    "nav.collections": "系列",
    "nav.special": "特别企划",
    "nav.bestSellers": "热销榜",
    "nav.newArrivals": "新品",
    "nav.wishlist": "心愿单",
    "nav.faq": "常见问题",
    "a11y.search": "搜索",
    "a11y.account": "账户",
    "a11y.wishlist": "心愿单",
    "a11y.menu": "菜单",
    "footer.newsletter.title": "加入 Miravue 名单",
    "footer.newsletter.desc": "新品先享、视觉特辑、会员专属优惠。绝不打扰。",
    "footer.newsletter.placeholder": "邮箱地址",
    "footer.newsletter.subscribe": "订阅",
    "footer.trust.returns": "30 天无理由退换",
    "footer.trust.warranty": "365 天质保",
    "footer.trust.fsa": "支持 FSA/HSA",
    "footer.trust.rating": "★ 4.6 Trustpilot 评分",
    "footer.col.shop": "选购",
    "footer.col.lenses": "镜片",
    "footer.col.help": "帮助",
    "footer.col.about": "关于",
    "footer.col.follow": "关注我们",
    "footer.lenses.blueLight": "防蓝光",
    "footer.lenses.photochromic": "变色镜片",
    "footer.lenses.polarized": "偏光镜片",
    "footer.lenses.progressive": "渐进多焦点",
    "footer.help.shipping": "物流配送",
    "footer.help.returns": "退换货",
    "footer.help.size": "尺寸指南",
    "footer.about.story": "品牌故事",
    "footer.about.sustainability": "可持续",
    "footer.about.lookbook": "造型特辑",
    "footer.about.press": "媒体报道",
    "footer.copyright": "© 2026 Miravue. 版权所有。",
    "footer.tagline": "工作室设计 · 全球手工精制。",
    "lang.label": "语言",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: TKey) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "zh") setLocaleState(saved);
    } catch {}
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    } catch {}
  };

  const t = (k: TKey) => dict[locale][k] ?? dict.en[k] ?? k;

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback for SSR / outside provider
    return { locale: "en" as Locale, setLocale: () => {}, t: (k: TKey) => dict.en[k] ?? k };
  }
  return ctx;
}
