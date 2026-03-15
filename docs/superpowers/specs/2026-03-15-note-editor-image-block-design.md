# Note Editor 图片块边界重构设计

## 背景

前两轮已经分别把 note-editor 的录音 session、音频播放状态和音频块 UI 从大文件中拆出。但 `EditNoteContent` 里仍然内联保留着图片块渲染逻辑，当前同时承担：

- 文本与媒体 marker 的 token 编排
- 图片展示
- 图片删除按钮
- 图片加载失败日志

这意味着 `EditNoteContent` 仍然混着“内容编排”和“单个媒体块展示”两类职责，边界还不够清晰。

## 目标

本轮只做一轮最小可验证的边界收口：

- 将图片块 UI 从 `EditNoteContent` 中拆出为独立组件
- 保持图片删除流向不变
- 保持图片 marker `[图片N]` 语义不变
- 保持 `NoteEditorModal` 和 `useNoteMedia` 接线基本不变

## 非目标

本轮不做以下事项：

- 不调整图片插入流程
- 不修改 `useNoteMedia` 的数据逻辑
- 不重做图片块视觉样式
- 不同步拆文本 token 或图片入口 flow
- 不改 app-shell、theme 或 provider 边界

## 推荐方案

采用“独立图片块组件 + 内容区保留 token 编排”的最小方案。

原因：

- 图片块 JSX 只在 `EditNoteContent` 中出现，组件化成本低
- 图片删除仍通过已有 `onDeleteImage(imageIndex)` 回调向上流转，不需要改数据层
- 当前图片块内的加载失败日志也自然属于单块展示行为，一起收进组件最顺手

## 目标结构

### ui 边界

- `src/features/note-editor/ui/EditNoteImageBlock.tsx`
  - 接收单个图片块需要的 props
  - 负责图片展示
  - 负责删除按钮
  - 负责图片加载失败日志
  - 不感知 token 拆分逻辑

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 继续负责文本、图片、音频 marker 的 token 编排
  - 遇到图片 token 时，改为渲染 `EditNoteImageBlock`
  - 不再内联图片块 JSX

### model 边界

- `src/features/note-editor/model/useNoteMedia.ts`
  - 保持现状
  - 继续负责图片数组与 `[图片N]` marker 的同步
  - 继续负责图片删除后的内容与 `textSegments` 更新

## 关键数据流

### 图片显示

1. `EditNoteContent` 收到 `images`
2. token 编排遇到图片 marker
3. 按 `imageIndex` 取 `images[imageIndex]`
4. 若图片存在，则渲染 `EditNoteImageBlock`

### 删除图片

1. 用户点击 `EditNoteImageBlock` 的删除按钮
2. 组件调用 `onDelete(imageIndex)`
3. `EditNoteContent` 继续使用已有 `onDeleteImage`
4. `useNoteMedia` 继续负责：
   - 删除图片数组项
   - 同步移除对应 marker
   - 更新 `textSegments`

本轮不改变删除流向。

### 图片加载失败

1. `Image` 触发 `onError`
2. `EditNoteImageBlock` 记录：
   - 图片加载错误
   - 当前图片 URL

这样错误日志与图片展示边界保持一致。

## 接口设计

### `EditNoteImageBlock`

建议输入：

- `imageIndex: number`
- `imageUri: string`
- `onDelete: (imageIndex: number) => void`

不额外暴露样式控制、主题或加载态，避免过早设计。

## 错误处理

- 继续保留现有 `console.log('图片加载错误:', ...)` 与 `console.log('图片URL:', ...)`
- 不新增 alert 或重试逻辑
- 如果 `imageUri` 不存在，仍由 `EditNoteContent` 在渲染前判空并返回 `null`

## 兼容性约束

- `EditNoteContent` 的对外 props 保持不变
- `NoteEditorModal` 不新增任何新 hook 或新 props
- `useNoteMedia` 接口与测试保持不变
- 图片 marker 语义 `[图片N]` 不变

## 测试策略

### 组件测试

- 为 `EditNoteImageBlock` 补测试：
  - 正确渲染图片 URL
  - 点击删除触发 `onDelete(imageIndex)`
  - 图片加载失败时记录错误日志与图片 URL

### 回归测试

- `EditNoteContent` 继续正确渲染图片 token
- 图片 token 改为通过 `EditNoteImageBlock` 渲染
- 全量 Jest、TypeScript、ESLint 不新增 error

## 风险

- `EditNoteContent` 在替换图片 JSX 时，如果漏掉 `hitSlop` 或图片 `resizeMode`，会产生细小交互回退
- 测试若只断言组件存在而不覆盖删除回调，容易漏掉删除入口接线错误
- 当前图片加载失败日志属于弱约束，若测试写得过细，后续会增加维护成本

## 完成标准

- 图片块按钮与图片展示 JSX 不再内联在 `EditNoteContent` 中
- `EditNoteImageBlock` 成为图片块唯一展示入口
- 现有图片展示、删除、错误日志行为保持不变
- 新增测试通过，且全量验证通过
