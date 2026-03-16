# Note Editor Global Font Size Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `A+ / A-` 统一为全局字号调整能力，并让 H5 模式通过现有同步链获得字号更新。

**Architecture:** 在 formatting utils 中增加全局字号更新 helper，`useNoteFormatting` 的字号按钮同步更新 `fontSize + textSegments`；H5 模式不再禁用字号按钮，而是直接复用当前 formatting handler。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为全局字号调整补失败测试

**Files:**
- Modify: `src/features/note-editor/model/useNoteFormatting.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 formatting 失败测试**

覆盖这些行为：

- 点击 `A+` 会更新 `fontSize`
- 全部 `textSegments` 的 `fontSize` 同步更新

- [ ] **Step 2: 写 note-editor 失败测试**

覆盖这些行为：

- H5 模式下 `A+ / A-` 按钮可用
- 点击后会把新的 `fontSize + textSegments` 传给 `H5TextDocumentEditor`

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是当前字号逻辑还没有同步更新全部 `textSegments`，且 H5 模式仍禁用字号按钮。

## Chunk 2: 实现全局字号调整

### Task 2: 实现统一字号语义

**Files:**
- Modify: `src/features/note-editor/model/noteEditorFormattingUtils.ts`
- Modify: `src/features/note-editor/model/useNoteFormatting.ts`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- 全局字号更新 helper
- `useNoteFormatting` 同步更新 `fontSize + textSegments`
- H5 模式启用字号按钮

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- H5 模式已支持字号同步
- 剩余主要缺口收敛为媒体新增 / 删除

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
