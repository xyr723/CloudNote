# Note Editor 内容 Token 编排边界重构设计

## 背景

前几轮已经把 note-editor 的录音 session、播放状态、音频块 UI 和图片块 UI 从 `EditNoteContent` 中逐步拆出。当前 `EditNoteContent` 剩余的主要复杂度集中在 token 编排本身，文件内仍然同时承担：

- marker 正则识别
- 文本 / 图片 / 音频 token 拆分
- token 长度计算
- 光标位置偏移计算
- 视图渲染与文本回写

这意味着“内容编排规则”和“内容区视图渲染”仍然耦合在同一个组件文件里，后续如果还要继续拆文本输入块，会缺少一个稳定的编排边界。

## 目标

本轮只做一轮最小可验证的边界收口：

- 将内容 token 编排逻辑从 `EditNoteContent` 中拆到独立 model helper
- 保持 `EditNoteContent` 的对外 props 不变
- 保持文本输入、媒体渲染、marker 语义和光标换算行为不回退

## 非目标

本轮不做以下事项：

- 不拆文本输入子组件
- 不调整 `useNoteFormatting` 或 `useNoteMedia`
- 不改 marker 语义 `[图片N]` / `[音频N]`
- 不改媒体块组件接口
- 不改 `NoteEditorModal` 接线

## 推荐方案

采用“独立 token helper + 内容区保留渲染与回写”的最小方案。

原因：

- token 编排是纯逻辑，天然适合从 UI 文件中抽离
- 先收编排层，比直接拆 `TextInput` 子组件风险更低
- 拆出 helper 后，后续再拆文本 token 输入块会更顺手

## 目标结构

### model 边界

- `src/features/note-editor/model/noteEditorContentTokens.ts`
  - 导出 `TextToken`
  - 导出 `MarkerToken`
  - 导出 `ContentToken`
  - 负责 marker 识别
  - 负责 `buildContentTokens()`
  - 负责 `getTokenLength()`
  - 负责 token 偏移计算辅助函数

### ui 边界

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 保留 `resolvedTextSegments` 兜底
  - 保留文本 / 图片 / 音频 token 的视图渲染
  - 保留文本改动后的 `textSegments` 回写
  - 保留 `onSelectionChange` 接线
  - 不再内联 token 编排细节

## 关键数据流

### token 编排

1. `EditNoteContent` 先根据 `content` 和 `textSegments` 得到 `resolvedTextSegments`
2. 将 `resolvedTextSegments`、默认字号、默认粗细、默认斜体、默认颜色交给 `buildContentTokens()`
3. helper 返回 token 列表
4. `EditNoteContent` 只按 token 类型分发到：
   - `TextInput`
   - `EditNoteImageBlock`
   - `EditNoteAudioBlock`

### 光标偏移换算

1. 文本 token 内部触发 `onSelectionChange`
2. `EditNoteContent` 取当前 token 的相对 selection
3. 调用 helper 的 token 偏移函数计算该 token 之前的总长度
4. 组合为绝对 cursor position 后继续回调给上层

### 文本回写

1. 文本 token 输入变化
2. `EditNoteContent` 继续基于 token 的 `segmentIndex`、`segmentTextStart`、`segmentTextEnd`
   更新 `nextTextSegments`
3. 再通过 `getTextSegmentsContent(nextTextSegments)` 同步回 `content`

本轮不改变文本回写流向。

## 接口设计

### `buildContentTokens`

建议输入：

- `defaultFontSize`
- `defaultIsBold`
- `defaultIsItalic`
- `defaultTextColor`
- `segments`

建议输出：

- `ContentToken[]`

### `getTokenLength`

建议输入：

- `token: ContentToken`

建议输出：

- `number`

### token 偏移辅助

建议输入：

- `tokens: ContentToken[]`
- `tokenIndex: number`

建议输出：

- 当前 token 之前的总长度

保持 helper 粒度足够小，不引入额外状态对象。

## 错误处理

- token helper 只处理纯逻辑，不引入 alert 或日志
- 无法识别的片段继续按普通文本 token 处理
- 空字符串片段继续跳过，保持当前行为

## 兼容性约束

- `EditNoteContent` 的 props 不变
- `EditNoteImageBlock` / `EditNoteAudioBlock` 接口不变
- `NoteEditorModal` 不新增新接线
- `noteEditorMediaUtils.ts` 中现有 marker 工具函数不改

## 测试策略

### helper 测试

- 为 `noteEditorContentTokens.ts` 补测试：
  - 混合文本 / 图片 / 音频 marker 的 token 拆分
  - 文本 token 的样式继承与 `segmentTextStart` / `segmentTextEnd`
  - `getTokenLength()` 行为
  - token 偏移计算行为

### 组件回归测试

- `EditNoteContent.test.tsx` 保留现有文本、图片、音频渲染回归
- 补一条 selection 偏移回归，确认 helper 接入后绝对 cursor position 不回退

## 风险

- 如果 helper 抽取时改错了 marker 长度计算，文本输入与光标换算会一起偏移
- `segmentTextStart` / `segmentTextEnd` 一旦回归，会直接影响文本回写正确性
- 如果 helper 接口设计过大，后续反而会把 UI 逻辑重新带进去

## 完成标准

- token 编排细节不再内联在 `EditNoteContent` 中
- `noteEditorContentTokens.ts` 成为 token 编排唯一入口
- 现有文本输入、媒体渲染、光标换算行为保持不变
- 新增测试通过，且全量验证通过
