// Mock product catalog. Edit freely — fields map 1:1 to PDP/PLP UI.
export type Product = {
  id: string;
  name: string;
  descriptor: string;
  price: number;
  originalPrice?: number;
  shape: "Rectangle" | "Square" | "Round" | "Aviator" | "Cat eye" | "Geometric" | "Butterfly" | "Oval";
  gender: "Women" | "Men" | "Unisex";
  colors: { name: string; hex: string }[];
  collection: "Bold" | "Dark" | "Daily" | "El Dorado";
  material: string;
  badge?: "ECO" | "NEW" | "BESTSELLER";
  discountPct?: number;
  dims: { frameWidth: number; lensHeight: number; lensWidth: number; bridge: number; temple: number };
  weight: string;
  modelCode: string;
};

// A product is on a "real" product-level sale only when it has an explicit
// discountPct AND an originalPrice. The global first-order promotion is NOT a
// product-level sale and should never trigger a crossed-out price.
export function isProductOnSale(p: Pick<Product, "discountPct" | "originalPrice">): boolean {
  return typeof p.discountPct === "number" && p.discountPct > 0 && typeof p.originalPrice === "number" && p.originalPrice > 0;
}

const c = {
  black: { name: "Black", hex: "#1a1a1a" },
  tortoise: { name: "Tortoise", hex: "#6b3410" },
  gold: { name: "Gold", hex: "#c9a14a" },
  clear: { name: "Clear", hex: "#e8e8e8" },
  red: { name: "Red", hex: "#a82424" },
  pink: { name: "Pink", hex: "#e8a3b0" },
  green: { name: "Green", hex: "#2f5e3a" },
  silver: { name: "Silver", hex: "#b8b8b8" },
};

export const products: Product[] = [
  { id: "p-jace", name: "Jace", descriptor: "Clear Square Designer Glasses Gold Temples", price: 38.25, originalPrice: 45, shape: "Square", gender: "Unisex", colors: [c.clear, c.tortoise], collection: "Daily", material: "Acetate", discountPct: 15, badge: "BESTSELLER", dims: { frameWidth: 142, lensHeight: 44, lensWidth: 52, bridge: 18, temple: 145 }, weight: "22g", modelCode: "MV-1001" },
  { id: "p-perkins", name: "Perkins", descriptor: "Rounded Tortoise Acetate Frame", price: 40.5, originalPrice: 45, shape: "Round", gender: "Unisex", colors: [c.tortoise, c.black], collection: "Daily", material: "Acetate", discountPct: 10, dims: { frameWidth: 140, lensHeight: 46, lensWidth: 50, bridge: 20, temple: 145 }, weight: "24g", modelCode: "MV-1002" },
  { id: "p-denzel", name: "Denzel", descriptor: "Bold Rectangle Black Frame", price: 40.5, originalPrice: 45, shape: "Rectangle", gender: "Men", colors: [c.black, c.tortoise], collection: "Bold", material: "Acetate", discountPct: 10, dims: { frameWidth: 145, lensHeight: 42, lensWidth: 54, bridge: 18, temple: 148 }, weight: "26g", modelCode: "MV-1003" },
  { id: "p-athina", name: "Athina", descriptor: "Cat Eye Pink Designer Frame", price: 45, shape: "Cat eye", gender: "Women", colors: [c.pink, c.black, c.tortoise], collection: "Bold", material: "Acetate", badge: "NEW", dims: { frameWidth: 138, lensHeight: 40, lensWidth: 52, bridge: 17, temple: 142 }, weight: "20g", modelCode: "MV-1004" },
  { id: "p-dardhan", name: "Dardhan", descriptor: "Geometric Gold Wire Frame", price: 65, shape: "Geometric", gender: "Unisex", colors: [c.gold, c.silver], collection: "El Dorado", material: "Titanium", badge: "ECO", dims: { frameWidth: 144, lensHeight: 45, lensWidth: 53, bridge: 19, temple: 147 }, weight: "16g", modelCode: "MV-1005" },
  { id: "p-mira", name: "Mira", descriptor: "Oversized Round Tortoise", price: 52, originalPrice: 60, shape: "Round", gender: "Women", colors: [c.tortoise, c.red], collection: "Bold", material: "Acetate", discountPct: 13, dims: { frameWidth: 140, lensHeight: 48, lensWidth: 52, bridge: 19, temple: 145 }, weight: "23g", modelCode: "MV-1006" },
  { id: "p-orion", name: "Orion", descriptor: "Classic Aviator Metal Frame", price: 58, shape: "Aviator", gender: "Men", colors: [c.gold, c.silver, c.black], collection: "Dark", material: "Metal", dims: { frameWidth: 143, lensHeight: 50, lensWidth: 56, bridge: 16, temple: 145 }, weight: "18g", modelCode: "MV-1007" },
  { id: "p-luna", name: "Luna", descriptor: "Butterfly Statement Frame", price: 48, originalPrice: 56, shape: "Butterfly", gender: "Women", colors: [c.black, c.pink], collection: "Bold", material: "Acetate", discountPct: 14, dims: { frameWidth: 142, lensHeight: 46, lensWidth: 54, bridge: 17, temple: 142 }, weight: "22g", modelCode: "MV-1008" },
  { id: "p-kai", name: "Kai", descriptor: "Minimal Oval Wire Frame", price: 42, shape: "Oval", gender: "Unisex", colors: [c.silver, c.gold], collection: "Daily", material: "Metal", badge: "ECO", dims: { frameWidth: 138, lensHeight: 42, lensWidth: 50, bridge: 19, temple: 145 }, weight: "14g", modelCode: "MV-1009" },
  { id: "p-noir", name: "Noir", descriptor: "Bold Square Matte Black", price: 55, shape: "Square", gender: "Men", colors: [c.black], collection: "Dark", material: "Acetate", dims: { frameWidth: 146, lensHeight: 44, lensWidth: 55, bridge: 18, temple: 148 }, weight: "27g", modelCode: "MV-1010" },
  { id: "p-soleil", name: "Soleil", descriptor: "Round Sunglasses Green Tint", price: 62, originalPrice: 72, shape: "Round", gender: "Unisex", colors: [c.green, c.gold], collection: "El Dorado", material: "Metal", discountPct: 14, badge: "NEW", dims: { frameWidth: 140, lensHeight: 48, lensWidth: 52, bridge: 19, temple: 145 }, weight: "19g", modelCode: "MV-1011" },
  { id: "p-vera", name: "Vera", descriptor: "Rectangle Reading Frame", price: 35, shape: "Rectangle", gender: "Women", colors: [c.tortoise, c.red, c.black], collection: "Daily", material: "Acetate", dims: { frameWidth: 138, lensHeight: 40, lensWidth: 51, bridge: 18, temple: 143 }, weight: "21g", modelCode: "MV-1012" },
];

