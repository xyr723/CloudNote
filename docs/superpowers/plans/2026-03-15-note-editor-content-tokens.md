# Note Editor Content Tokens Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的内容 token 编排逻辑从 `EditNoteContent` 中拆出，进一步收紧内容区的渲染边界。

**Architecture:** 新增 `noteEditorContentTokens.ts` 负责 token 类型、marker 拆分、token 长度与偏移计算。`EditNoteContent` 继续负责 `resolvedTextSegments` 兜底、文本与媒体渲染、文本回写和 selection 接线，但不再内联 token 编排细节。

**Tech Stack:** TypeScript、React Native、Jest、react-test-renderer

---

## Chunk 1: Token Helper

### Task 1: 为 `noteEditorContentTokens` 写失败测试

**Files:**
- Create: `src/features/note-editor/model/noteEditorContentTokens.test.ts`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`
- Reference: `src/features/note-editor/model/noteEditorTextSegments.ts`

- [ ] **Step 1: 写 token helper 失败测试**

覆盖这些行为：

- 混合文本 / 图片 / 音频 marker 的 token 拆分
- 文本 token 的样式继承与 segment 偏移
- `getTokenLength()` 返回 marker 或文本长度
- token 偏移辅助函数返回当前 token 之前的总长度

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorContentTokens.test.ts`

Expected: FAIL，原因是 `noteEditorContentTokens` 模块尚不存在。

### Task 2: 实现 `noteEditorContentTokens`

**Files:**
- Create: `src/features/note-editor/model/noteEditorContentTokens.ts`
- Modify: `src/features/note-editor/model/noteEditorContentTokens.test.ts`

- [ ] **Step 1: 写最小实现**

`noteEditorContentTokens.ts` 负责：

- 导出 token 类型
- 导出 `buildContentTokens()`
- 导出 `getTokenLength()`
- 导出 token 偏移计算辅助函数

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorContentTokens.test.ts`

Expected: PASS

## Chunk 2: 内容区接线

### Task 3: 改造 `EditNoteContent`

**Files:**
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Reference: `src/features/note-editor/model/noteEditorContentTokens.ts`

- [ ] **Step 1: 为 selection 偏移补回归测试**

补充一个针对性测试，确认：

- 图片或音频 token 之前存在 marker 时，文本输入的 selection 仍能换算成正确绝对 cursor position

- [ ] **Step 2: 跑测试确认回归基线**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS，作为重构保护网。

- [ ] **Step 3: 用 token helper 替换组件内联逻辑**

调整为：

- 删除组件内的 token 类型定义
- 删除组件内的 marker 拆分辅助函数
- 从 helper 导入 token 构建、长度与偏移函数

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorContentTokens.test.ts src/features/note-editor/ui/EditNoteContent.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的内容 token 编排已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到文本输入块与全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
