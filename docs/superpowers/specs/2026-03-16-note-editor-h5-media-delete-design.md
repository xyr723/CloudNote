# Note Editor H5 Media Delete 设计

## 背景

当前 H5 编辑态已经具备：

- `content + textSegments` 双向同步
- 粗体 / 斜体桥接
- 全局字号同步
- 媒体 marker 占位展示

但媒体能力仍缺一块关键闭环：

- H5 中能看到图片 / 音频 marker
- 但无法直接删除这些已存在的媒体占位

相比“新增媒体”，删除更适合作为下一步最小增量，因为 RN 侧已经有完整的 `handleDeleteImage / handleDeleteAudio` 和 marker 重排逻辑。

## 目标

本轮只做 H5 媒体删除闭环：

- H5 marker 上增加删除操作入口
- WebView 删除动作通过消息协议回传 RN
- RN 复用现有 `useNoteMedia` 删除链完成：
  - content 更新
  - textSegments 更新
  - images / audios 数组更新

## 非目标

- 不做 H5 媒体新增
- 不做 H5 选区插入点同步
- 不改已有粗体 / 斜体 / 字号桥接协议
- 不把媒体 marker 改成真实 block UI

## 方案对比

### 方案 A：允许直接在 DOM 中删除 marker

优点：

- 看起来最直接

缺点：

- RN 无法知道该删除哪个 image/audio 实体
- 仅靠 `content-change` 难以可靠更新数组和重排索引

### 方案 B：发送明确的 media-delete 消息

优点：

- 能直接复用 RN 现有删除链
- marker 重排逻辑不需要搬进 H5
- 风险最小

缺点：

- 需要扩展一条新的 WebView -> RN 消息类型

### 方案 C：一次做新增 + 删除

优点：

- 功能更完整

缺点：

- 新增仍缺 H5 插入点协议
- 范围会被拉大到选区和插入位置同步

## 推荐方案

采用方案 B：发送明确的 `media-delete` 消息。

原因：

- 删除链在 RN 侧已经存在
- H5 只负责发意图，不负责维护媒体数组
- 最符合当前“最小变更、复用现有能力”的原则

## 结构调整

### H5 feature

- `src/features/h5-editor/model/h5TextEditorMarkup.ts`
  - 为 marker 增加删除按钮 HTML 和数据属性

- `src/features/h5-editor/model/h5TextEditorBridge.ts`
  - 扩展 `media-delete` 消息解析
  - 监听 marker 删除按钮点击并回传 `{kind, index}`

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 新增 `onDeleteMedia` 回调
  - 收到 `media-delete` 时转发给 RN

### note-editor

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - H5 模式把 `onDeleteMedia` 接到现有 `useNoteMedia` 删除 handler

## 数据流

1. 用户在 H5 模式点击 marker 删除按钮
2. WebView 发送 `media-delete` 消息，包含 `kind + index`
3. `H5TextDocumentEditor` 将消息转给 `NoteEditorModal`
4. `NoteEditorModal` 调用 `media.handleDeleteImage` 或 `media.handleDeleteAudio`
5. RN 侧更新 content、textSegments、images / audios
6. H5 editor 通过既有 props 同步链收到删除后的最新状态

## 风险

- 图片删除链当前依赖已有的延时重排逻辑，需要测试覆盖
- 这轮做的是“删除闭环”，新增媒体仍然缺 H5 插入点协议

## 完成标准

- H5 模式下可删除图片 marker
- H5 模式下可删除音频 marker
- 删除后 content / textSegments / images / audios 都同步正确
- 全量测试通过
