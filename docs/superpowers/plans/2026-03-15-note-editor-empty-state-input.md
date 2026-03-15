# Note Editor Empty State Input Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的空态输入框从 `EditNoteContent` 中拆出，进一步收紧内容区的输入接线边界。

**Architecture:** 新增 `EditNoteEmptyStateInput` 负责空态 `TextInput`、样式复用与 selection 回调。`EditNoteContent` 继续保留空态判断与非空态 token 分发，不改对外 props 和上层数据流。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: 空态输入组件

### Task 1: 为 `EditNoteEmptyStateInput` 写失败测试

**Files:**
- Create: `src/features/note-editor/ui/EditNoteEmptyStateInput.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`
- Reference: `src/features/note-editor/ui/EditNoteTextTokenInput.tsx`

- [ ] **Step 1: 写空态输入组件失败测试**

覆盖这些行为：

- 正确渲染 placeholder 与文本样式
- 文本变化后继续调用 `onContentChange`
- selection 变化后继续回调绝对 cursor position

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteEmptyStateInput.test.tsx`

Expected: FAIL，原因是 `EditNoteEmptyStateInput` 模块尚不存在。

### Task 2: 实现 `EditNoteEmptyStateInput`

**Files:**
- Create: `src/features/note-editor/ui/EditNoteEmptyStateInput.tsx`
- Modify: `src/features/note-editor/ui/EditNoteEmptyStateInput.test.tsx`
- Reference: `src/features/note-editor/ui/types.ts`

- [ ] **Step 1: 写最小实现**

`EditNoteEmptyStateInput.tsx` 负责：

- 渲染空态 `TextInput`
- 复用 `createTextInputStyle`
- 回调 `onContentChange`
- 将 `selection.start` 作为绝对 cursor position 回传

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteEmptyStateInput.test.tsx`

Expected: PASS

## Chunk 2: 内容区接线

### Task 3: 改造 `EditNoteContent`

**Files:**
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteEmptyStateInput.tsx`

- [ ] **Step 1: 为空态输入组件化补回归测试**

补一条断言，确认：

- 空态时通过 `EditNoteEmptyStateInput` 渲染

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: FAIL，原因是 `EditNoteContent` 仍在内联空态 `TextInput`。

- [ ] **Step 3: 用独立组件替换空态输入 JSX**

调整为：

- `EditNoteContent` 保留空态判断
- 空态输入改为 `EditNoteEmptyStateInput`
- 非空态 token 分发保持不变

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteEmptyStateInput.test.tsx src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的空态输入块已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到最终内容分发与全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
