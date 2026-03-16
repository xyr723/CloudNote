# Note Editor H5 Rich Text Sync 设计

## 背景

当前已经具备：

- `NoteEditorModal` 的 H5 正文编辑模式
- 含媒体笔记的 H5 marker 协议
- WebView 到 RN 的正文文本双向同步

但当前 H5 回写仍有一个明显缺口：

- 一旦 WebView 回写正文，RN 侧的 `textSegments` 会被收敛成单段

这意味着 H5 模式虽然能保留正文文本和媒体 marker，但不能保留局部粗体、斜体、颜色和字号等已有富文本片段信息。

## 目标

本轮只做最小的本地富文本同步：

- H5 初始 HTML 根据 `textSegments` 渲染样式化 segment
- WebView 回写时同时回传 `content + textSegments`
- RN 侧用 H5 回传的 segments 替换当前 segments，而不是退化成单段
- 不新增 H5 工具栏，不做命令式格式化协议

## 非目标

本轮不做以下事项：

- 不在 H5 中新增粗体 / 斜体按钮
- 不实现 H5 与原生工具栏的命令桥接
- 不处理图片 / 音频的真实媒体 block 样式
- 不接 Widget Registry

## 方案对比

### 方案 A：继续只同步纯文本

优点：

- 实现最简单

缺点：

- H5 模式会破坏现有富文本片段
- 正文编辑态无法真正承担富文本数据

### 方案 B：同步已有 `textSegments`

优点：

- 改动范围可控
- 能保留现有富文本数据
- 为后续命令式格式化桥接打基础

缺点：

- 当前仍不支持 H5 内主动切换粗体 / 斜体

### 方案 C：直接补完整 H5 富文本命令桥

优点：

- 最接近最终目标

缺点：

- 同时引入选区、命令、工具栏、样式归并等复杂度
- 范围过大

## 推荐方案

采用方案 B：同步已有 `textSegments`。

原因：

- 这是当前阶段最小但有效的富文本增量
- 可以先解决“进入 H5 会丢样式”的真实问题
- 后续再叠加工具栏桥接时，数据通路已经存在

## 结构调整

### H5 feature

- `src/features/h5-editor/model/h5TextEditorMarkup.ts`
  - 把 `textSegments` 渲染成带样式的 segment HTML
  - 在 segment 内继续插入媒体 marker 占位块

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 接收 `textSegments`
  - WebView 回写时解析 `content + textSegments`
  - 将结果透传给 RN

### note-editor

- `src/features/note-editor/model/useNoteFormatting.ts`
  - 新增富文本状态替换入口
  - 用 H5 回传的 segments 替换当前 `textSegments`

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - H5 模式把 `textSegments` 传给 `H5TextDocumentEditor`
  - 接收 H5 回传的富文本状态

## 数据流

1. RN 把 `content + textSegments` 传入 H5 editor
2. H5 editor 用 segment span 生成带样式 HTML
3. 用户在 WebView 中编辑已有样式片段附近的文本
4. WebView 序列化为 `content + textSegments`
5. RN 直接替换当前富文本状态

## 风险

- 当前只保留已有样式，不提供新的 H5 格式化命令
- 浏览器编辑时可能自动拆分 / 合并 span，需要序列化时重新归并
- 这轮仍不解决 H5 与原生工具栏的统一格式化体验

## 完成标准

- H5 模式进入后不会把已有 `textSegments` 退化成单段
- WebView 回写会同步 `content + textSegments`
- 媒体 marker 协议与富文本片段可以共存
- 新增测试通过，且全量验证通过
