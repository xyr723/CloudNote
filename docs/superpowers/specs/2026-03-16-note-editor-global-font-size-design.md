# Note Editor Global Font Size 设计

## 背景

当前 `NoteEditorModal` 的 `A+ / A-` 已存在，但语义并不完整：

- native 侧只更新 `fontSize` 状态
- 已有 `textSegments` 的 `fontSize` 不会同步更新
- H5 模式下为了避免语义分叉，当前暂未启用字号按钮

这会带来两个问题：

- native 模式下，已有正文片段不会随字号按钮产生稳定的全局字号变化
- H5 模式无法直接复用现有同步链获得字号调整能力

## 目标

本轮把字号语义统一为“全局字号调整”：

- 点击 `A+ / A-` 时，当前笔记的所有 `textSegments` 同步改为新的字号
- `fontSize` 状态仍作为默认字号保留，并继续透传给外层
- H5 模式不新增独立字号命令，直接复用现有 `fontSize + textSegments` 同步链

## 非目标

- 不做选区级字号格式化
- 不新增 H5 专属字号命令协议
- 不修改粗体 / 斜体桥接协议
- 不处理媒体新增 / 删除

## 方案对比

### 方案 A：继续把字号当默认值处理

优点：

- 改动最小

缺点：

- 已有内容的字号不会稳定变化
- H5 和 native 的体验仍然不完整

### 方案 B：统一为全局字号调整

优点：

- 语义清晰
- 实现简单
- native 与 H5 都能共用现有同步链

缺点：

- 不能做局部字号格式化

### 方案 C：直接做选区级字号格式化

优点：

- 更接近完整富文本编辑器

缺点：

- 会引入选区同步和 DOM 片段重写复杂度
- 当前范围过大

## 推荐方案

采用方案 B：统一为全局字号调整。

原因：

- 它能在最小复杂度下补齐当前字号行为
- 不需要扩展新的 H5 命令桥
- 为后续如果要做选区级字号格式化保留演进空间

## 结构调整

### note-editor

- `src/features/note-editor/model/noteEditorFormattingUtils.ts`
  - 增加全局字号调整 helper

- `src/features/note-editor/model/useNoteFormatting.ts`
  - `A+ / A-` 改为同时更新 `fontSize` 状态和全部 `textSegments`

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - H5 模式重新启用 `A+ / A-`
  - 直接复用现有 formatting handler

## 数据流

1. 用户点击 `A+ / A-`
2. RN 计算新字号
3. 全部 `textSegments` 的 `fontSize` 更新为新值
4. `fontSize` 状态与 `onChangeFontSize` 同步更新
5. native 内容区直接用新 segments 重渲染
6. H5 内容区通过现有 `fontSize + textSegments` props 同步更新 WebView

## 风险

- 这轮只支持全局字号变化，不支持局部字号富文本
- 已有包含不同字号的文本会被统一抹平成一个新字号

## 完成标准

- native 模式下点击 `A+ / A-` 会同步更新全部 `textSegments` 的字号
- H5 模式下 `A+ / A-` 可用，并通过现有同步链反映到 H5 编辑器
- 新增测试通过，且相关回归通过
