# Note Editor 最终内容分发边界重构设计

## 背景

上一轮已经把 note-editor 的空态输入框拆到了 `EditNoteEmptyStateInput.tsx`。`EditNoteContent` 当前剩余的主要职责已经很集中，但仍然内联承担整段非空态 token 的最终分发：

- 遍历 `tokens`
- 根据 token 类型切换图片块 / 音频块 / 文本输入块
- 对缺失媒体做判空

这意味着 `EditNoteContent` 还没有退化成纯粹的“空态判断 + token 构建 + 非空态分发入口”。

## 目标

本轮只做一轮最小可验证的边界收口：

- 将非空态 token 分发拆到独立组件
- 保持 `EditNoteContent` 的对外 props 不变
- 保持图片、音频、文本 token 的渲染与交互行为不回退

## 非目标

本轮不做以下事项：

- 不调整 `resolvedTextSegments` 的兜底策略
- 不修改 `buildContentTokens()` 的接口
- 不修改 `EditNoteAudioBlock`、`EditNoteImageBlock`、`EditNoteTextTokenInput` 的接口
- 不改 `NoteEditorModal`、`useNoteFormatting`、`useNoteMedia`

## 方案对比

### 方案 A：独立非空态分发组件

新增 `EditNoteContentBlocks`，由它承接 `tokens.map()` 与三类 token 的分支渲染。

优点：

- `EditNoteContent` 能进一步收紧为上层接线组件
- UI 分发边界清晰，符合现有拆块节奏
- 风险可控，不影响现有 data flow

缺点：

- 新增一个 props 较多的中间组件

### 方案 B：抽 `renderContentToken()` helper

将 map 内部分支逻辑抽到 helper 函数。

优点：

- 文件改动最小

缺点：

- `EditNoteContent` 仍保留遍历和接线，不算真正收口

### 方案 C：把分发逻辑继续下沉到 model helper

优点：

- 看起来“更抽象”

缺点：

- 会把 JSX 组合边界推到 model 层，不符合当前目录职责
- 复杂度高于收益

## 推荐方案

采用方案 A：独立 `EditNoteContentBlocks`。

原因：

- 这是继续沿现有 `EditNoteAudioBlock`、`EditNoteImageBlock`、`EditNoteTextTokenInput`、`EditNoteEmptyStateInput` 拆分的自然下一步
- 该方案只收一个边界，不引入新的状态或抽象
- 做完后 `EditNoteContent` 的职责会更稳定，后续再看是否还需要继续压薄

## 目标结构

### ui 边界

- `src/features/note-editor/ui/EditNoteContentBlocks.tsx`
  - 接收 token 列表与渲染所需上下文
  - 负责非空态 token 的最终分发
  - 负责缺失图片 / 音频时返回 `null`

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 保留 `resolvedTextSegments` 兜底
  - 保留 `buildContentTokens()` 调用
  - 保留空态判断
  - 非空态时改为渲染 `EditNoteContentBlocks`

## 数据流

1. `EditNoteContent` 继续基于 `content`、`textSegments` 生成 `resolvedTextSegments`
2. `EditNoteContent` 继续通过 `buildContentTokens()` 得到 `tokens`
3. 若为空态，继续渲染 `EditNoteEmptyStateInput`
4. 若非空态，改为将 `tokens`、媒体列表、选择回调和 `resolvedTextSegments` 传给 `EditNoteContentBlocks`
5. `EditNoteContentBlocks` 再根据 token 类型分发到：
   - `EditNoteImageBlock`
   - `EditNoteAudioBlock`
   - `EditNoteTextTokenInput`

## 接口设计

### `EditNoteContentBlocks`

建议输入：

- `tokens`
- `images`
- `audios`
- `currentAudioIndex`
- `isPlaying`
- `onDeleteImage`
- `onDeleteAudio`
- `onPlayAudio`
- `onContentChange`
- `onSelectionChange`
- `onTextSegmentsChange?`
- `resolvedTextSegments`
- `theme`

不新增派生状态，也不回退到把 token 分发逻辑放回父组件。

## 兼容性约束

- `EditNoteContent` 的 props 不变
- 现有三类内容块组件接口不变
- token helper 接口不变
- `NoteEditorModal` 不新增新接线

## 测试策略

### 组件测试

- 为 `EditNoteContentBlocks` 补测试：
  - 文本 token 通过 `EditNoteTextTokenInput` 渲染
  - 图片 token 通过 `EditNoteImageBlock` 渲染
  - 音频 token 通过 `EditNoteAudioBlock` 渲染
  - 缺失媒体资源时返回 `null`

### 回归测试

- `EditNoteContent.test.tsx` 补一条断言：
  - 非空态时通过 `EditNoteContentBlocks` 渲染

- 保留现有文本、图片、音频、selection 回归测试

## 风险

- 如果 `resolvedTextSegments` 或回调透传不完整，文本 token 的编辑行为会回退
- 如果遗漏媒体判空，缺失资源时会出现空引用渲染问题
- 如果 key 或 token index 处理错误，可能导致块渲染顺序或光标行为漂移

## 完成标准

- `tokens.map()` JSX 不再内联在 `EditNoteContent` 中
- `EditNoteContentBlocks` 成为非空态 token 分发唯一入口
- 现有图片、音频、文本 token 的渲染与交互保持不变
- 新增测试通过，且全量验证通过
