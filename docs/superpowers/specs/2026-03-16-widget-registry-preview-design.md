# Widget Registry Preview 设计

## 背景

当前项目已经具备：

- `WidgetSchema` 类型定义
- `RichDocument` 中的 `widget block`
- AI provider 返回 `widgets` 的能力
- `LocalHtmlEditorProvider.renderHtml()` 对 `widget block` 的 HTML 占位输出
- `H5DocumentPreview` 通过 `WebView` 承载整份文档 HTML 预览

但 Widget Registry 仍未真正接入预览链路。

当前现状是：

- 预览态只能看到 `widget-placeholder`
- H5 编辑态也只是保留 widget 占位
- note editor 的 AI 补全链当前只消费 `result.text`，不会把 `result.widgets` 纳入状态

因此这轮要解决的问题，不是“让 AI 生成 widget 进入编辑器”，而是先把 `RichDocument` 里已经存在的 `widget block` 变成真正的受控前端组件渲染。

## 目标

本轮只做 Widget Registry 的预览基础设施：

- 预览态中，`RichDocument.blocks` 里的 `widget block` 可以被真实渲染
- `todo-list` 作为首个真实 widget 类型落地
- 其余 widget 类型先走统一 fallback 卡片
- H5 编辑态继续保留 widget 的只读占位，不做交互编辑

## 非目标

- 不把 AI provider 返回的 `widgets` 接进 note editor 状态
- 不修改 `completeNoteEditorTextWithAi()` 的返回结构
- 不做 widget 的插入、删除、拖拽、重排或属性编辑
- 不扩展 H5 编辑器的 widget 双向协议
- 不升级 `EditorProvider` 的核心契约

## 方案对比

### 方案 A：继续全量依赖 WebView，在 HTML 内 hydration widget

做法：

- `renderHtml()` 继续输出 widget 占位 HTML
- 在 `WebView` 内再注入一层浏览器脚本，把占位升级成 widget

优点：

- 表面上仍是单个 H5 宿主

缺点：

- 要在浏览器侧再实现一套 registry
- 会把受控组件逻辑塞进 `WebView`
- 和 README 中“前端通过 widget registry 渲染为受控组件”的方向不一致

### 方案 B：混合宿主渲染，RN 渲染 widget，WebView 继续渲染文本块

做法：

- `H5DocumentPreview` 按 block 顺序渲染
- 连续文本类 block 继续交给 `EditorProvider.renderHtml() + WebView`
- `widget block` 交给新的 RN `WidgetRenderer`

优点：

- 边界清晰
- 符合“widget registry 是前端白名单渲染层”的目标
- 能保留现有 H5 文本渲染链

缺点：

- `H5DocumentPreview` 会从“单 WebView”变成“混合宿主”
- 需要额外处理文本段高度

### 方案 C：先升级 `EditorProvider`，输出结构化 preview model

做法：

- 给 `EditorProvider` 新增结构化预览协议
- 预览层不再依赖 HTML 字符串，而是解释结构化段落 + widget

优点：

- 长期结构最干净

缺点：

- 会扩散到 provider 契约和现有预览链路
- 范围明显超出本轮“最小闭环”

## 推荐方案

采用方案 B：混合宿主渲染。

原因：

- 能以最小改动接入真实 Widget Registry
- 不需要把 widget 运行时塞进 WebView
- 不会把问题扩散到 AI 状态、保存格式或编辑协议

## 架构设计

### 1. 新增 widget-renderer feature

新增 `src/features/widget-renderer/**`，作为独立受控渲染层：

- `model/widgetRegistry.ts`
  - 定义 widget 白名单映射
  - 负责 `widget.type -> React 组件` 的查找

- `ui/WidgetRenderer.tsx`
  - 对外统一渲染入口
  - 根据 registry 决定渲染真实 widget 还是 fallback

- `ui/TodoListWidget.tsx`
  - 本轮唯一真实 widget
  - 只做只读渲染，不做交互写回

- `ui/FallbackWidgetCard.tsx`
  - 未实现类型统一走这里
  - 稳定展示 `title / description / actions / layout`

### 2. H5DocumentPreview 改成混合宿主

当前 `H5DocumentPreview` 直接把整份文档一次性渲染成 HTML。

本轮改为：