export const shapes = ["Aviator", "Cat eye", "Rectangle", "Square", "Round", "Geometric", "Butterfly", "Oval"] as const;
export const collections = ["Bold", "Dark", "Daily", "El Dorado"] as const;
export const categories = [
  { slug: "women-eyeglasses", title: "Women's Eyeglasses", gender: "Women" as const },
  { slug: "men-eyeglasses", title: "Men's Eyeglasses", gender: "Men" as const },
  { slug: "sunglasses", title: "Sunglasses", gender: null },
  { slug: "best-sellers", title: "Best Sellers", gender: null },
  { slug: "new-arrivals", title: "New Arrivals", gender: null },
  { slug: "all", title: "All Eyeglasses", gender: null },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

// Pleasant SVG product placeholder — replace with real imagery later.
export function productImage(p: Product, variant = 0) {
  const color = p.colors[variant % p.colors.length]?.hex ?? "#1a1a1a";
  const bg = ["#f3ede4", "#e8e2d4", "#efe6d8", "#e4dfd3"][variant % 4];
  const shapePath = {
    Rectangle: "M30,80 h60 v40 h-60 z M110,80 h60 v40 h-60 z",
    Square: "M30,75 h55 v50 h-55 z M115,75 h55 v50 h-55 z",
    Round: "M58,100 a30,28 0 1,0 0.1,0 z M142,100 a30,28 0 1,0 0.1,0 z",
    Aviator: "M55,85 l35,-5 l-5,40 l-35,0 z M115,80 l35,5 l-5,40 l-35,0 z",
    "Cat eye": "M30,90 q30,-25 60,0 q-5,30 -55,30 z M110,90 q30,-25 60,0 q-5,30 -55,30 z",
    Geometric: "M30,80 l60,-5 l-5,50 l-55,-5 z M110,75 l60,5 l-5,50 l-55,-5 z",
    Butterfly: "M30,90 q30,-30 60,0 q-10,35 -60,30 z M110,90 q30,-30 60,0 q-10,35 -60,30 z",
    Oval: "M58,100 a30,22 0 1,0 0.1,0 z M142,100 a30,22 0 1,0 0.1,0 z",
  }[p.shape];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${bg}'/><path d='M85,100 q15,-8 30,0' stroke='${color}' stroke-width='4' fill='none' stroke-linecap='round'/><path d='${shapePath}' fill='none' stroke='${color}' stroke-width='5' stroke-linejoin='round'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
