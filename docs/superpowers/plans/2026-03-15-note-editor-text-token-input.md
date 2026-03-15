# Note Editor Text Token Input Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的单个文本 token 输入块从 `EditNoteContent` 中拆出，进一步收紧内容区渲染接线职责。

**Architecture:** 新增 `EditNoteTextTokenInput` 负责文本 token 的 `TextInput`、样式生成、内容回写和 selection 偏移换算。`EditNoteContent` 继续负责 token 分发与空态输入框，但不再内联文本 token 的输入 JSX。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: 文本输入块组件

### Task 1: 为 `EditNoteTextTokenInput` 写失败测试

**Files:**
- Create: `src/features/note-editor/ui/EditNoteTextTokenInput.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`
- Reference: `src/features/note-editor/model/noteEditorContentTokens.ts`

- [ ] **Step 1: 写文本输入块失败测试**

覆盖这些行为：

- 正确渲染 token 样式
- 文本修改后更新 `content` 与 `textSegments`
- selection 能换算成正确绝对 cursor position

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteTextTokenInput.test.tsx`

Expected: FAIL，原因是 `EditNoteTextTokenInput` 模块尚不存在。

### Task 2: 实现 `EditNoteTextTokenInput`

**Files:**
- Create: `src/features/note-editor/ui/EditNoteTextTokenInput.tsx`
- Modify: `src/features/note-editor/ui/EditNoteTextTokenInput.test.tsx`

- [ ] **Step 1: 写最小实现**

`EditNoteTextTokenInput.tsx` 负责：

- 渲染单个 `TextInput`
- 生成文本样式
- 回写 `nextTextSegments`
- 计算绝对 cursor position

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteTextTokenInput.test.tsx`

Expected: PASS

## Chunk 2: 内容区接线

### Task 3: 改造 `EditNoteContent`

**Files:**
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteTextTokenInput.tsx`

- [ ] **Step 1: 为文本 token 组件化补回归测试**

补充一个针对性测试，确认：

- 文本 token 会通过 `EditNoteTextTokenInput` 渲染

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: FAIL，原因是 `EditNoteContent` 仍在内联文本 token 的 `TextInput`。

- [ ] **Step 3: 用独立组件替换文本 token JSX**

调整为：

- `EditNoteContent` 保留空态输入框
- 文本 token 使用 `EditNoteTextTokenInput`
- 如需复用文本样式辅助函数，从组件文件导出

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteTextTokenInput.test.tsx src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的文本输入块与内容区渲染接线已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到空态输入与全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