- 遍历 `document.blocks`
- 将连续的非 widget block 合并成 `html segment`
- 每个 `html segment` 继续调用 `EditorProvider.renderHtml()`
- 每个 `widget block` 单独交给 `WidgetRenderer`

这样：

- 文本、列表、引用、代码块仍复用现有 H5 渲染链
- widget 则改为原生白名单组件
- 文档顺序可以完整保留

### 3. 文本 segment 的最小高度适配

因为混合宿主不能再依赖“整页 WebView 自己滚动”，需要让每个 HTML 片段高度可控。

因此新增一个很薄的组件，例如：

- `src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.tsx`

职责：

- 渲染单个 HTML segment
- 通过 `postMessage` 把内容高度回传 RN
- 用该高度撑开 `WebView`

它只处理预览高度，不参与 widget 渲染，也不承担文档分段逻辑。

### 4. 保持编辑态不扩范围

`H5TextDocumentEditor` 与 `LocalHtmlEditorProvider.renderHtml()` 保持现状：

- 继续输出 widget placeholder
- widget 在 H5 编辑态里仍是只读占位
- 不做选中、编辑、插入、删除协议

这样可以保证：

- 预览态和编辑态职责清晰
- 这轮只解决“预览真实渲染”
- 不影响已经稳定的 H5 正文同步链

## 数据流

### 预览态

1. 上层传入 `RichDocument`
2. `H5DocumentPreview` 按 block 顺序切分：
   - 连续非 widget block -> `html segment`
   - 单个 `widget block` -> `widget segment`
3. `html segment` 调用 `EditorProvider.renderHtml()`，渲染为自动高度的 `WebView`
4. `widget segment` 调用 `WidgetRenderer`
5. `WidgetRenderer`：
   - 命中 `todo-list` -> `TodoListWidget`
   - 其他类型 -> `FallbackWidgetCard`

### H5 编辑态

1. `EditorProvider.renderHtml()` 继续输出 widget placeholder
2. `H5TextDocumentEditor` 把 widget 当普通只读占位渲染
3. 不新增 widget 编辑行为

## 组件行为约束

### TodoListWidget

本轮只做只读展示：

- 读取 `widget.props.items`
- 仅接受字符串数组
- 非法输入降级为空列表
- 不抛异常，不做写回

### FallbackWidgetCard

对于未实现类型：

- 显示 `title`，没有则显示 `type`
- 显示 `description`
- 显示 action 标签列表（只展示，不执行）
- 读取 `layout.span / minHeight` 作为视觉提示，不引入复杂布局系统

## 文件落点

- Create: `src/features/widget-renderer/model/widgetRegistry.ts`
- Create: `src/features/widget-renderer/ui/WidgetRenderer.tsx`
- Create: `src/features/widget-renderer/ui/TodoListWidget.tsx`
- Create: `src/features/widget-renderer/ui/FallbackWidgetCard.tsx`
- Create: `src/features/h5-editor/model/previewDocumentSegments.ts`
- Create: `src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.tsx`
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.tsx`
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`
- Modify: `README.md`

## 测试策略

先补失败测试，再实现：

- `previewDocumentSegments` 纯函数测试
  - 验证 block 分段正确
  - 验证 widget block 不会被错误并入 HTML segment

- `WidgetRenderer` 测试
  - `todo-list` 会真实渲染 items
  - 其他类型会走 fallback

- `H5DocumentPreview` 测试
  - 混合渲染 HTML segment 和 widget segment
  - 文档更新时重新渲染

- `NoteEditorPreviewPane` 回归测试
  - 现有图片 / 音频 marker 占位预览不回归

## 风险

- 混合宿主后，文本 HTML 段需要稳定高度，否则预览会塌陷
- `todo-list` 的 `props` 当前没有严格 schema，需要做宽容解析
- 如果把 AI widgets 一并接入，这轮范围会迅速扩展到文档状态和保存格式，因此必须明确排除

## 完成标准

- `RichDocument` 中出现 `widget block` 时，预览态能真实渲染 widget
- `todo-list` 不再显示为 HTML 占位，而是显示为真实原生组件
- 其他 widget 类型至少能稳定显示 fallback 卡片
- 非 widget block 仍通过现有 `EditorProvider.renderHtml()` 预览
- H5 编辑态继续保留 widget 占位，不发生行为变化
- 相关测试通过，现有预览回归通过
