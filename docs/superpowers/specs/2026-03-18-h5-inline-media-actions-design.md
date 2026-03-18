# H5 编辑器内部媒体入口设计

## 背景

当前 H5 编辑态已经具备：

- 文本编辑、富文本同步、媒体 marker 删除
- RN 工具栏复用图片选择、拍照、录音入口
- H5 widget 区的类型选择与按位置插入

但从用户视角看，H5 编辑器内部仍缺一个独立的媒体入口：

- 只能通过原生工具栏插入图片 / 音频
- H5 区域本身没有“就在这里加媒体”的动作提示
- WebView 内部看起来更像纯文本编辑器，而不是带媒体能力的 block 编辑容器

## 目标

本轮只补齐 **H5 内部动作入口**：

- 在 H5 编辑器内部提供：
  - 相册
  - 拍照
  - 录音
- 点击后通过 bridge 通知 RN
- RN 继续复用现有图片 / 录音插入链
- 插入后的 `content / textSegments / images / audios` 同步链不变

## 非目标

本轮不做：

- 不做 WebView 内真实 `<input type="file">`
- 不做拖拽上传 / 粘贴上传
- 不做 H5 原生录音 UI
- 不把 RN 工具栏媒体入口删掉
- 不改变 marker 的 DOM 结构和保存语义

## 方案对比

### 方案 A：在 WebView 内做真实文件选择器和录音

优点：

- H5 看起来最独立

缺点：

- 会复制现有 RN 权限、附件保存和 marker 插入逻辑
- iOS / Android WebView 兼容面会明显扩大

### 方案 B：在 H5 内做动作按钮，通过 bridge 复用 RN 现有链路

优点：

- 用户能在 H5 区域直接看到媒体入口
- 不重复实现上传、保存、marker 插入
- 改动边界清晰

缺点：

- 实际能力仍由 RN 承担，不是纯 Web 实现

### 方案 C：继续只保留 RN 工具栏入口

优点：

- 零新增实现

缺点：

- 仍然不能解决“H5 内部没有独立媒体入口”的问题

## 推荐方案

采用方案 B：**H5 内部动作按钮 + RN bridge 复用既有媒体链**。

原因：

- 这是最小但用户可见的补齐
- 与现有 widget bridge 的职责边界一致
- 不会和长期的 Expo / document-first 路线绑定

## 架构设计

### 1. 新增 `media-insert-request` bridge 消息

建议新增：

```ts
type H5MediaInsertRequestEvent = {
  type: 'media-insert-request';
  action: 'pick-image' | 'capture-image' | 'record-audio';
};
```

约束：

- 消息只表达用户意图
- 不在 WebView 内传文件、blob 或 base64

### 2. H5 HTML 增加内部动作栏

在编辑区域上方增加一个轻量动作栏，包含 3 个按钮：

- `相册`
- `拍照`
- `录音`

这些按钮只承担触发 bridge，不承担真实文件选择。

### 3. `H5TextDocumentEditor` 扩展回调

新增最小 props：

```ts
onMediaInsertRequest?: (event: H5MediaInsertRequestEvent) => void;
```

职责：

- 收到 `media-insert-request` 时转发给 RN
- 不修改现有 `onDeleteMedia / onWidgetEvent / onSelectionChange`

### 4. `NoteEditorModal` 复用现有媒体链

RN 侧映射关系：

- `pick-image`
  - `media.handleImagePicker`
- `capture-image`
  - `media.handleCamera`
- `record-audio`
  - `recording.handleRecordingToggle`

这样可以复用：

- 权限处理
- 附件保存
- marker 插入
- `content + textSegments` 回写

## 数据流

1. 用户在 H5 内点击“相册 / 拍照 / 录音”
2. WebView 发出：

```ts
{type: 'media-insert-request', action: 'pick-image'}
```

3. `H5TextDocumentEditor` 转发给 RN
4. `NoteEditorModal` 调用对应现有 handler
5. RN 更新 `images / audios / content / textSegments`
6. H5 通过现有同步链看到新 marker

## 边界与风险

- 本轮不让 H5 感知录音进行中状态，按钮文案保持静态
- 录音入口仍复用 toggle 语义，点击后由 RN 决定开始或停止
- 如果图片 / 录音链本身失败，错误提示继续由 RN 现有逻辑负责
- RN 工具栏入口保留，避免新入口刚接入时影响已有操作习惯

## 测试设计

### `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

新增覆盖：

- 渲染 H5 内部媒体动作按钮
- `media-insert-request` 消息能转发给 RN

### `src/features/note-editor/ui/NoteEditorModal.test.tsx`

新增覆盖：

- H5 内部“相册”动作能复用现有图片插入链
- H5 内部“拍照”动作能复用现有拍照插入链
- H5 内部“录音”动作能复用现有录音插入链

## 完成标准

- H5 编辑器内部可见“相册 / 拍照 / 录音”入口
- 点击后能触发 RN 既有媒体插入逻辑
- `content / textSegments / images / audios` 更新正确
- 现有工具栏入口和媒体删除链路不回归
