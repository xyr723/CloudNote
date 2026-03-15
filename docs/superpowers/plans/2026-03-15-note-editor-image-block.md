# Note Editor Image Block Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的图片块 UI 从 `EditNoteContent` 中拆出，进一步收紧内容区的媒体展示边界。

**Architecture:** 新增 `EditNoteImageBlock` 负责单个图片块的展示、删除按钮和加载错误日志。`EditNoteContent` 继续负责 token 编排，但图片 token 改为通过 `EditNoteImageBlock` 渲染；`useNoteMedia` 和 `NoteEditorModal` 保持现有数据流不变。

**Tech Stack:** React Native、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 图片块组件

### Task 1: 为 `EditNoteImageBlock` 写失败测试

**Files:**
- Create: `src/features/note-editor/ui/EditNoteImageBlock.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteAudioBlock.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`

- [ ] **Step 1: 写图片块组件失败测试**

覆盖这些行为：

- 正确渲染图片 URL
- 点击删除触发 `onDelete(imageIndex)`
- 图片加载失败时记录错误日志与图片 URL

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteImageBlock.test.tsx`

Expected: FAIL，原因是 `EditNoteImageBlock` 模块尚不存在。

### Task 2: 实现 `EditNoteImageBlock`

**Files:**
- Create: `src/features/note-editor/ui/EditNoteImageBlock.tsx`
- Modify: `src/features/note-editor/ui/EditNoteImageBlock.test.tsx`
- Reference: `src/features/note-editor/ui/styles/index.ts`

- [ ] **Step 1: 写最小实现**

`EditNoteImageBlock.tsx` 负责：

- 渲染图片
- 复用现有图片块样式
- 渲染删除按钮
- 记录图片加载失败日志

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteImageBlock.test.tsx`

Expected: PASS

## Chunk 2: 内容区接线

### Task 3: 改造 `EditNoteContent`

**Files:**
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteImageBlock.tsx`

- [ ] **Step 1: 为图片 token 补回归测试**

补充一个针对性测试，确认：

- 图片 token 会通过 `EditNoteImageBlock` 渲染

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: FAIL，原因是 `EditNoteContent` 仍在内联图片块 JSX。

- [ ] **Step 3: 用独立组件替换图片块 JSX**

调整为：

- `EditNoteContent` 保留 token 编排
- 图片 token 使用 `EditNoteImageBlock`
- 删除回调继续通过 props 传入

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteImageBlock.test.tsx src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的图片块 UI 已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到内容区文本与媒体 token 编排边界

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
