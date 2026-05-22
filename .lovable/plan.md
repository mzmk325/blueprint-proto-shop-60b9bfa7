# Miravue 后台 CMS 升级方案

把现有 mock 管理页升级为面向中国运营团队的"运营级 CMS + AI 操作台"。前台仍英文为主、保持现有 mock 数据；后台全面中文化并加入产品/分类/首页/评价/活动/AI 模块。仍然使用前端 mock store（localStorage），但数据结构按可对接后端 API 的方式设计。

## 范围

仅修改后台 `/admin`，新增模块和数据 store。前台只做一处微调：让首页/产品/分类/促销条读取新的 CMS store（带 fallback 到现有 mock），避免破坏现有页面。

## 信息架构

后台改为左侧导航 + 右侧内容区，多板块：

```text
仪表盘            概览数据、待办、近期订单
订单管理          原有订单列表/详情，标签/状态全部中文
处方审核          原有 Rx review 队列
质检工作台        原有 QC 工作台
发货管理          Ready to ship / 物流追踪
售后问题          退换/投诉占位
商品管理          列表 + 编辑器（含 variants/图片组）
分类管理          多类型分类 CRUD
首页装修          Hero/类目卡/Shape/Promo 条
图片素材          上传槽 + URL 输入 + 推荐尺寸
评价管理          产品评价 CRUD + 商品内生成入口
活动/折扣设置     首单/第二副半价/全站活动
语言与币种        前台语言币种开关（沿用现有）
AI 操作台         指令框/表格/预览/日志（mock）
```

## 数据模型 (`src/lib/cms-store.ts`)

新建中央 store，localStorage 持久化，提供 `useXxx` hooks。模型：

- `CMSProduct`：扩展现有 `Product`，新增 `nameEn, subtitle, sku, status('draft'|'published'|'unpublished'), cost, joinSitePromo, publishedAt, sortOrder, featured, hot, newOverride('auto'|'force-in'|'force-out'), faceShape[], styleTags[], description, bullets[], categoryIds[], seoTitle, seoDesc, variants:[{color, hex, images[]}]`
- `CMSCategory`：`id, name, nameEn, type('main'|'gender'|'shape'|'series'|'campaign'|'hidden'), slug, image, sortOrder, showInNav, showOnHome, enabled, productCount(derived)`
- `CMSReview`：`id, productId, user, country, stars(1-5), body, images[], publishedAt, visible, sortOrder, featured`
- `CMSPromotion`：`id, type('first-order'|'second-half'|'sitewide'), title, frontCopy, percent, enabled, priority, startAt, endAt`
- `CMSHero / CMSCategoryCard / CMSShapeBanner / CMSPromoBar`：首页装修各组
- `CMSAsset`：`id, kind('hero-desktop'|'hero-mobile'|'category'|'shape'|'product'|'pdp'|'review'), url, width, height, uploadedAt`
- `CMSSettings`：`newArrivalDays(default 30)`, 默认排序字段
- `CMSAILog`：`id, instruction, source('text'|'csv'), preview, appliedAt|null, rolledBackAt|null`

种子数据从现有 `products.ts/categories` 转换一次（首次加载时迁移）。

## 关键派生逻辑

- **新品规则**：`isNewArrival(p) = p.newOverride==='force-in' || (p.newOverride!=='force-out' && daysSince(p.publishedAt) <= settings.newArrivalDays)`
- **多分类**：商品 `categoryIds[]`；分类列表显示关联数 `products.filter(p => p.categoryIds.includes(c.id)).length`
- **排序**：列表按 `sortOrder asc` 默认，可切 `publishedAt | price | hot | featured | new`
- **促销**：仅启用 `priority` 最高的一个生效；其它显示"被覆盖"标记。首单折扣由前台 Cart 自动应用（mock：判断 localStorage `hasOrdered`）。

## 模块设计要点

### 商品管理
- 列表：搜索/筛选（状态、分类、新品、热卖）、批量操作（上架/下架/删除/复制）
- 编辑器：分 Tab — 基本信息 / 价格库存 / 颜色与图片 / 分类与标签 / 尺寸参数 / SEO / 评价
- Variants UI：每个颜色行 + 多张图片 URL 槽
- 操作：保存、复制、上架/下架、删除、预览（跳前台 PDP）

### 分类管理
- 列表 + 类型筛选 + 关联数 + 启用开关 + 排序
- 编辑：名称/英文/类型/slug/图片/导航与首页开关

