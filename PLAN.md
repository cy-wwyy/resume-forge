# 简历生成器 ResumeForge · 架构与实现 v3

自用、本地优先的「网页填写 → 实时预览 → 一键下载 PDF / PNG / JSON」。
参考：见效简历的交互骨架，去掉付费墙、账号体系和模板黑盒。

**已定方向**：React；一键下载、不走打印对话框；多格式（PDF/PNG/JSON）；数据存浏览器；
**静态优先 + 有服务自动升级**；不接 AI；仅中文；先做截图同款模板但保留多模板机制。

---

## 1. 已实现（M0–M3）

| 能力 | 状态 | 说明 |
|------|------|------|
| 三栏布局 + A4 实时预览 | ✅ | 侧栏模块 / 中间表单 / 右侧纸张，等比缩放 35%–140% |
| 数据模型与导入归一化 | ✅ | `shared/schema`，缺字段自动补，脏数据给可读报错 |
| 表单编辑 | ✅ | 9 类模块，增删改、显隐、上下移、富文本、照片压缩 |
| 自动保存 | ✅ | IndexedDB + 500ms 防抖 + `Cmd/Ctrl+S` + 「x 分钟前保存」 |
| 主题 | ✅ | 主题色、黑/宋体、字号、行距、模块间距、页边距、照片开关 |
| PNG 导出 | ✅ | 2x，多页 zip，纯前端 |
| 位图 PDF | ✅ | jsPDF，纯前端，静态部署可用 |
| 矢量 PDF | ✅ | 本地 Hono + Chromium `page.pdf()`，文字可选中 |
| 自动升级 | ✅ | 启动探活 `/api/health`，有服务走矢量，没有自动退化位图 |
| 打印导出 | ✅ | 同一套 `@page`，需要矢量又不启服务时的退路 |
| JSON 导出/导入 | ✅ | 带 `schemaVersion`，导入前确认，不静默覆盖 |
| 分页 | ✅ | 浏览器自然分页 + `break-inside: avoid` + 预览虚线参考线 |
| 条目时间位置 | ✅ | 主题项 `dateStyle`：左侧 / 最右侧 |
| 全屏编辑 | ✅ | 富文本弹层，Esc 退出 |
| 侧栏收起 | ✅ | 56px 图标栏，状态记在 localStorage |
| 模块排序 | ✅ | 侧栏 HTML5 原生拖拽；上移/下移/删除放在表单标题栏 |
| 年月选择 | ✅ | portal 面板，年份可切换年份网格，Esc/滚动自动收起 |
| 重置简历 | ✅ | 恢复示例骨架（高望舒/软件开发），保留模板与配色 |
| 基本信息字段 | ✅ | 统一成可拖拽 / 可显隐的字段列表，30 种类型（内置信息 + 联系方式 + 社交平台），PDF 内可点击 |

## 2. 待办（M4–M5）

- 第二套模板（双栏/衬线）+ 模板缩略图。
- 撤销/重做（50 步环形栈）、版本快照（保留最近 20 个）。
- 多份简历管理（列表 + 复制 + 重命名）。
- 自托管思源黑体，解决换机器字体漂移。
- 多页 PNG/位图 PDF 的智能切页（避免切断文字行）。
- 英文简历（另一套排版与字体，单独立项）。

---

## 3. 关键决策

| # | 决策 | 选择 | 理由 |
|---|------|------|------|
| D1 | 内容 / 表现 | 结构化 JSON 与模板彻底分离 | 换模板不动内容；自定义模块只是多一个 section |
| D2 | 预览与导出 | 同一套 `ResumeDocument` 渲染多处 | 导出与预览一致是结构性保证，不靠两套代码对齐 |
| D3 | 一键 PDF | 无头 Chromium `page.pdf()`（本地服务） | 无对话框、矢量文字、字体子集嵌入 |
| D4 | 静态可用 | 有服务升级矢量，没服务退位图 + 打印兜底 | 静态托管也能用；本机用能拿到最高质量 |
| D5 | 存储 | IndexedDB + JSON 导出 | 单机自用，容量够放照片；JSON 是唯一备份手段 |
| D6 | 富文本 | contentEditable + execCommand，粘贴转纯文本 | 只需加粗/列表/对齐，省掉 Tiptap 三个包 |
| D7 | 模板 | 代码级模板 + CSS 变量令牌 | 3–5 套足够，拖拽引擎成本高十倍 |

### 为什么不用纯前端矢量 PDF
浏览器没有「静默把 DOM 转矢量 PDF」的 API。`jsPDF`/`pdfmake` 不认 HTML 布局，只有两条路：
canvas 截图塞进 PDF（位图）或重写一遍排版（维护两套）。前者就是现在的静态模式，
后者被否决。所以要矢量就得上无头浏览器——这正是本地服务干的事。

---

## 4. 架构

