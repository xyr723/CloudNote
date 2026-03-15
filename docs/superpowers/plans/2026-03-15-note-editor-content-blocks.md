# Note Editor Content Blocks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的最终 token 分发从 `EditNoteContent` 中拆出，进一步收紧内容区的非空态渲染边界。

**Architecture:** 新增 `EditNoteContentBlocks` 作为非空态 token 分发组件，内部承接图片块、音频块和文本 token 输入块三类渲染。`EditNoteContent` 保留空态判断、`resolvedTextSegments` 兜底与 token 构建，不改对外 props 和上层数据流。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: 非空态分发组件

### Task 1: 为 `EditNoteContentBlocks` 写失败测试

**Files:**
- Create: `src/features/note-editor/ui/EditNoteContentBlocks.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`
- Reference: `src/features/note-editor/model/noteEditorContentTokens.ts`

- [ ] **Step 1: 写分发组件失败测试**

覆盖这些行为：

- 文本 token 通过 `EditNoteTextTokenInput` 渲染
- 图片 token 通过 `EditNoteImageBlock` 渲染
- 音频 token 通过 `EditNoteAudioBlock` 渲染
- 缺失媒体资源时跳过渲染

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContentBlocks.test.tsx`

Expected: FAIL，原因是 `EditNoteContentBlocks` 模块尚不存在。

### Task 2: 实现 `EditNoteContentBlocks`

**Files:**
- Create: `src/features/note-editor/ui/EditNoteContentBlocks.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContentBlocks.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteAudioBlock.tsx`
- Reference: `src/features/note-editor/ui/EditNoteImageBlock.tsx`
- Reference: `src/features/note-editor/ui/EditNoteTextTokenInput.tsx`

- [ ] **Step 1: 写最小实现**

`EditNoteContentBlocks.tsx` 负责：

- 遍历 `tokens`
- 缺失图片 / 音频时返回 `null`
- 按 token 类型分发到现有三个子组件

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContentBlocks.test.tsx`

Expected: PASS

## Chunk 2: 内容区接线

### Task 3: 改造 `EditNoteContent`

**Files:**
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContentBlocks.tsx`

- [ ] **Step 1: 为分发组件接线补回归测试**

补一条断言，确认：

- 非空态时通过 `EditNoteContentBlocks` 渲染

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: FAIL，原因是 `EditNoteContent` 仍在内联 `tokens.map()`。

- [ ] **Step 3: 用独立组件替换最终 token 分发 JSX**

调整为：

- `EditNoteContent` 保留空态判断
- `EditNoteContent` 保留 `resolvedTextSegments` 与 `buildContentTokens()`
- 非空态 token 分发改为 `EditNoteContentBlocks`

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContentBlocks.test.tsx src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的最终内容分发已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