### 首页装修
- 四块 Tab：Hero / 类目卡 / Shape / Promo 条
- 每块卡片化编辑 + 排序 + 启用 + 时间窗（Hero）
- "预览前台"链接

### 图片素材
- 卡片栅格：缩略图、用途、尺寸；每个用途显示"推荐 1920×760"等
- 添加方式：URL 输入（mock 上传）

### 评价管理
- 列表：商品、用户、国家、星级、可见性、排序
- 商品编辑器内的"生成起始评价" mock 按钮（产生 3 条）

### 活动/折扣设置
- 单页：三类活动卡片，开关、优先级、文案、时间
- 顶部提示："当前生效：首单 15% 折扣"

### AI 操作台
- 顶部说明卡（OpenClaw 提示文案，原文已给）
- 左：指令输入框（textarea）+ "解析"按钮；CSV 上传槽
- 中：预览变更（mock 显示 diff 表）
- 右：操作日志 + 回滚
- 9 个"未来工作流"以可点击的快捷指令模板呈现

### 仪表盘
- 顶部数字卡：今日订单、待审处方、待质检、待发货、生效活动
- 下方：近 7 天订单趋势 mock、低库存提示、AI 建议占位

## 中文化

所有 admin 文案直接以中文字符串硬编码（无需经过 i18n）。订单状态映射表：
`pending→待处理, rx-pending→处方待审, prism-review→棱镜复核, pd-unknown→PD 待补, uploaded→处方已上传, sourcing→采购中, lab-production→镜片加工, qc→质检中, ready-to-ship→待发货, shipped→已发货, delivered→已送达, on-hold→挂起, cancelled→已取消`

复制按钮、风险与提醒、操作日志等均改中文。

## 文件结构

```
src/lib/cms-store.ts                  新增：CMS 数据与 hooks
src/lib/cms-seed.ts                   新增：从 products.ts 迁移种子
src/routes/admin.tsx                  改造为 Shell + Router-less sub-pages（用内部 tab/state）
src/components/admin/AdminShell.tsx   左侧导航 + 顶栏
src/components/admin/Dashboard.tsx
src/components/admin/OrdersModule.tsx   迁出现有订单 UI（中文化）
src/components/admin/RxReviewModule.tsx
src/components/admin/QcModule.tsx
src/components/admin/ShippingModule.tsx
src/components/admin/AfterSalesModule.tsx
src/components/admin/ProductsModule.tsx       列表 + 编辑器
src/components/admin/ProductEditor.tsx
src/components/admin/CategoriesModule.tsx
src/components/admin/HomeCmsModule.tsx
src/components/admin/AssetsModule.tsx
src/components/admin/ReviewsModule.tsx
src/components/admin/PromotionsModule.tsx
src/components/admin/LangCurrencyModule.tsx
src/components/admin/AIConsole.tsx
```

为避免一次性大重构出错，**`admin.tsx` 内现有订单/Rx/QC/发货代码搬到对应模块文件，逻辑保持不变只做中文化**。

## 前台兼容

前台继续使用现有 `products.ts`；CMS store 在 mount 时若发现未初始化则用 `products.ts` 种子。为了让"装修/促销"看得见，做以下最小接入：

- `Header` PromoBar 文案：若 CMS PromoBar 启用则取其文本
- `Home` Hero/类目卡/Shape：如果 CMS 已配置则取覆盖列表，否则用现有硬编码
- `Cart`：自动应用首单折扣（mock 判断 `localStorage.miravue_hasOrdered`）

不改前台样式与结构。

## 不做的事

- 不接真数据库/Auth/Stripe
- 不做真图片上传（仅 URL 输入 + 提示）
- 不真接 AI（仅占位 UI 与日志 mock）
- 不改前台视觉风格

## 实施顺序

1. CMS store + 种子 + 类型
2. AdminShell（左侧导航 + 中文菜单）
3. 把现有订单/Rx/QC/发货代码迁入模块文件并中文化
4. 仪表盘
5. 商品管理 + 编辑器（含 variants）
6. 分类管理
7. 首页装修
8. 图片素材
9. 评价管理
10. 活动/折扣
11. AI 操作台
12. 前台最小接入（PromoBar / 首单折扣）
13. 自测：每个模块至少 CRUD 一次

## 工作量预估

较大（一次完整执行）。完成后 `/admin` 将是一个完整中文运营后台原型，前台保持英文 mock 不变。