```
┌──────────────────── 浏览器（React SPA） ────────────────────┐
│ app/        TopBar / Sidebar / 快捷键                        │
│ editor/     表单 + 富文本 + 字段组件                          │
│ preview/    ResumeDocument（纯展示）/ PreviewPane             │
│             ExportRoot（离屏 1:1）/ PrintRoot（打印）         │
│ templates/  注册表 + 令牌                                     │
│ store/      Zustand + immer + IndexedDB 持久化                │
│ export/     JSON / PNG / 位图 PDF / 矢量 PDF（懒加载）        │
└──────────────────────────┬───────────────────────────────────┘
                           │ POST /api/export {format:'pdf', resume}
┌──────────────────────────▼───────────────────────────────────┐
│ server/  Hono + playwright-core（仅监听 127.0.0.1）           │
│  · 复用单 Chromium，串行队列，空闲 5 分钟释放                  │
│  · 打开 /#/export → 注入数据 → 等字体/图片/两帧               │
│  · page.pdf({printBackground, preferCSSPageSize})            │
└──────────────────────────────────────────────────────────────┘
```

数据流：

```
输入 → store.patchX → 防抖 500ms → IndexedDB
                ↓
        ResumeDocument(resume, theme)
          ↓            ↓             ↓
    PreviewPane   ExportRoot    PrintRoot / #/export
```

### 导出页就绪协议
1. `/#/export` 渲染空白 A4，注册 `window.__setExportPayload`。
2. 服务端 `page.evaluate` 注入数据。
3. 页面在两帧后写 `html[data-export-ready="1"]`。
4. 服务端等该标记 + `document.fonts.ready` + 图片 `complete` + 120ms。
5. 出 PDF。任一步超时 → 500 + 可读错误，前端 toast。

### 断网 / 未启服务
启动时探活，失败则导出菜单标记「静态模式」，PDF 走位图，PNG/JSON 不受影响；
任何时刻都能继续编辑和备份。

---

## 5. 数据模型

```ts
Resume {
  id, name, schemaVersion, updatedAt,
  basics: { name, jobTitle, gender, age, phone, email, city,
            yearsOfExp, photo, extras[] },
  intent: { position, city, salary, availability },
  sections: Section[],     // 顺序即渲染顺序，visible 控制显隐
  theme: Theme,            // accent/fontFamily/fontScale/lineHeight/
                           // sectionGap/margin/showPhoto/titleStyle/dateStyle
  meta: { templateId, locale: 'zh-CN', page: 'A4' }
}

Section =
  education | work | project | skill | award | custom  → items[]
  summary → html
```

- 每个条目有 `id`，用于拖拽/折叠/局部更新；列表项的 `desc` 存 HTML，渲染前过白名单。
- `normalizeResume()` 负责补默认值、容错、版本迁移；导入用同一套。
- `theme.margin` 是 mm；`@page` 的 margin 必须是字面量，所以由 `PageStyle` 动态注入。

---

## 6. 导出矩阵

| 格式 | 实现 | 文字可选 | 体积（1 页） | 需要服务 |
|------|------|----------|--------------|----------|
| 矢量 PDF | Chromium `page.pdf()` | ✅ | ~60–100KB | 是 |
| 位图 PDF | canvas → jsPDF(JPEG) | ❌ | ~300–700KB | 否 |
| PNG 2x | html-to-image | — | ~300–500KB | 否 |
| JSON | Blob | — | ~10KB | 否 |
| 打印 | `window.print()` + `@page` | ✅ | — | 否（要确认对话框） |

无头截图有个坑：离屏节点是 `position:fixed; left:-20000px`，`html-to-image` 会把计算样式一起克隆，
内容整体移出画布 → 导出一张白纸。`captureSheet()` 里用 `style` 覆盖把克隆体拉回 `0,0`，
回归脚本再用「墨迹比例」断言防止再次出现。

---

## 7. 目录

```
shared/schema/{types,sample,normalize}.ts
shared/util/html.ts            白名单清洗、HTML→文本
src/app/{App,TopBar,Sidebar}.tsx
src/editor/{FormPane,forms,RichText}.tsx
src/components/{fields,Popover,Toast}.tsx
src/preview/{Document,PreviewPane,Roots}.tsx
src/templates/registry.ts
src/export/{index,download,raster,vector,node,ExportPage}.ts
src/store/{resumeStore,persistence}.ts
src/styles/{app,resume}.css
server/{index,renderer}.ts
scripts/{check-ui,check-export}.mjs
```

## 8. 风险与对策

| 风险 | 对策 |
|------|------|
| 导出空白 | 离屏定位问题已修；回归脚本断言墨迹比例 |
| 字体回退 | 截图前 `document.fonts.ready`；后续自托管字体 |
| 打印丢背景 | `printBackground: true` + `print-color-adjust: exact` |
| 多页切断行 | 矢量 PDF 由浏览器分页；位图切片是已知限制 |
| 并发导出 | 服务端串行队列 + 单实例 + 空闲回收 |
| 照片过大 | 上传即裁切压缩到 320×420 JPEG |
| 粘 Word 脏样式 | 粘贴强制纯文本 + 渲染前白名单 |
| 清缓存丢数据 | 顶栏显示保存时间；导出 JSON 是唯一备份 |

## 9. 校验

- `npm run typecheck`：TS 全量检查（含 server）。
- `scripts/check-ui.mjs`：改名→预览同步→刷新持久化→模块开关→JSON 往返。
- `scripts/check-export.mjs`：下载 PNG/矢量/位图三种产物，查尺寸、字体流、JPEG 流、非空白。
