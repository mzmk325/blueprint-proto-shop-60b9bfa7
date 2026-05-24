// All CMS modules in one file to keep admin pages cohesive: 商品 / 分类 / 评价 / 活动 /
// 首页装修 / 图片素材 / AI 操作台 / 语言与币种. Mock data via cms-store.
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  cms, useCMS, useCategoriesWithCounts, isNewArrival, activePromotion, ASSET_DIMS,
  type CMSProduct, type CMSCategory, type CMSReview, type CMSPromotion, type CMSHero,
  type CMSHomeCard, type CMSShapeBanner, type CMSAssetKind, type CMSProductStatus,
} from "@/lib/cms-store";
import {
  Plus, Trash2, Copy, Eye, EyeOff, Search, ImagePlus, Sparkles, Upload,
  RotateCcw, ChevronRight, Pencil, X, Check, ExternalLink, Flame, Star,
} from "lucide-react";
import { DEFAULT_LANGUAGES, DEFAULT_CURRENCIES, ROUNDING_LABEL, type RoundingRule, type StorefrontCurrency } from "@/lib/admin-i18n";

// ── shared atoms ────────────────────────────────────────────────────────────
export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5 flex justify-between"><span>{label}</span>{hint && <span className="text-[10px]">{hint}</span>}</div>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm";
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <span onClick={() => onChange(!checked)} className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-foreground" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
function Btn({ children, onClick, tone = "neutral", size = "md", disabled }: { children: React.ReactNode; onClick?: () => void; tone?: "primary" | "danger" | "neutral" | "ghost"; size?: "sm" | "md"; disabled?: boolean }) {
  const t = {
    primary: "bg-foreground text-background hover:opacity-90",
    danger: "bg-red-600 text-white hover:bg-red-700",
    neutral: "bg-background border border-border hover:bg-secondary",
    ghost: "hover:bg-secondary text-muted-foreground hover:text-foreground",
  }[tone];
  const sz = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs";
  return <button disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed ${t} ${sz}`}>{children}</button>;
}
function StatusPill({ v }: { v: CMSProductStatus }) {
  const m = {
    draft: { l: "草稿", c: "bg-slate-500/15 text-slate-700 dark:text-slate-200" },
    published: { l: "已上架", c: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" },
    unpublished: { l: "已下架", c: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${m.c}`}>{m.l}</span>;
}

