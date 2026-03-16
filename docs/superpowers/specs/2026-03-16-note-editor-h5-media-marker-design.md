# Note Editor H5 Media Marker 设计

## 背景

当前已经具备：

- `NoteEditorModal` 的 H5 正文编辑模式
- WebView 到 RN 的纯文本正文双向同步

但 H5 编辑模式仍有一个明显限制：

- 只要笔记包含图片或音频，H5 模式就会被禁用

原因是当前媒体仍通过 `[图片N]` / `[音频N]` marker 存在于 `note.content` 中。如果直接把这些 marker 暴露在可编辑文本里，用户很容易在 WebView 中误删或改坏 marker，导致媒体与正文不同步。

## 目标

本轮只做最小媒体协议：

- H5 编辑模式允许打开含媒体的笔记
- 图片 / 音频 marker 在 WebView 中显示为不可编辑的原子占位块
- WebView 回写正文时仍然保留原始 marker 文本
- 图片 / 音频的新增、删除、重排仍继续走原生编辑态

## 非目标

本轮不做以下事项：

- 不在 H5 中新增图片 / 音频
- 不在 H5 中删除图片 / 音频
- 不在 H5 中展示真实图片缩略图或音频播放器
- 不处理局部富文本片段同步
- 不接 Widget Registry

## 方案对比

### 方案 A：继续禁用含媒体笔记的 H5 模式

优点：

- 风险最低

缺点：

- H5 编辑始终无法覆盖真实的媒体笔记
- 正式入口能力不完整

### 方案 B：把 marker 变成不可编辑原子块

优点：

- 改动集中
- 可以在不引入真正媒体编辑协议的前提下支持含媒体笔记
- 为后续真实媒体 block 留出桥接位

缺点：

- 当前只是占位块，不是完整媒体体验

### 方案 C：直接在 H5 中实现完整媒体 block

优点：

- 最接近最终形态

缺点：

- 需要同时处理上传、删除、排序、回写和 block 生命周期
- 范围过大

## 推荐方案

采用方案 B：把 marker 变成不可编辑原子块。

原因：

- 这是当前阶段最小但有效的媒体协议
- 可以把 H5 编辑从“纯文本可用”推进到“含媒体笔记可用”
- 不会把问题扩散到上传和 block 生命周期管理

## 结构调整

### H5 editor

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 初始 HTML 中把 marker 转成 `contenteditable="false"` 的占位块
  - WebView 内部序列化正文时，把占位块还原回 marker 文本
  - 拦截对 marker 的直接删除

### note-editor

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 移除“含媒体禁用 H5”限制
  - H5 模式可用于正文 + 媒体 marker 混排笔记

## 数据流

1. RN 将当前 `content` 传给 `H5TextDocumentEditor`
2. 初始 HTML 把 `[图片N] / [音频N]` 转成不可编辑占位块
3. 用户在 WebView 中编辑 marker 前后的文本
4. 序列化时，占位块重新还原成 marker 文本
5. RN 继续收到完整 `content`，不会丢 marker

## 风险

- 当前只能保护既有 marker，不支持在 H5 中新增或删除媒体
- WebView 里的键盘和选区边界仍有平台差异
- 占位块只是协议过渡层，不是最终 UI

## 完成标准

- 含媒体笔记可以进入 H5 编辑模式
- H5 中媒体 marker 显示为不可编辑占位块
- WebView 回写正文时 marker 不丢失
- 原生编辑态的媒体插入 / 删除行为不回退
- 新增测试通过，且全量验证通过
