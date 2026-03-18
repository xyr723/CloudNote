# Live Text Document Mirror 设计

## 背景

当前编辑器里同时存在三套与正文相关的状态：

- `content`
- `textSegments`
- `document`

其中：

- `content + textSegments` 仍是当前真实编辑链路
- `document` 主要只承载 widget block
- 预览态还会再次 `parse(content)` 并与 widget block merge

这带来两个直接问题：

1. 文本一旦在 H5、AI、媒体 marker 链路里变化，`document` 不会同步更新
2. 预览态和保存态都在重复做“再解析一次正文 + 再合并 widget”的工作

在 widget 白名单、H5 widget 区按位置插入、H5 内部媒体入口都已经收口后，下一步不适合直接跳到完整 block editor 或“document 唯一事实来源”。更合理的第一刀，是先把 `document` 收敛成 **当前文本 + widget 的实时镜像**。

## 目标

本轮只做 `document-first` 的第一阶段：

- `NoteEditorModal` 的 `draftDocument` 在文本变化时也实时更新
- 更新来源覆盖：
  - H5 富文本回写
  - AI 追加文本
  - 媒体 marker 插入/删除
  - 原生文本编辑链路
- 继续保留 `content + textSegments` 作为当前编辑事实来源
- 预览态优先直接消费这份 live `document`
- H5 编辑态继续只消费 widget document，避免因为文本 mirror 导致 WebView 全量重同步

## 非目标

本轮不做：

- 不把 `document` 升级为唯一事实来源
- 不做正文文本块之间任意位置插 widget
- 不做 WebView 内联 widget 编辑
- 不把图片/音频 marker 升级成正式 document block
- 不重写 `useNoteFormatting` / `useNoteMedia` 的现有编辑链

## 方案对比

### 方案 A：直接把编辑链完全切到 `document`

优点：

- 最终形态最干净

缺点：

- 需要同时重写原生编辑、H5 编辑、媒体 marker、AI 追加、widget merge
- 当前明显超出可控范围

### 方案 B：只让预览态消费 `document`

优点：

- 改动小

缺点：

- `document` 本身仍然可能落后于正文
- 只是把问题推迟，没有消除漂移

### 方案 C：把 `document` 做成 live mirror，同时保留现有编辑源

做法：

- 仍由 `content + textSegments` 驱动编辑
- 每次正文变化时，解析出当前文本 document
- 再与当前 widget blocks 合并成 live `RichDocument`
- 预览态优先复用这份 live `document`
- H5 编辑态继续只看 widget blocks

优点：

- 能先消除三套状态漂移
- 范围可控，不需要直接重写编辑器
- 为后续真正 `document-first` 收口提供稳定中间层

缺点：

- 仍然是“双写”阶段，不是最终架构

## 推荐方案

采用方案 C：**先做 live text document mirror**。

原因：

- 这是当前最小、最稳的过渡步骤
- 能先把 `document` 从“widget 专用存储”提升到“当前预览镜像”
- 不会与后续 block editor 或正文混排 widget 设计绑死

## 架构设计

### 1. 统一正文镜像输入

新增一个共享 helper，把当前 `content` 规范化为 document mirror 的文本输入：

- 普通文本保持不变
- `[图片0]` 转成 `图片占位 1`
- `[音频0]` 转成 `音频占位 1`
- 多余空行压缩为双换行

这样：

- 预览态和 live mirror 使用同一套正文语义
- 不需要在当前阶段把媒体 marker 升级成正式 block

### 2. `NoteEditorModal` 内维护 live `draftDocument`

在 `NoteEditorModal` 里新增文本 mirror 同步逻辑：

- 当正文内容变化时，用 editor provider 解析规范化后的文本输入
- 取当前 `draftDocument` 中已有的 widget blocks
- 通过 `mergeTextDocumentWithWidgets()` 生成下一份 live document
- 更新本地 `draftDocument`
- 同步通过 `onChangeDocument` 回写到上层 draft

这一步让 `document` 不再只在 widget 变化时更新。

### 3. H5 编辑态继续只拿 widget document

虽然 `draftDocument` 会包含文本 blocks，但 H5 编辑态不应该因此在每次正文变更后都收到新的完整 document。

因此在 `NoteEditorModal` 中派生出一份 **widget-only document** 传给 `H5TextDocumentEditor`：

- 只保留 widget blocks
- 文本仍继续通过 `content + textSegments` 传入

这样可以继续保持当前 H5 编辑器的稳定光标语义，不因为 text mirror 导致整页重新同步。

### 4. `NoteEditorPreviewPane` 优先消费 live document

`NoteEditorPreviewPane` 增加一个快速路径：

- 如果传入的 `document.plainText` 与当前规范化正文一致
- 则直接渲染这份 `document`

否则仍回退到现有逻辑：

- 重新 parse 正文
- 再 merge widget

这样可以兼容旧数据，也能在新链路下避免重复解析。

## 数据流

### H5 富文本回写

1. H5 编辑器通过 `onChangeState` 回传新正文
2. `useNoteFormatting` 更新 `content + textSegments`
3. `NoteEditorModal` 监听到正文变化
4. 重新生成 live `draftDocument`
5. 预览态直接消费这份新 document

### AI 追加文本

1. AI 返回追加文本和可选 widgets
2. 现有链路先更新 `content + textSegments`
3. live mirror 重新生成文本 blocks
4. widget 仍沿用现有 append/insert 链
5. 最终 `draftDocument` 同时包含新文本和 widgets

### 媒体 marker 插入

1. 原生/H5 触发现有媒体插入链路
2. `content + textSegments` 写入 `[图片n]` / `[音频n]`
3. live mirror 将其规范化为“图片占位 n / 音频占位 n”文本块
4. 预览态无需再额外推导一次

## 边界与约束

- live mirror 仍是 derived state，不是新的编辑真相
- 当前 `document` 里的文本 block 仍是“预览友好文本”，不是最终媒体 block 设计
- widget 排序仍只依赖 `document` 里的 widget blocks
- 只要 widget blocks 不变，H5 编辑态收到的 widget document 也应保持稳定

## 测试设计

### `src/features/note-editor/model/noteEditorDocument.test.ts`

覆盖：

- marker 文本规范化
- `plainText` 同步判定
- widget-only document 提取

### `src/features/note-editor/ui/NoteEditorModal.test.tsx`

覆盖：

- H5 富文本回写后会同步新的 live document
- AI 追加文本后会同步新的 live document
- 媒体 marker 插入后会同步新的 live document
- AI 追加 widgets 时，最终 document 同时保留文本 mirror 和 widget blocks

### `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

覆盖：

- 当传入 document 已与正文同步时，直接渲染 document，不再调用 parse
- 当传入 document 不同步时，继续回退到 parse + merge 逻辑