// ── 1) 商品管理 ─────────────────────────────────────────────────────────────
export function ProductsModule() {
  const products = useCMS((s) => s.products);
  const cats = useCMS((s) => s.categories);
  const settings = useCMS((s) => s.settings);
  const [editing, setEditing] = useState<CMSProduct | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CMSProductStatus>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"sort" | "publishedAt" | "price-asc" | "price-desc">(settings.defaultSort === "sort" ? "sort" : "publishedAt");

  const list = useMemo(() => {
    let l = products.filter((p) => (statusFilter === "all" || p.status === statusFilter)
      && (catFilter === "all" || p.categoryIds.includes(catFilter))
      && (!q || (p.name + p.nameEn + p.sku).toLowerCase().includes(q.toLowerCase())));
    if (sortBy === "sort") l = [...l].sort((a, b) => a.sortOrder - b.sortOrder);
    if (sortBy === "publishedAt") l = [...l].sort((a, b) => b.publishedAt - a.publishedAt);
    if (sortBy === "price-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [products, q, statusFilter, catFilter, sortBy]);

  if (editing) return <ProductEditor product={editing} cats={cats} onClose={() => setEditing(null)} />;

  return (
    <div>
      <PageHeader title="商品管理" desc={`共 ${products.length} 个商品 · 已上架 ${products.filter((p) => p.status === "published").length} · 草稿 ${products.filter((p) => p.status === "draft").length}`} action={
        <Btn tone="primary" onClick={() => setEditing(cms.createBlankProduct())}><Plus className="size-3.5" /> 新建商品</Btn>
      } />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm">
          <Search className="size-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索商品名称 / 款号" className="bg-transparent outline-none w-48" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | CMSProductStatus)} className={inputCls + " w-32"}>
          <option value="all">全部状态</option>
          <option value="published">已上架</option>
          <option value="draft">草稿</option>
          <option value="unpublished">已下架</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={inputCls + " w-44"}>
          <option value="all">全部分类</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={inputCls + " w-40"}>
          <option value="sort">按排序权重</option>
          <option value="publishedAt">按上架时间</option>
          <option value="price-asc">价格 低-高</option>
          <option value="price-desc">价格 高-低</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">商品</th>
                <th className="text-left px-3 py-2.5 font-medium">SKU</th>
                <th className="text-left px-3 py-2.5 font-medium">状态</th>
                <th className="text-right px-3 py-2.5 font-medium">售价</th>
                <th className="text-right px-3 py-2.5 font-medium">成本</th>
                <th className="text-left px-3 py-2.5 font-medium">标签</th>
                <th className="text-right px-3 py-2.5 font-medium">权重</th>
                <th className="text-left px-3 py-2.5 font-medium">上架时间</th>
                <th className="text-right px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {p.variants[0]?.images[0] ? <img src={p.variants[0].images[0]} alt="" className="size-10 rounded-md object-cover bg-secondary" /> : <div className="size-10 rounded-md bg-secondary" />}
                      <div>
                        <div className="font-medium">{p.name} <span className="text-xs text-muted-foreground">/ {p.nameEn}</span></div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-3"><StatusPill v={p.status} /></td>
                  <td className="px-3 py-3 text-right font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-xs text-muted-foreground">${p.cost.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200">推荐</span>}
                      {p.hot && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-800 dark:text-red-200">热卖</span>}
                      {isNewArrival(p, settings.newArrivalDays) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-200">新品</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-xs">{p.sortOrder}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(p.publishedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Btn size="sm" onClick={() => setEditing(p)}><Pencil className="size-3" /> 编辑</Btn>
                      <Btn size="sm" onClick={() => { cms.duplicateProduct(p.id); toast.success("已复制"); }}><Copy className="size-3" /></Btn>
                      {p.status === "published"
                        ? <Btn size="sm" onClick={() => { cms.setProductStatus(p.id, "unpublished"); toast.success("已下架"); }}><EyeOff className="size-3" /></Btn>
                        : <Btn size="sm" onClick={() => { cms.setProductStatus(p.id, "published"); toast.success("已上架"); }}><Eye className="size-3" /></Btn>}
                      <Btn size="sm" tone="danger" onClick={() => { if (confirm(`确认删除商品「${p.name}」？`)) { cms.removeProduct(p.id); toast.success("已删除"); } }}><Trash2 className="size-3" /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={9} className="text-center text-sm text-muted-foreground p-10">暂无商品</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductEditor({ product, cats, onClose }: { product: CMSProduct; cats: CMSCategory[]; onClose: () => void }) {
  const [p, setP] = useState<CMSProduct>(product);
  const [tab, setTab] = useState<"basic" | "price" | "variants" | "cats" | "dims" | "seo" | "reviews">("basic");
  const update = <K extends keyof CMSProduct>(k: K, v: CMSProduct[K]) => setP((s) => ({ ...s, [k]: v }));
  const save = () => { cms.upsertProduct(p); toast.success("已保存"); onClose(); };

  const reviews = useCMS((s) => s.reviews.filter((r) => r.productId === p.id));

  const tabs = [
    ["basic", "基本信息"], ["price", "价格与上架"], ["variants", "颜色与图片"],
    ["cats", "分类与标签"], ["dims", "尺寸参数"], ["seo", "SEO"], ["reviews", `评价 (${reviews.length})`],
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Btn onClick={onClose} tone="ghost">← 返回列表</Btn>
          <h1 className="text-xl font-semibold">{product.name ? "编辑商品" : "新建商品"} · {p.name}</h1>
          <StatusPill v={p.status} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`/product/${p.id}?preview=admin`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md font-medium bg-background border border-border hover:bg-secondary px-3 py-1.5 text-xs"><Eye className="size-3.5" /> 预览草稿</a>
          <a href={`/product/${p.id}?preview=admin&preview_lang=zh`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md font-medium bg-background border border-border hover:bg-secondary px-3 py-1.5 text-xs">中文预览</a>
          {p.status === "published" && <a href={`/product/${p.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md font-medium bg-background border border-border hover:bg-secondary px-3 py-1.5 text-xs"><ExternalLink className="size-3.5" /> 查看线上</a>}
          <Btn onClick={() => { cms.upsertProduct({ ...p, status: "draft" }); toast.success("已保存为草稿"); onClose(); }}>保存草稿</Btn>
          {p.status === "published"
            ? <Btn onClick={() => { cms.upsertProduct({ ...p, status: "unpublished" }); toast.success("已下架"); onClose(); }}><EyeOff className="size-3.5" /> 下架</Btn>
            : <Btn tone="primary" onClick={() => { const next = { ...p, status: "published" as const, publishedAt: p.publishedAt || Date.now() }; cms.upsertProduct(next); toast.success("已上架"); onClose(); }}><Eye className="size-3.5" /> 上架</Btn>}
          <Btn tone="primary" onClick={save}><Check className="size-3.5" /> 保存</Btn>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === k ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {tab === "basic" && (
            <Card title="基本信息">
              <div className="grid grid-cols-2 gap-3">
                <Field label="商品名称（前台显示）"><input className={inputCls} value={p.name} onChange={(e) => update("name", e.target.value)} /></Field>
                <Field label="英文商品名"><input className={inputCls} value={p.nameEn} onChange={(e) => update("nameEn", e.target.value)} /></Field>
                <Field label="SKU / 款号"><input className={inputCls} value={p.sku} onChange={(e) => update("sku", e.target.value)} /></Field>
                <Field label="材质"><input className={inputCls} value={p.material} onChange={(e) => update("material", e.target.value)} /></Field>
                <Field label="镜型">
                  <select className={inputCls} value={p.shape} onChange={(e) => update("shape", e.target.value)}>
                    {["Aviator", "Cat eye", "Rectangle", "Square", "Round", "Geometric", "Butterfly", "Oval"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="适合脸型（逗号分隔）"><input className={inputCls} value={p.faceShape.join(",")} onChange={(e) => update("faceShape", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
              </div>
              <Field label="副标题 / 短卖点"><input className={inputCls} value={p.subtitle} onChange={(e) => update("subtitle", e.target.value)} /></Field>
              <Field label="风格标签（逗号分隔）"><input className={inputCls} value={p.styleTags.join(",")} onChange={(e) => update("styleTags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
              <Field label="商品描述"><textarea rows={4} className={inputCls} value={p.description} onChange={(e) => update("description", e.target.value)} /></Field>
              <Field label="商品卖点 bullets（每行一条）"><textarea rows={4} className={inputCls} value={p.bullets.join("\n")} onChange={(e) => update("bullets", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} /></Field>
            </Card>
          )}

          {tab === "price" && (
            <Card title="价格与上架">
              <div className="grid grid-cols-3 gap-3">
                <Field label="基础售价 USD"><input type="number" className={inputCls} value={p.price} onChange={(e) => update("price", +e.target.value)} /></Field>
                <Field label="成本价 USD"><input type="number" className={inputCls} value={p.cost} onChange={(e) => update("cost", +e.target.value)} /></Field>
                <Field label="原价 USD（划线价）"><input type="number" className={inputCls} value={p.originalPrice ?? ""} onChange={(e) => update("originalPrice", e.target.value ? +e.target.value : undefined)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <Field label="商品状态">
                  <select className={inputCls} value={p.status} onChange={(e) => update("status", e.target.value as CMSProductStatus)}>
                    <option value="draft">草稿</option>
                    <option value="published">已上架</option>
                    <option value="unpublished">已下架</option>
                  </select>
                </Field>
                <Field label="上架时间"><input type="date" className={inputCls} value={new Date(p.publishedAt).toISOString().slice(0, 10)} onChange={(e) => update("publishedAt", e.target.value ? new Date(e.target.value).getTime() : Date.now())} /></Field>
                <Field label="排序权重（越小越前）"><input type="number" className={inputCls} value={p.sortOrder} onChange={(e) => update("sortOrder", +e.target.value)} /></Field>
                <Field label="新品标记">
                  <select className={inputCls} value={p.newOverride} onChange={(e) => update("newOverride", e.target.value as CMSProduct["newOverride"])}>
                    <option value="auto">自动（按上架天数）</option>
                    <option value="force-in">强制加入新品</option>
                    <option value="force-out">从新品移除</option>
                  </select>
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                <Toggle checked={p.featured} onChange={(v) => update("featured", v)} label="推荐商品" />
                <Toggle checked={p.hot} onChange={(v) => update("hot", v)} label="热卖商品" />
                <Toggle checked={p.joinSitePromo} onChange={(v) => update("joinSitePromo", v)} label="参与全站活动" />
              </div>
              <p className="text-[11px] text-muted-foreground">毛利预估：{p.cost ? Math.round((1 - p.cost / p.price) * 100) : 0}%</p>
            </Card>
          )}

          {tab === "variants" && (
            <Card title="颜色变体与图片" action={<Btn size="sm" onClick={() => update("variants", [...p.variants, { color: "新颜色", hex: "#888888", images: [""] }])}><Plus className="size-3.5" /> 添加颜色</Btn>}>
              {p.variants.length === 0 && <p className="text-sm text-muted-foreground">尚未添加颜色变体。</p>}
              {p.variants.map((v, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
                    <Field label="颜色名称"><input className={inputCls} value={v.color} onChange={(e) => { const a = [...p.variants]; a[i] = { ...v, color: e.target.value }; update("variants", a); }} /></Field>
                    <Field label="色块 HEX"><div className="flex gap-1.5 items-center"><input type="color" value={v.hex} onChange={(e) => { const a = [...p.variants]; a[i] = { ...v, hex: e.target.value }; update("variants", a); }} className="size-8 rounded border border-border" /><input className={inputCls} value={v.hex} onChange={(e) => { const a = [...p.variants]; a[i] = { ...v, hex: e.target.value }; update("variants", a); }} /></div></Field>
                    <Btn tone="danger" size="sm" onClick={() => update("variants", p.variants.filter((_, j) => j !== i))}><Trash2 className="size-3" /></Btn>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">图片 URL（建议 1200×1200 / 1600×1600）</div>
                    <div className="space-y-1.5">
                      {v.images.map((img, ii) => (
                        <div key={ii} className="flex gap-2 items-center">
                          {img ? <img src={img} alt="" className="size-10 rounded-md object-cover bg-secondary" /> : <div className="size-10 rounded-md bg-secondary grid place-items-center text-muted-foreground"><ImagePlus className="size-3.5" /></div>}
                          <input className={inputCls} value={img} placeholder="https://…" onChange={(e) => { const a = [...p.variants]; const im = [...v.images]; im[ii] = e.target.value; a[i] = { ...v, images: im }; update("variants", a); }} />
                          <Btn size="sm" tone="ghost" onClick={() => { const a = [...p.variants]; a[i] = { ...v, images: v.images.filter((_, j) => j !== ii) }; update("variants", a); }}><X className="size-3" /></Btn>
                        </div>
                      ))}
                      <Btn size="sm" onClick={() => { const a = [...p.variants]; a[i] = { ...v, images: [...v.images, ""] }; update("variants", a); }}><Plus className="size-3" /> 添加图片</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {tab === "cats" && (
            <Card title="所属分类（多选）">
              <p className="text-xs text-muted-foreground">商品可同时属于多个分类，例如：女款 + 方框 + Daily + 新品 + 热销榜。</p>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                {cats.map((c) => {
                  const on = p.categoryIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-sm border border-border rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-secondary/40">
                      <input type="checkbox" checked={on} onChange={() => { update("categoryIds", on ? p.categoryIds.filter((x) => x !== c.id) : [...p.categoryIds, c.id]); }} />
                      <span className="flex-1">{c.name} <span className="text-xs text-muted-foreground">/ {c.nameEn}</span></span>
                      <span className="text-[10px] text-muted-foreground">{c.type}</span>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          {tab === "dims" && (
            <Card title="尺寸参数">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Frame width (mm)"><input type="number" className={inputCls} value={p.dims.frameWidth} onChange={(e) => update("dims", { ...p.dims, frameWidth: +e.target.value })} /></Field>
                <Field label="Lens width (mm)"><input type="number" className={inputCls} value={p.dims.lensWidth} onChange={(e) => update("dims", { ...p.dims, lensWidth: +e.target.value })} /></Field>
                <Field label="Lens height (mm)"><input type="number" className={inputCls} value={p.dims.lensHeight} onChange={(e) => update("dims", { ...p.dims, lensHeight: +e.target.value })} /></Field>
                <Field label="Bridge (mm)"><input type="number" className={inputCls} value={p.dims.bridge} onChange={(e) => update("dims", { ...p.dims, bridge: +e.target.value })} /></Field>
                <Field label="Temple (mm)"><input type="number" className={inputCls} value={p.dims.temple} onChange={(e) => update("dims", { ...p.dims, temple: +e.target.value })} /></Field>
                <Field label="Weight"><input className={inputCls} value={p.dims.weight} onChange={(e) => update("dims", { ...p.dims, weight: e.target.value })} /></Field>
              </div>
            </Card>
          )}

          {tab === "seo" && (
            <Card title="SEO 设置">
              <Field label="SEO 标题"><input className={inputCls} value={p.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} /></Field>
              <Field label="SEO 描述"><textarea rows={3} className={inputCls} value={p.seoDesc} onChange={(e) => update("seoDesc", e.target.value)} /></Field>
            </Card>
          )}

          {tab === "reviews" && (
            <Card title="本商品评价" action={<Btn size="sm" onClick={() => { cms.generateStarterReviews(p.id); toast.success("已生成 3 条起始评价"); }}><Sparkles className="size-3" /> 生成起始评价</Btn>}>
              {reviews.length === 0 ? <p className="text-sm text-muted-foreground">还没有评价。</p> : reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.user} · {r.country} · {"★".repeat(r.stars)}</span>
                    <span>{new Date(r.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mt-1">{r.body}</p>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="预览">
            <div className="aspect-[4/5] rounded-md bg-secondary overflow-hidden">
              {p.variants[0]?.images[0] ? <img src={p.variants[0].images[0]} alt="" className="w-full h-full object-cover" /> : <div className="grid place-items-center h-full text-xs text-muted-foreground">无图片</div>}
            </div>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.subtitle}</div>
            <div className="font-display text-lg">${p.price.toFixed(2)}</div>
            <Link to="/product/$id" params={{ id: p.id }} target="_blank" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ExternalLink className="size-3" /> 在前台打开</Link>
          </Card>
          <Card title="操作">
            <Btn tone="primary" onClick={save}><Check className="size-3.5" /> 保存所有改动</Btn>
            <Btn onClick={() => { cms.duplicateProduct(p.id); toast.success("已复制"); onClose(); }}><Copy className="size-3.5" /> 复制商品</Btn>
            <Btn tone="danger" onClick={() => { if (confirm("确认删除？")) { cms.removeProduct(p.id); toast.success("已删除"); onClose(); } }}><Trash2 className="size-3.5" /> 删除</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── 2) 分类管理 ─────────────────────────────────────────────────────────────
const CAT_TYPE_LABEL: Record<CMSCategory["type"], string> = {
  main: "主分类", gender: "性别分类", shape: "镜型分类", series: "系列分类", campaign: "活动分类", hidden: "隐藏分类",
};

export function CategoriesModule() {
  const list = useCategoriesWithCounts();
  const [editing, setEditing] = useState<CMSCategory | null>(null);
  const [filter, setFilter] = useState<"all" | CMSCategory["type"]>("all");
  const filtered = filter === "all" ? list : list.filter((c) => c.type === filter);

  return (
    <div>
      <PageHeader title="分类管理" desc={`共 ${list.length} 个分类，支持主分类 / 性别 / 镜型 / 系列 / 活动 / 隐藏 六种类型`} action={
        <Btn tone="primary" onClick={() => setEditing(cms.createBlankCategory())}><Plus className="size-3.5" /> 新建分类</Btn>
      } />
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-xs rounded-full border ${filter === "all" ? "bg-foreground text-background border-foreground" : "border-border"}`}>全部 · {list.length}</button>
        {(Object.keys(CAT_TYPE_LABEL) as CMSCategory["type"][]).map((t) => {
          const n = list.filter((c) => c.type === t).length;
          return <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-xs rounded-full border ${filter === t ? "bg-foreground text-background border-foreground" : "border-border"}`}>{CAT_TYPE_LABEL[t]} · {n}</button>;
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium">分类名称</th>
              <th className="text-left px-3 py-2.5 font-medium">英文</th>
              <th className="text-left px-3 py-2.5 font-medium">类型</th>
              <th className="text-left px-3 py-2.5 font-medium">Slug</th>
              <th className="text-right px-3 py-2.5 font-medium">关联商品</th>
              <th className="text-right px-3 py-2.5 font-medium">权重</th>
              <th className="text-left px-3 py-2.5 font-medium">导航</th>
              <th className="text-left px-3 py-2.5 font-medium">首页</th>
              <th className="text-left px-3 py-2.5 font-medium">启用</th>
              <th className="text-right px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30">
                <td className="px-3 py-3 font-medium">{c.name}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{c.nameEn}</td>
                <td className="px-3 py-3 text-xs">{CAT_TYPE_LABEL[c.type]}</td>
                <td className="px-3 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-3 py-3 text-right">{c.productCount}</td>
                <td className="px-3 py-3 text-right text-xs">{c.sortOrder}</td>
                <td className="px-3 py-3">{c.showInNav ? "✓" : "—"}</td>
                <td className="px-3 py-3">{c.showOnHome ? "✓" : "—"}</td>
                <td className="px-3 py-3"><Toggle checked={c.enabled} onChange={(v) => cms.upsertCategory({ ...c, enabled: v })} /></td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Btn size="sm" onClick={() => setEditing(c)}><Pencil className="size-3" /></Btn>
                    <Btn size="sm" tone="danger" onClick={() => { if (confirm("确认删除分类？")) cms.removeCategory(c.id); }}><Trash2 className="size-3" /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <CategoryEditor cat={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function CategoryEditor({ cat, onClose }: { cat: CMSCategory; onClose: () => void }) {
  const [c, setC] = useState(cat);
  const update = <K extends keyof CMSCategory>(k: K, v: CMSCategory[K]) => setC((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">编辑分类</h3>
          <Btn tone="ghost" size="sm" onClick={onClose}><X className="size-4" /></Btn>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="分类名称"><input className={inputCls} value={c.name} onChange={(e) => update("name", e.target.value)} /></Field>
          <Field label="英文名称"><input className={inputCls} value={c.nameEn} onChange={(e) => update("nameEn", e.target.value)} /></Field>
          <Field label="分类类型"><select className={inputCls} value={c.type} onChange={(e) => update("type", e.target.value as CMSCategory["type"])}>{(Object.keys(CAT_TYPE_LABEL) as CMSCategory["type"][]).map((t) => <option key={t} value={t}>{CAT_TYPE_LABEL[t]}</option>)}</select></Field>
          <Field label="URL slug"><input className={inputCls} value={c.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
          <Field label="排序权重"><input type="number" className={inputCls} value={c.sortOrder} onChange={(e) => update("sortOrder", +e.target.value)} /></Field>
          <Field label="图片 URL（推荐 800×1000）"><input className={inputCls} value={c.image} onChange={(e) => update("image", e.target.value)} placeholder="https://…" /></Field>
        </div>
        <div className="flex gap-5 pt-2">
          <Toggle checked={c.showInNav} onChange={(v) => update("showInNav", v)} label="显示在导航" />
          <Toggle checked={c.showOnHome} onChange={(v) => update("showOnHome", v)} label="显示在首页" />
          <Toggle checked={c.enabled} onChange={(v) => update("enabled", v)} label="启用" />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Btn onClick={onClose}>取消</Btn>
          <Btn tone="primary" onClick={() => { cms.upsertCategory(c); toast.success("已保存"); onClose(); }}>保存</Btn>
        </div>
      </div>
    </div>
  );
}

// ── 3) 评价管理 ─────────────────────────────────────────────────────────────
export function ReviewsModule() {
  const reviews = useCMS((s) => s.reviews);
  const products = useCMS((s) => s.products);
  const [pid, setPid] = useState<string>("all");
  const [editing, setEditing] = useState<CMSReview | null>(null);
  const list = pid === "all" ? reviews : reviews.filter((r) => r.productId === pid);

  return (
    <div>
      <PageHeader title="评价管理" desc={`共 ${reviews.length} 条评价`} action={
        <Btn tone="primary" onClick={() => setEditing({ id: `rv-${Math.random().toString(36).slice(2, 9)}`, productId: products[0]?.id ?? "", user: "", country: "US", stars: 5, body: "", images: [], publishedAt: Date.now(), visible: true, sortOrder: 10, featured: false })}><Plus className="size-3.5" /> 新建评价</Btn>
      } />
      <div className="flex items-center gap-3 mb-4">
        <select className={inputCls + " w-64"} value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="all">全部商品</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} / {p.nameEn}</option>)}
        </select>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium">关联商品</th>
              <th className="text-left px-3 py-2.5 font-medium">用户</th>
              <th className="text-left px-3 py-2.5 font-medium">国家</th>
              <th className="text-left px-3 py-2.5 font-medium">星级</th>
              <th className="text-left px-3 py-2.5 font-medium">内容</th>
              <th className="text-left px-3 py-2.5 font-medium">展示</th>
              <th className="text-right px-3 py-2.5 font-medium">权重</th>
              <th className="text-right px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((r) => {
              const p = products.find((x) => x.id === r.productId);
              return (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-3 py-3 text-xs">{p?.name ?? r.productId}</td>
                  <td className="px-3 py-3">{r.user}</td>
                  <td className="px-3 py-3 text-xs">{r.country}</td>
                  <td className="px-3 py-3 text-amber-500">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</td>
                  <td className="px-3 py-3 text-xs max-w-md line-clamp-2">{r.body}</td>
                  <td className="px-3 py-3"><Toggle checked={r.visible} onChange={(v) => cms.upsertReview({ ...r, visible: v })} /></td>
                  <td className="px-3 py-3 text-right text-xs">{r.sortOrder}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Btn size="sm" onClick={() => setEditing(r)}><Pencil className="size-3" /></Btn>
                      <Btn size="sm" tone="danger" onClick={() => { if (confirm("确认删除？")) cms.removeReview(r.id); }}><Trash2 className="size-3" /></Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && <ReviewEditor review={editing} products={products} onClose={() => setEditing(null)} />}
    </div>
  );
}
function ReviewEditor({ review, products, onClose }: { review: CMSReview; products: CMSProduct[]; onClose: () => void }) {
  const [r, setR] = useState(review);
  const update = <K extends keyof CMSReview>(k: K, v: CMSReview[K]) => setR((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold">编辑评价</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="关联商品"><select className={inputCls} value={r.productId} onChange={(e) => update("productId", e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} / {p.nameEn}</option>)}</select></Field>
          <Field label="用户名"><input className={inputCls} value={r.user} onChange={(e) => update("user", e.target.value)} /></Field>
          <Field label="国家"><input className={inputCls} value={r.country} onChange={(e) => update("country", e.target.value)} /></Field>
          <Field label="星级">
            <select className={inputCls} value={r.stars} onChange={(e) => update("stars", +e.target.value)}>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{"★".repeat(s)}</option>)}</select>
          </Field>
          <Field label="排序权重"><input type="number" className={inputCls} value={r.sortOrder} onChange={(e) => update("sortOrder", +e.target.value)} /></Field>
          <Field label="发布时间"><input type="date" className={inputCls} value={new Date(r.publishedAt).toISOString().slice(0, 10)} onChange={(e) => update("publishedAt", new Date(e.target.value).getTime())} /></Field>
        </div>
        <Field label="评价内容"><textarea rows={4} className={inputCls} value={r.body} onChange={(e) => update("body", e.target.value)} /></Field>
        <Field label="评价图片 URL（每行一条）"><textarea rows={2} className={inputCls} value={r.images.join("\n")} onChange={(e) => update("images", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} /></Field>
        <div className="flex gap-5">
          <Toggle checked={r.visible} onChange={(v) => update("visible", v)} label="前台展示" />
          <Toggle checked={r.featured} onChange={(v) => update("featured", v)} label="推荐展示" />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Btn onClick={onClose}>取消</Btn>
          <Btn tone="primary" onClick={() => { cms.upsertReview(r); toast.success("已保存"); onClose(); }}>保存</Btn>
        </div>
      </div>
    </div>
  );
}

// ── 4) 活动/折扣设置 ────────────────────────────────────────────────────────
const PROMO_TYPE_LABEL: Record<CMSPromotion["type"], string> = {
  "first-order": "首单折扣", "second-half": "第二副半价", sitewide: "全站满减/打折",
};
export function PromotionsModule() {
  const promos = useCMS((s) => s.promotions);
  const active = activePromotion();
  return (
    <div>
      <PageHeader title="活动/折扣设置" desc="同一时间只生效优先级最高的一个活动。首单折扣自动应用，无需优惠码。" />
      <Card>
        <div className="text-xs text-muted-foreground">当前生效活动</div>
        {active ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"><Sparkles className="size-3.5" /> {active.title} · {active.percent}% off</span>
            <span className="text-muted-foreground">{active.frontCopy}</span>
          </div>
        ) : <div className="text-sm text-muted-foreground">未启用任何活动</div>}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {promos.map((p) => {
          const isActive = active?.id === p.id;
          const overridden = p.enabled && !isActive;
          return (
            <Card key={p.id} title={PROMO_TYPE_LABEL[p.type]} action={<Toggle checked={p.enabled} onChange={(v) => cms.upsertPromotion({ ...p, enabled: v })} />}>
              {overridden && <p className="text-[11px] text-amber-700 dark:text-amber-200 bg-amber-500/15 rounded px-2 py-1">已启用但被更高优先级覆盖</p>}
              <Field label="活动标题"><input className={inputCls} value={p.title} onChange={(e) => cms.upsertPromotion({ ...p, title: e.target.value })} /></Field>
              <Field label="前台提示文案"><input className={inputCls} value={p.frontCopy} onChange={(e) => cms.upsertPromotion({ ...p, frontCopy: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="折扣 %"><input type="number" className={inputCls} value={p.percent} onChange={(e) => cms.upsertPromotion({ ...p, percent: +e.target.value })} /></Field>
                <Field label="优先级"><input type="number" className={inputCls} value={p.priority} onChange={(e) => cms.upsertPromotion({ ...p, priority: +e.target.value })} /></Field>
                <Field label="开始时间"><input type="date" className={inputCls} value={p.startAt ? new Date(p.startAt).toISOString().slice(0, 10) : ""} onChange={(e) => cms.upsertPromotion({ ...p, startAt: e.target.value ? new Date(e.target.value).getTime() : undefined })} /></Field>
                <Field label="结束时间"><input type="date" className={inputCls} value={p.endAt ? new Date(p.endAt).toISOString().slice(0, 10) : ""} onChange={(e) => cms.upsertPromotion({ ...p, endAt: e.target.value ? new Date(e.target.value).getTime() : undefined })} /></Field>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── 5) 首页装修 ─────────────────────────────────────────────────────────────
export function HomeCmsModule() {
  const [tab, setTab] = useState<"hero" | "cards" | "shapes" | "promo">("hero");
  const heroes = useCMS((s) => s.heroes);
  const cards = useCMS((s) => s.homeCards);
  const banners = useCMS((s) => s.shapeBanners);
  const promoBar = useCMS((s) => s.promoBar);

  return (
    <div>
      <PageHeader title="首页装修" desc="管理首页 Hero / 类目卡 / 镜型 Banner / 顶部促销条" action={<Link to="/" target="_blank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3" /> 预览前台</Link>} />
      <div className="flex gap-1 mb-4 border-b border-border">
        {([["hero", `Hero (${heroes.length})`], ["cards", `类目卡 (${cards.length})`], ["shapes", `镜型 Banner (${banners.length})`], ["promo", "顶部促销条"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === k ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "hero" && (
        <div className="space-y-3">
          <Btn tone="primary" onClick={() => cms.upsertHero(cms.createBlankHero())}><Plus className="size-3.5" /> 添加 Hero</Btn>
          {heroes.map((h) => <HeroEditor key={h.id} hero={h} />)}
        </div>
      )}
      {tab === "cards" && (
        <div className="space-y-3">
          <Btn tone="primary" onClick={() => cms.upsertHomeCard(cms.createBlankHomeCard())}><Plus className="size-3.5" /> 添加类目卡</Btn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((c) => (
              <Card key={c.id} action={<div className="flex gap-2 items-center"><Toggle checked={c.active} onChange={(v) => cms.upsertHomeCard({ ...c, active: v })} /><Btn size="sm" tone="danger" onClick={() => cms.removeHomeCard(c.id)}><Trash2 className="size-3" /></Btn></div>}>
                {c.image && <img src={c.image} alt="" className="w-full h-40 object-cover rounded" />}
                <Field label="图片 URL（推荐 800×1000）"><input className={inputCls} value={c.image} onChange={(e) => cms.upsertHomeCard({ ...c, image: e.target.value })} /></Field>
                <Field label="标题"><input className={inputCls} value={c.title} onChange={(e) => cms.upsertHomeCard({ ...c, title: e.target.value })} /></Field>
                <Field label="链接"><input className={inputCls} value={c.link} onChange={(e) => cms.upsertHomeCard({ ...c, link: e.target.value })} /></Field>
                <Field label="排序权重"><input type="number" className={inputCls} value={c.sortOrder} onChange={(e) => cms.upsertHomeCard({ ...c, sortOrder: +e.target.value })} /></Field>
              </Card>
            ))}
          </div>
        </div>
      )}
      {tab === "shapes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banners.map((b) => (
            <Card key={b.id} action={<div className="flex gap-2 items-center"><Toggle checked={b.active} onChange={(v) => cms.upsertShapeBanner({ ...b, active: v })} /><Btn size="sm" tone="danger" onClick={() => cms.removeShapeBanner(b.id)}><Trash2 className="size-3" /></Btn></div>}>
              <Field label="镜型"><input className={inputCls} value={b.shape} onChange={(e) => cms.upsertShapeBanner({ ...b, shape: e.target.value })} /></Field>
              <Field label="图片 URL（推荐 900×520）"><input className={inputCls} value={b.image} onChange={(e) => cms.upsertShapeBanner({ ...b, image: e.target.value })} /></Field>
              <Field label="链接"><input className={inputCls} value={b.link} onChange={(e) => cms.upsertShapeBanner({ ...b, link: e.target.value })} /></Field>
              <Field label="排序权重"><input type="number" className={inputCls} value={b.sortOrder} onChange={(e) => cms.upsertShapeBanner({ ...b, sortOrder: +e.target.value })} /></Field>
            </Card>
          ))}
        </div>
      )}
      {tab === "promo" && (
        <Card title="顶部促销条" action={<Toggle checked={promoBar.active} onChange={(v) => cms.setPromoBar({ ...promoBar, active: v })} />}>
          <Field label="文案"><input className={inputCls} value={promoBar.text} onChange={(e) => cms.setPromoBar({ ...promoBar, text: e.target.value })} /></Field>
          <Field label="链接（可选）"><input className={inputCls} value={promoBar.link} onChange={(e) => cms.setPromoBar({ ...promoBar, link: e.target.value })} /></Field>
          <p className="text-[11px] text-muted-foreground">启用后前台顶部促销条将显示此文案。</p>
        </Card>
      )}
    </div>
  );
}
function HeroEditor({ hero }: { hero: CMSHero }) {
  const [h, setH] = useState(hero);
  const upd = <K extends keyof CMSHero>(k: K, v: CMSHero[K]) => { const n = { ...h, [k]: v }; setH(n); cms.upsertHero(n); };
  return (
    <Card action={<div className="flex gap-2 items-center"><Toggle checked={h.active} onChange={(v) => upd("active", v)} /><Btn size="sm" tone="danger" onClick={() => cms.removeHero(h.id)}><Trash2 className="size-3" /></Btn></div>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="桌面图片 URL（1920×760）"><input className={inputCls} value={h.desktopImage} onChange={(e) => upd("desktopImage", e.target.value)} /></Field>
        <Field label="移动图片 URL（900×1200）"><input className={inputCls} value={h.mobileImage} onChange={(e) => upd("mobileImage", e.target.value)} /></Field>
        <Field label="标题"><input className={inputCls} value={h.title} onChange={(e) => upd("title", e.target.value)} /></Field>
        <Field label="副标题"><input className={inputCls} value={h.subtitle} onChange={(e) => upd("subtitle", e.target.value)} /></Field>
        <Field label="按钮 1 文案"><input className={inputCls} value={h.btn1Text} onChange={(e) => upd("btn1Text", e.target.value)} /></Field>
        <Field label="按钮 1 链接"><input className={inputCls} value={h.btn1Link} onChange={(e) => upd("btn1Link", e.target.value)} /></Field>
        <Field label="按钮 2 文案"><input className={inputCls} value={h.btn2Text} onChange={(e) => upd("btn2Text", e.target.value)} /></Field>
        <Field label="按钮 2 链接"><input className={inputCls} value={h.btn2Link} onChange={(e) => upd("btn2Link", e.target.value)} /></Field>
        <Field label="排序权重"><input type="number" className={inputCls} value={h.sortOrder} onChange={(e) => upd("sortOrder", +e.target.value)} /></Field>
        <Field label="开始时间"><input type="date" className={inputCls} value={h.startAt ? new Date(h.startAt).toISOString().slice(0, 10) : ""} onChange={(e) => upd("startAt", e.target.value ? new Date(e.target.value).getTime() : undefined)} /></Field>
        <Field label="结束时间"><input type="date" className={inputCls} value={h.endAt ? new Date(h.endAt).toISOString().slice(0, 10) : ""} onChange={(e) => upd("endAt", e.target.value ? new Date(e.target.value).getTime() : undefined)} /></Field>
      </div>
    </Card>
  );
}

// ── 6) 图片素材 ─────────────────────────────────────────────────────────────
export function AssetsModule() {
  const assets = useCMS((s) => s.assets);
  const [kindFilter, setKindFilter] = useState<"all" | CMSAssetKind>("all");
  const [newKind, setNewKind] = useState<CMSAssetKind>("product");
  const [newUrl, setNewUrl] = useState("");
  const filtered = kindFilter === "all" ? assets : assets.filter((a) => a.kind === kindFilter);

  return (
    <div>
      <PageHeader title="图片素材" desc="集中管理首页 / 分类 / 商品 / 评价等图片资源。支持通过 URL 添加，并在商品编辑器中直接选用。" />
      <Card title="新增图片">
        <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
          <select className={inputCls} value={newKind} onChange={(e) => setNewKind(e.target.value as CMSAssetKind)}>
            {(Object.entries(ASSET_DIMS) as [CMSAssetKind, typeof ASSET_DIMS[CMSAssetKind]][]).map(([k, v]) => <option key={k} value={k}>{v.label}（{v.w}×{v.h}）</option>)}
          </select>
          <input className={inputCls} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://… 或粘贴图片 URL" />
          <Btn tone="primary" onClick={() => { if (newUrl) { cms.addAsset(newKind, newUrl); setNewUrl(""); toast.success("已添加"); } }}><Upload className="size-3.5" /> 添加</Btn>
        </div>
        <p className="text-[11px] text-muted-foreground">推荐尺寸（点击切换类型查看）：{ASSET_DIMS[newKind].label} — {ASSET_DIMS[newKind].w}×{ASSET_DIMS[newKind].h} px</p>
      </Card>

      <div className="flex gap-2 mt-4 mb-3 flex-wrap">
        <button onClick={() => setKindFilter("all")} className={`px-3 py-1.5 text-xs rounded-full border ${kindFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border"}`}>全部 · {assets.length}</button>
        {(Object.entries(ASSET_DIMS) as [CMSAssetKind, typeof ASSET_DIMS[CMSAssetKind]][]).map(([k, v]) => {
          const n = assets.filter((a) => a.kind === k).length;
          return <button key={k} onClick={() => setKindFilter(k)} className={`px-3 py-1.5 text-xs rounded-full border ${kindFilter === k ? "bg-foreground text-background border-foreground" : "border-border"}`}>{v.label} · {n}</button>;
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-10">该类型下暂无图片。</p>}
        {filtered.map((a) => (
          <div key={a.id} className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="aspect-square bg-secondary"><img src={a.url} alt="" className="w-full h-full object-cover" /></div>
            <div className="p-2 text-[11px]">
              <div className="text-muted-foreground">{ASSET_DIMS[a.kind].label}</div>
              <div className="font-mono truncate">{a.url}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-muted-foreground">{new Date(a.uploadedAt).toLocaleDateString()}</span>
                <Btn size="sm" tone="danger" onClick={() => cms.removeAsset(a.id)}><Trash2 className="size-3" /></Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 7) 语言与币种 ──────────────────────────────────────────────────────────

export function LangCurrencyModule() {
  const settings = useCMS((s) => s.settings);
  const [langs, setLangs] = useState(DEFAULT_LANGUAGES);
  const [curs, setCurs] = useState(DEFAULT_CURRENCIES);
  const updLang = (i: number, patch: Partial<typeof langs[number]>) => setLangs((ls) => ls.map((l, k) => k === i ? { ...l, ...patch } : l));
  const updCur = (i: number, patch: Partial<typeof curs[number]>) => setCurs((cs) => cs.map((c, k) => k === i ? { ...c, ...patch } : c));
  return (
    <div>
      <PageHeader title="语言与币种" desc="前台多语言/多币种映射，所有变更下一轮接入真实 i18n / 汇率服务。当前为运营预设。" />
      <Card title="前台语言" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">语言</th>
                <th className="text-left px-3 py-2 font-medium">代码</th>
                <th className="text-left px-3 py-2 font-medium">绑定币种</th>
                <th className="text-center px-3 py-2 font-medium">启用</th>
                <th className="text-center px-3 py-2 font-medium">前台可见</th>
                <th className="text-left px-3 py-2 font-medium">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {langs.map((l, i) => (
                <tr key={l.code}>
                  <td className="px-3 py-2">{l.name} <span className="text-xs text-muted-foreground">/ {l.nativeName}</span></td>
                  <td className="px-3 py-2 font-mono text-xs">{l.code}</td>
                  <td className="px-3 py-2">
                    <select className={inputCls + " w-24"} value={l.currency} onChange={(e) => updLang(i, { currency: e.target.value as StorefrontCurrency })}>
                      {curs.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center"><Toggle checked={l.enabled} onChange={(v) => updLang(i, { enabled: v })} /></td>
                  <td className="px-3 py-2 text-center"><Toggle checked={l.publicVisible} onChange={(v) => updLang(i, { publicVisible: v })} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{l.internalPreview ? "内部预览，仅供后台预览，不在前台显示" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">中文 (zh-CN) 默认仅作为内部预览，不会在前台语言切换器中显示。</p>
      </Card>

      <Card title="币种与汇率" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">币种</th>
                <th className="text-left px-3 py-2 font-medium">符号</th>
                <th className="text-right px-3 py-2 font-medium">基准汇率 (vs USD)</th>
                <th className="text-right px-3 py-2 font-medium">人工覆盖汇率</th>
                <th className="text-left px-3 py-2 font-medium">取整规则</th>
                <th className="text-center px-3 py-2 font-medium">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {curs.map((c, i) => (
                <tr key={c.code}>
                  <td className="px-3 py-2">{c.code} <span className="text-xs text-muted-foreground">/ {c.name}</span></td>
                  <td className="px-3 py-2">{c.symbol}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{c.baseRate.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" step="0.0001" className={inputCls + " w-24 text-right"} value={c.overrideRate ?? ""} placeholder="—" onChange={(e) => updCur(i, { overrideRate: e.target.value ? +e.target.value : undefined })} />
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputCls + " w-40"} value={c.rounding} onChange={(e) => updCur(i, { rounding: e.target.value as RoundingRule })}>
                      {(Object.entries(ROUNDING_LABEL) as [RoundingRule, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center"><Toggle checked={c.enabled} onChange={(v) => updCur(i, { enabled: v })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">基准汇率为占位数据；下一轮接入实时汇率源后此处仅显示当前值，人工覆盖汇率优先生效。</p>
      </Card>

      <Card title="运营参数" className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="新品自动天数（基于上架时间）">
            <input type="number" className={inputCls} value={settings.newArrivalDays} onChange={(e) => cms.setSettings({ newArrivalDays: +e.target.value })} />
          </Field>
          <Field label="商品列表默认排序">
            <select className={inputCls} value={settings.defaultSort} onChange={(e) => cms.setSettings({ defaultSort: e.target.value as typeof settings.defaultSort })}>
              <option value="sort">手动排序权重</option>
              <option value="publishedAt">上架时间</option>
              <option value="price-asc">价格 低-高</option>
              <option value="price-desc">价格 高-低</option>
              <option value="hot">热卖优先</option>
              <option value="featured">推荐优先</option>
              <option value="new">新品优先</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card title="数据维护">
        <p className="text-sm text-muted-foreground">重置所有 CMS 数据（商品、分类、首页、活动、评价、图片）回到种子状态。</p>
        <Btn tone="danger" onClick={() => { if (confirm("确认重置全部 CMS 数据？此操作不可撤销。")) { cms.resetAll(); toast.success("已重置"); } }}><RotateCcw className="size-3.5" /> 重置 CMS 数据</Btn>
      </Card>
    </div>
  );
}

// ── 8) AI 操作台 ────────────────────────────────────────────────────────────
const AI_TEMPLATES = [
  "通过表格批量发布商品",
  "通过自然语言修改商品信息（如：把所有 Bold 系列原价上调 10%）",
  "批量修改分类（如：把所有 Square 商品加入 Daily 系列）",
  "批量调整排序（如：把所有新品的 sortOrder 置为 1-20）",
  "批量生成商品卖点 bullets",
  "批量生成或修改评价",
  "批量替换图片 URL（如：把 unsplash 替换为自家 CDN）",
  "批量设置活动（如：所有 Eyeglasses 类目 9 折，至月底）",
  "批量翻译商品文案（中→英 或 英→中）",
];

export function AIConsoleModule() {
  const logs = useCMS((s) => s.aiLogs);
  const [instruction, setInstruction] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function parsePreview() {
    if (!instruction.trim() && !csvName) { toast.error("请先输入指令或上传 CSV"); return; }
    const mockChanges = [
      `检测到 ${Math.floor(Math.random() * 8) + 2} 个商品将受到影响`,
      `字段变更：name / price / categoryIds / bullets`,
      `预计执行时间：${Math.floor(Math.random() * 8) + 2}s`,
      `回滚策略：自动保存快照（可在右侧"操作日志"回滚）`,
    ];
    setPreview(mockChanges.join("\n"));
  }
  function apply() {
    if (!preview) return;
    cms.addAILog({ instruction: instruction || `CSV: ${csvName}`, source: csvName ? "csv" : "text", preview, appliedAt: Date.now() });
    toast.success("已应用（mock）");
    setInstruction(""); setCsvName(null); setPreview(null);
  }

  return (
    <div>
      <PageHeader title="AI 操作台" desc="为未来 OpenClaw 接入预留的批量运营接口" />
      <Card className="mb-4 border-dashed border-foreground/30 bg-primary/5">
        <p className="text-sm">
          <Sparkles className="size-4 inline -mt-0.5 mr-1.5 text-foreground" />
          未来可通过 OpenClaw 调用此接口，使用表格或自然语言批量完成商品发布、分类修改、评价生成、图片替换等操作。当前为占位 UI，所有操作仅保存到本地操作日志。
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-4">
        <Card title="① 输入指令">
          <Field label="自然语言指令">
            <textarea rows={6} className={inputCls} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="例如：把所有 Bold 系列原价上调 10%，并把新品的 sortOrder 置为 1-20" />
          </Field>
          <Field label="或上传表格（CSV / Excel）">
            <label className="block border border-dashed border-border rounded-lg px-3 py-6 text-center cursor-pointer hover:bg-secondary/30">
              <Upload className="size-5 mx-auto text-muted-foreground" />
              <div className="text-xs mt-2 text-muted-foreground">{csvName ?? "点击或拖拽文件到此处上传"}</div>
              <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => setCsvName(e.target.files?.[0]?.name ?? null)} />
            </label>
          </Field>
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-1.5">快捷指令模板</div>
            <div className="flex flex-wrap gap-1.5">
              {AI_TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => setInstruction(t)} className="text-[11px] px-2 py-1 rounded-md bg-secondary hover:bg-secondary/70">{t}</button>
              ))}
            </div>
          </div>
          <Btn tone="primary" onClick={parsePreview}><Sparkles className="size-3.5" /> 解析并预览</Btn>
        </Card>

        <Card title="② 预览变更">
          {!preview ? <p className="text-sm text-muted-foreground">还未生成预览。请在左侧输入指令后点击「解析并预览」。</p> : (
            <>
              <pre className="text-xs bg-secondary/40 border border-border rounded p-3 whitespace-pre-wrap">{preview}</pre>
              <div className="flex gap-2">
                <Btn tone="primary" onClick={apply}><Check className="size-3.5" /> 应用变更</Btn>
                <Btn onClick={() => setPreview(null)}>放弃</Btn>
              </div>
              <p className="text-[11px] text-muted-foreground">应用后会在右侧操作日志中生成一条记录，可随时回滚。</p>
            </>
          )}
        </Card>

        <Card title="③ 操作日志">
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">暂无记录</p> : (
            <ol className="space-y-3">
              {logs.map((l) => (
                <li key={l.id} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>{new Date(l.createdAt).toLocaleString()}</span>
                    {l.rolledBackAt ? <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300">已回滚</span>
                      : l.appliedAt ? <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">已应用</span>
                      : <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">未应用</span>}
                  </div>
                  <p className="text-xs mt-1 line-clamp-2">{l.instruction}</p>
                  <div className="text-[11px] text-muted-foreground mt-0.5">来源：{l.source === "csv" ? "表格" : "自然语言"}</div>
                  <div className="flex gap-1 mt-2">
                    {!l.appliedAt && !l.rolledBackAt && <Btn size="sm" tone="primary" onClick={() => cms.applyAILog(l.id)}>应用</Btn>}
                    {l.appliedAt && !l.rolledBackAt && <Btn size="sm" tone="danger" onClick={() => cms.rollbackAILog(l.id)}><RotateCcw className="size-3" /> 回滚</Btn>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

// suppress unused import warning
void Flame; void Star; void ChevronRight;
