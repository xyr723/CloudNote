# Note Editor H5 Preview Mode 设计

## 背景

上一轮已经补齐：

- 默认 `EditorProvider`
- `H5DocumentPreview`
- `RichDocument -> HTML -> WebView` 的只读预览链路

但 `src/features/note-editor/ui/NoteEditorModal.tsx` 仍然完全停留在原生输入链路，H5 预览壳没有进入正式编辑入口。这会导致 H5 能力虽然存在，却无法在主编辑流程中被真实使用和验证。

## 目标

本轮只做一个最小接线：

- 在 `NoteEditorModal` 中新增“编辑 / 预览”模式切换
- 预览模式复用现有 `H5DocumentPreview`
- 继续保留原生编辑态、工具栏和媒体编排逻辑
- 让 H5 壳进入正式编辑入口，但保持只读

## 非目标

本轮不做以下事项：

- 不把原生编辑区替换成 WebView 编辑器
- 不实现 WebView 与原生状态的双向同步
- 不为图片 / 音频落地正式 H5 block 协议
- 不接 Widget Registry

## 方案对比

### 方案 A：直接替换主编辑区为 WebView

优点：

- 最接近最终形态

缺点：

- 需要同时解决输入、选区、媒体插入、保存时序
- 风险过高，不适合作为当前最小增量

### 方案 B：新增编辑 / 预览切换

优点：

- 改动最小
- 现有原生编辑链路不受影响
- H5 能力能进入真实用户流程

缺点：

- 当前仍然是“原生编辑 + H5 预览”，不是正式 H5 编辑器

### 方案 C：新开独立 H5 预览页面

优点：

- 入口隔离最强

缺点：

- 没有接进正式编辑流程
- 用户切换成本更高

## 推荐方案

采用方案 B：在 `NoteEditorModal` 中新增编辑 / 预览切换。

原因：

- 这是当前阶段最小、最稳妥、最容易验证的接线方式
- 可以尽快验证 H5 预览在真实编辑数据上的表现
- 为后续 WebView 双向编辑和 Widget Registry 留出真实宿主

## 结构调整

### 新增组件

- `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
  - 接收当前编辑中的 `content`
  - 将 marker 文本整理成更适合预览的占位内容
  - 通过 `EditorProvider.parse()` 转成 `RichDocument`
  - 交给 `H5DocumentPreview` 渲染

### 现有组件调整

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 新增编辑 / 预览模式状态
  - 编辑态继续渲染 `EditNoteContent + EditNoteToolbar`
  - 预览态改为渲染 `NoteEditorPreviewPane`

## 数据流

1. `NoteEditorModal` 继续产出当前 `editorContent`
2. 预览模式下把 `editorContent` 传给 `NoteEditorPreviewPane`
3. `NoteEditorPreviewPane` 对图片 / 音频 marker 做最小占位整理
4. 通过 `EditorProvider.parse()` 生成 `RichDocument`
5. `H5DocumentPreview` 再通过 `renderHtml()` 渲染到 `WebView`

## 风险

- 当前图片 / 音频仍只是占位文本，不是正式 H5 block
- 标题仍保留在原生输入区，尚未进入 H5 文档模型
- 真正的正式 H5 编辑态仍需要单独处理输入和同步协议

## 完成标准

- `NoteEditorModal` 中可以切到 H5 预览模式
- 预览模式会消费当前编辑内容，而不是旧快照
- 现有原生编辑态和工具栏行为不回退
- 新增测试通过，且全量验证通过
