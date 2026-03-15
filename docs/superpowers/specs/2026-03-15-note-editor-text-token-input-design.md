# Note Editor 文本输入块边界重构设计

## 背景

上一轮已经把 note-editor 的内容 token 编排逻辑抽到了 `noteEditorContentTokens.ts`。`EditNoteContent` 目前的剩余复杂度主要集中在单个文本 token 的输入块上，仍然同时承担：

- 文本 token 的 `TextInput` 渲染
- 文本输入样式生成
- 文本改动后的 `textSegments` 回写
- 相对 selection 到绝对 cursor position 的换算

这意味着 `EditNoteContent` 还不是纯粹的“内容块分发器”，文本输入交互细节仍然混在内容区接线层里。

## 目标

本轮只做一轮最小可验证的边界收口：

- 将单个文本 token 输入块拆成独立组件
- 保持 `EditNoteContent` 的对外 props 不变
- 保持文本输入、光标换算、媒体块渲染行为不回退

## 非目标

本轮不做以下事项：

- 不调整空态输入框的整体交互模式
- 不修改 `useNoteFormatting` 或 `useNoteMedia`
- 不改 token helper 的接口设计
- 不改媒体块组件接口
- 不改 `NoteEditorModal` 接线

## 推荐方案

采用“独立文本 token 输入组件 + 内容区保留分发”的最小方案。

原因：

- 文本 token 输入块已经有清晰的输入与输出边界，天然适合组件化
- 先拆单个 token 输入块，比继续在 `EditNoteContent` 中内联 `TextInput` 风险更低
- 拆完后 `EditNoteContent` 会更接近单一职责的内容分发器

## 目标结构

### ui 边界

- `src/features/note-editor/ui/EditNoteTextTokenInput.tsx`
  - 接收单个 `TextToken`
  - 负责 `TextInput` 渲染
  - 负责文本输入样式生成
  - 负责文本回写到 `nextTextSegments`
  - 负责相对 selection 到绝对 cursor position 的换算

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 保留 `resolvedTextSegments` 兜底
  - 保留空态输入框
  - 保留图片块 / 音频块 / 文本输入块三类分发
  - 不再内联文本 token 的 `TextInput` JSX

## 关键数据流

### 文本 token 渲染

1. `EditNoteContent` 通过 token helper 得到 token 列表
2. 遇到文本 token 时，改为渲染 `EditNoteTextTokenInput`
3. 将这些上下文传给输入块：
   - `token`
   - `tokenIndex`
   - `tokens`
   - `resolvedTextSegments`
   - 内容与 selection 回调

### 文本回写

1. 用户修改文本 token
2. `EditNoteTextTokenInput` 根据 `segmentIndex`、`segmentTextStart`、`segmentTextEnd`
   更新 `nextTextSegments`
3. 通过 `getTextSegmentsContent(nextTextSegments)` 同步回 `content`
4. 继续调用 `onTextSegmentsChange?.(nextTextSegments)`

### 光标换算

1. 文本 token 内部触发 `onSelectionChange`
2. 输入块根据 `tokenIndex` 和 token helper 计算前置 token 偏移
3. 将相对 selection 换算成绝对 cursor position
4. 再回调给上层

## 接口设计

### `EditNoteTextTokenInput`

建议输入：

- `token`
- `tokenIndex`
- `tokens`
- `resolvedTextSegments`
- `onContentChange`
- `onSelectionChange`
- `onTextSegmentsChange?`

不再把 token 改写逻辑留在父组件中。

### 文本输入样式

- 将 `createTextInputStyle()` 一并移动到 `EditNoteTextTokenInput.tsx`
- 如有需要，可从该文件导出给空态输入框复用

## 错误处理

- 本轮不新增 alert 或日志
- 文本输入仍按当前方式直接更新内容，不增加防抖或校验逻辑
- 若 `onTextSegmentsChange` 未传入，继续保持可选调用

## 兼容性约束

- `EditNoteContent` 的 props 不变
- `noteEditorContentTokens.ts` 的接口不变
- 媒体块组件接口不变
- `NoteEditorModal` 不新增新接线

## 测试策略

### 组件测试

- 为 `EditNoteTextTokenInput` 补测试：
  - 正确渲染 token 样式
  - 文本修改后更新 `content` 与 `textSegments`
  - selection 能换算成正确绝对 cursor position

### 回归测试

- `EditNoteContent.test.tsx` 补一条断言：
  - 文本 token 通过 `EditNoteTextTokenInput` 渲染
- 保留现有文本、图片、音频渲染与 selection 回归测试

## 风险

- 如果文本回写逻辑迁移时改错 `segmentTextStart` / `segmentTextEnd`，会直接破坏输入结果
- 如果把样式辅助函数迁出时没有处理空态输入复用，容易出现样式细微回退
- 如果 selection 偏移换算遗漏 token 上下文，光标位置会漂移

## 完成标准

- 文本 token 的 `TextInput` JSX 不再内联在 `EditNoteContent` 中
- `EditNoteTextTokenInput` 成为文本 token 输入唯一入口
- 现有文本输入、光标换算、媒体块渲染行为保持不变
- 新增测试通过，且全量验证通过
