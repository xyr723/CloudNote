# Note Editor H5 Text Sync 设计

## 背景

当前已经具备：

- 默认 `EditorProvider`
- `H5DocumentPreview`
- `NoteEditorModal` 中的 H5 只读预览模式

但主编辑流程仍然没有任何 WebView 双向编辑能力。`NoteEditorModal` 目前的正式编辑态完全依赖原生 `TextInput`，这意味着 H5 富文本链路虽然能预览，却仍不能参与正文编辑。

## 目标

本轮只做最小的 H5 正文双向文本同步：

- 标题继续保留原生输入
- WebView 只负责正文纯文本编辑
- RN 侧通过 `onMessage` 回写 `content` 和 `textSegments`
- 保留当前原生编辑态，H5 编辑作为并行模式接入

## 非目标

本轮不做以下事项：

- 不替换掉原生编辑态
- 不实现 H5 内的图片 / 音频编辑
- 不实现 H5 内的局部粗体 / 斜体富文本编辑
- 不接 Widget Registry
- 不处理选区、工具栏和命令式格式化协议

## 关键约束

### 纯文本范围

H5 编辑模式只支持纯文本正文。

原因：

- 当前 `note.content` 里的图片 / 音频仍以 marker 文本表达
- 如果让含媒体的笔记直接进入 H5 纯文本编辑，极易造成 marker 丢失或重排

因此：

- 当笔记包含图片或音频时，H5 编辑模式禁用
- 含媒体笔记仍可继续使用原生编辑和 H5 预览

### `textSegments` 退化策略

H5 编辑模式本轮不支持保留局部富文本片段。

因此当 WebView 回写正文时：

- RN 侧把整段正文收敛为一个文本 segment
- segment 继承当前默认字号和首段样式

这是有意的收敛，不是 bug。它避免在没有真正 H5 富文本协议的前提下伪造复杂片段同步。

## 方案对比

### 方案 A：直接把 `NoteEditorModal` 全量替换为 H5 编辑器

优点：

- 最接近最终目标

缺点：

- 同时引入输入、同步、媒体、工具栏、保存时序问题
- 风险过高

### 方案 B：新增 H5 正文编辑模式

优点：

- 改动集中
- 不回退现有原生编辑体验
- 可以真实验证 WebView -> RN 的同步闭环

缺点：

- 当前只支持纯文本正文

### 方案 C：继续停留在只读预览

优点：

- 没有新增同步复杂度

缺点：

- 无法推进“正式编辑态接线”

## 推荐方案

采用方案 B：新增 H5 正文编辑模式。

原因：

- 这是当前阶段最小、最可控、最容易验证的增量
- 能把 H5 从“只读壳”推进到“可编辑正文”
- 同时不把问题扩散到媒体和 Widget Registry

## 结构调整

### H5 feature

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 通过 `EditorProvider.parse()` + `renderHtml()` 生成初始可编辑 HTML
  - 监听 `WebView.onMessage`
  - 将正文文本回传给 RN
  - 在 RN 正文外部变化时，把最新内容重新注入 WebView

### note-editor

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 模式从“编辑 / 预览”扩成“原生 / H5 / 预览”
  - H5 模式仅在无图片、无音频时可用
  - H5 模式下复用原生标题输入，但正文改为 `H5TextDocumentEditor`

- `src/features/note-editor/model/useNoteFormatting.ts`
  - 新增“整段正文替换”入口
  - 负责把 H5 回写的纯文本同步到 `content` 和 `textSegments`

## 数据流

1. `NoteEditorModal` 进入 H5 模式
2. 当前正文传入 `H5TextDocumentEditor`
3. 组件通过 `EditorProvider` 生成初始 HTML
4. 用户在 WebView 中输入
5. WebView 通过 `postMessage` 把纯文本内容发回 RN
6. `useNoteFormatting` 把正文同步到 `content`，并把 `textSegments` 收敛为单段
7. 当 RN 侧正文因父级更新而变化时，再反向注入 WebView

## 测试策略

### H5 editor 组件测试

- 初始渲染会走 `parse()` 和 `renderHtml()`
- `onMessage` 会把正文同步回 RN
- 外部正文变化时会调用 `injectJavaScript()` 更新 WebView 内容

### note-editor 测试

- `NoteEditorModal` 可以切到 H5 模式
- H5 模式下正文变更会同步到 `onChangeContent` / `onChangeTextSegments`
- 含媒体笔记的 H5 模式按钮会禁用

## 风险

- H5 正文编辑当前不保留局部富文本样式
- WebView 输入时序仍可能与高频父级更新相互影响
- 这轮只解决正文文本同步，不代表正式富文本编辑已经完成

## 完成标准

- `NoteEditorModal` 中存在可用的 H5 正文编辑模式
- 纯文本正文可以通过 WebView 回写 RN 状态
- 含媒体笔记不会误入 H5 文本编辑模式
- 现有原生编辑和预览模式不回退
- 新增测试通过，且全量验证通过
