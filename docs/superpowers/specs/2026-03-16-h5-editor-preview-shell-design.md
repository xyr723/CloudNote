# H5 Editor Preview Shell 设计

## 背景

仓库里已经有：

- `RichDocument` 结构化文档模型
- `EditorProvider` 接口
- `WidgetSchema` 与 AI provider 的 widget 输出能力

但当前仍缺两个关键落点：

- 没有任何 `EditorProvider` 实现
- 没有任何基于 `WebView` 的 H5 编辑器 / 预览壳

这意味着 README 里规划的“H5 富文本内核 + Widget 扩展点”仍停留在接口层，没有实际可运行的第一段链路。

## 目标

本轮只做一轮最小可验证的第一刀：

- 新增本地 `EditorProvider` 最小实现
- 新增只读 H5 文档预览壳组件
- 打通 `RichDocument -> HTML -> WebView` 链路
- 不替换现有 `NoteEditorModal` 正式编辑入口

## 非目标

本轮不做以下事项：

- 不把 `NoteEditorModal` 切到 H5
- 不实现 H5 编辑态双向同步
- 不落地 Widget Registry
- 不处理 Expo / Web 多端复用

## 方案对比

### 方案 A：只做 provider

优点：

- 改动最小

缺点：

- 没有 H5 壳，链路不完整

### 方案 B：只做 WebView 壳

优点：

- 能尽快看到 H5 容器

缺点：

- 没有 `RichDocument -> HTML` 能力
- 后续还是得再补 provider

### 方案 C：本地 provider + 只读预览壳

优点：

- 一次打通最小完整链路
- 不触碰当前正式编辑体验
- 为后续 Widget Registry 留出真实宿主

缺点：

- 改动比单点实现略多

## 推荐方案

采用方案 C：本地 `EditorProvider` + 只读预览壳。

原因：

- 这是当前阶段最小但完整的可运行闭环
- 既不把范围扩大到正式编辑器替换，也不让工作停留在抽象接口层
- 后续无论先接 Widget Registry 还是编辑态同步，都能复用这条底座

## 目标结构

### provider

- `src/providers/editor/local/localHtmlEditorProvider.ts`
  - 实现 `parse()`
  - 实现 `serialize()`
  - 实现 `renderHtml()`

- `src/providers/providerRegistry.ts`
  - 新增 `getEditorProvider()`
  - 默认返回本地 `LocalHtmlEditorProvider`

### feature

- `src/features/h5-editor/ui/H5DocumentPreview.tsx`
  - 接收 `RichDocument`
  - 通过 `EditorProvider.renderHtml()` 生成 HTML
  - 用 `WebView` 做只读预览

## 数据流

1. 上层传入 `RichDocument`
2. `H5DocumentPreview` 获取 `EditorProvider`
3. 通过 `renderHtml(document)` 生成 HTML 字符串
4. 将 HTML 作为 `WebView` 的 `source.html`
5. 对 widget block 先渲染成占位 HTML 节点，为后续 registry 留点

## 接口设计

### `LocalHtmlEditorProvider`

最小支持：

- `parse(input)`：把纯文本按空行拆成 paragraph blocks
- `serialize(document)`：把段落重新拼回纯文本
- `renderHtml(document)`：把 block 渲染成基础 HTML

支持的 block：

- `paragraph`
- `heading`
- `quote`
- `code`
- `list`
- `widget` 占位节点

### `H5DocumentPreview`

建议输入：

- `document`
- `theme`

内部自行持有：

- `html`
- `isLoading`

不引入编辑态回调，也不暴露 `WebView` 命令式接口。

## 测试策略

### provider 测试

- `parse()` 能把纯文本拆成 paragraph document
- `serialize()` 能把基础 document 拼回字符串
- `renderHtml()` 能输出段落、列表和 widget 占位 HTML

### 组件测试

- `H5DocumentPreview` 会调用 provider 生成 HTML
- `H5DocumentPreview` 会把生成结果传给 `WebView`
- 文档更新时会重新生成 HTML

## 风险

- 如果 HTML 转义没处理，后续会留下注入风险
- 如果 widget 占位节点结构定得太死，后续 registry 接入会受限
- 如果 providerRegistry 接线遗漏，组件会停留在不可运行状态

## 完成标准

- 仓库中存在可运行的 `EditorProvider` 默认实现
- 仓库中存在可运行的 H5 只读预览壳
- `RichDocument -> HTML -> WebView` 链路打通
- 新增测试通过，且全量验证通过
