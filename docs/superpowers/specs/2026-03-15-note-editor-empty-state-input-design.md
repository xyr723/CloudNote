# Note Editor 空态输入块边界重构设计

## 背景

上一轮已经把 note-editor 的文本 token 输入块拆到了 `EditNoteTextTokenInput.tsx`。`EditNoteContent` 当前剩余的内联输入逻辑主要只剩空态输入框，仍然同时承担：

- 空态 `TextInput` 的渲染
- 空态输入样式复用
- 空态 selection 到绝对 cursor position 的换算

这意味着 `EditNoteContent` 还没有完全退化成“空态切换 + 内容块分发”的接线层。

## 目标

本轮只做一轮最小可验证的边界收口：

- 将空态输入框拆成独立组件
- 保持 `EditNoteContent` 的对外 props 不变
- 保持空态输入、光标换算与文本样式行为不回退

## 非目标

本轮不做以下事项：

- 不调整非空态内容的 token 分发方式
- 不修改 `useNoteFormatting`、`useNoteMedia` 或 `NoteEditorModal`
- 不改 `EditNoteTextTokenInput` 的接口
- 不引入新的编辑器状态或校验逻辑

## 推荐方案

采用“独立空态输入组件 + `EditNoteContent` 保留空态判断”的最小方案。

原因：

- 空态输入框的输入与输出边界已经足够清晰，天然适合抽成独立 UI 组件
- 拆出后 `EditNoteContent` 将更接近只负责分支切换和 token 分发的接线层
- 该方案不改现有数据流，测试和回滚成本最低

## 目标结构

### ui 边界

- `src/features/note-editor/ui/EditNoteEmptyStateInput.tsx`
  - 负责空态 `TextInput` 渲染
  - 负责复用文本输入样式
  - 负责将 selection.start 作为绝对 cursor position 回调

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 保留 `resolvedTextSegments` 兜底
  - 保留空态判断
  - 空态时改为渲染 `EditNoteEmptyStateInput`
  - 非空态继续分发图片块 / 音频块 / 文本 token 输入块

## 关键数据流

### 空态渲染

1. `EditNoteContent` 继续根据 `content`、`images`、`audios` 判断是否处于空态
2. 命中空态时，改为渲染 `EditNoteEmptyStateInput`
3. 将字体样式、主题色和输入回调透传给空态输入组件

### 文本与光标回调

1. 用户在空态输入框中输入文本
2. `EditNoteEmptyStateInput` 继续直接回调 `onContentChange`
3. 用户移动光标时，组件读取 `selection`
4. 继续以 `selection.start` 作为绝对 cursor position 回调给上层

## 接口设计

### `EditNoteEmptyStateInput`

建议输入：

- `fontSize`
- `isBold`
- `isItalic`
- `textColor`
- `placeholderTextColor`
- `onContentChange`
- `onSelectionChange`

不新增额外状态，也不让父组件参与空态输入事件换算细节。

## 兼容性约束

- `EditNoteContent` 的 props 不变
- `EditNoteTextTokenInput` 的 `createTextInputStyle()` 继续作为共享样式辅助函数导出
- `NoteEditorModal` 不新增新接线

## 测试策略

### 组件测试

- 为 `EditNoteEmptyStateInput` 补测试：
  - 正确渲染 placeholder 与样式
  - 文本修改后继续回调 `onContentChange`
  - selection 继续回调正确绝对 cursor position

### 回归测试

- `EditNoteContent.test.tsx` 补一条断言：
  - 空态时通过 `EditNoteEmptyStateInput` 渲染

- 保留现有文本 token、图片、音频与 selection 回归测试

## 风险

- 如果空态输入组件遗漏 `placeholderTextColor`，会产生 UI 细微回退
- 如果 selection 回调没有继续使用 `selection.start`，会造成光标位置错乱
- 如果样式复用处理不当，空态输入与文本 token 输入会出现字体表现不一致

## 完成标准

- 空态 `TextInput` JSX 不再内联在 `EditNoteContent` 中
- 空态输入交互由 `EditNoteEmptyStateInput` 独立承载
- 现有空态输入、光标换算与非空态内容渲染行为保持不变
- 新增测试通过，且全量验证通过
