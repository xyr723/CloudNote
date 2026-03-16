# Note Editor H5 Media Insert 设计

## 背景

当前 H5 编辑态已经具备：

- `content + textSegments` 双向同步
- 粗体 / 斜体桥接
- 全局字号同步
- 已有图片 / 音频 marker 删除

但 H5 仍然不能新增媒体，根因不是图片或录音入口缺失，而是 H5 侧还没有把绝对选区 / 光标位置同步回 RN。

现有 RN 媒体插入链已经完整存在：

- 图片：`useNoteMedia.handleImagePicker / handleCamera`
- 音频：`useNoteRecording.handleRecordingToggle`
- marker 插入：`appendSelectedImages / insertMarkerAtCursor / insertMarkerIntoTextSegments`

这些链路都依赖同一个输入：`cursorPosition`。

## 目标

本轮只做 H5 媒体新增的最小闭环：

- H5 把绝对 `selection.start / selection.end / cursorPosition` 回传 RN
- `NoteEditorModal` 在 H5 模式下复用现有图片入口与录音入口
- 图片 / 音频 marker 继续走 RN 既有插入逻辑
- 插入后通过既有 `content + textSegments` 同步链回写 H5

## 非目标

- 不做 H5 内部文件选择器
- 不做拖拽上传 / 粘贴上传
- 不做 H5 原生录音 UI
- 不新增 H5 专属图片 / 音频插入命令
- 不改变当前 marker 的 DOM 表达方式

## 方案对比

### 方案 A：在 H5 内直接实现图片选择和录音

优点：

- H5 端看起来更独立

缺点：

- 会重复实现现有 RN 媒体链
- 需要处理权限、上传、保存、索引重排
- 范围明显过大

### 方案 B：只补选区协议，继续复用 RN 媒体入口

优点：

- 改动最小
- 直接复用现有图片 / 音频插入链
- 与 native 模式保持一致的插入语义

缺点：

- H5 仍然依赖 RN 工具栏和原生弹层

### 方案 C：先强制只在末尾追加媒体

优点：

- 协议最简单

缺点：

- 行为和 native 不一致
- 用户已经在正文中定位光标时会插到错误位置

## 推荐方案

采用方案 B：只补 `selection-change` 协议，媒体入口继续复用 RN。

原因：

- 当前缺口的真正阻塞点就是 `cursorPosition`
- 既有图片 / 音频插入逻辑已经稳定且有测试覆盖
- 最符合本轮“最小变更、先补闭环”的目标

## 结构调整

### H5 feature

- `src/features/h5-editor/model/h5TextEditorBridge.ts`
  - 扩展 `selection-change` 消息解析
  - 在光标移动、选择变化、点击、输入后回传绝对选区
  - 统一把 `cursorPosition` 定义为绝对 `selection.start`

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 新增 `onSelectionChange` 回调
  - 收到 `selection-change` 时透传给 RN

### note-editor

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - H5 模式把 `onSelectionChange` 接到 `formatting.handleEditorSelectionChange`
  - H5 模式重新启用图片入口
  - H5 模式重新启用录音按钮
  - 图片入口继续通过 `NoteImageEntryFlow`

## 数据流

1. 用户在 H5 编辑器中移动光标或改变选区
2. WebView 发送 `selection-change`，包含绝对 `start / end / cursorPosition`
3. `H5TextDocumentEditor` 转发给 `NoteEditorModal`
4. `NoteEditorModal` 更新 formatting 内部 `selection + cursorPosition`
5. 用户点击图片或录音按钮
6. RN 继续调用现有 `useNoteMedia` / `useNoteRecording`
7. RN 在当前 `cursorPosition` 处插入 marker，并更新 `content + textSegments`
8. H5 编辑器通过既有同步链收到新增媒体后的最新正文

## 关键约束

- `cursorPosition` 必须与 native 语义保持一致，使用绝对 `selection.start`
- marker 在 H5 中仍然是不可直接编辑的占位节点，但其文本长度必须计入绝对选区计算
- 这轮不处理“用媒体替换当前选区”，维持现有插入语义

## 风险

- H5 DOM 中 marker 是 `contenteditable="false"` 节点，选区计算必须把 marker 文本长度准确折算进绝对位置
- H5 输入与选区事件可能高频触发，需要保持协议简单，避免额外状态同步循环
- 这轮只恢复 RN 工具栏入口，不会新增 H5 自身的上传手势

## 完成标准

- H5 模式下移动光标后，RN 能拿到正确的绝对 `selection + cursorPosition`
- H5 模式下可以从相册选择图片并插入 marker
- H5 模式下可以拍照插入图片 marker
- H5 模式下可以开始 / 停止录音并插入音频 marker
- 插入后 `content / textSegments / images / audios` 同步正确
- 相关测试通过
