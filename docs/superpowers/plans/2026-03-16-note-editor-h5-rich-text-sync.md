# Note Editor H5 Rich Text Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `NoteEditorModal` 的 H5 模式在正文回写时同步 `textSegments`，避免已有富文本样式退化成单段。

**Architecture:** 为 H5 editor 增加基于 `textSegments` 的样式化 HTML 渲染和 `content + textSegments` 回写协议；`useNoteFormatting` 新增富文本状态替换入口，`NoteEditorModal` 在 H5 模式下接入这条新协议。为控制复杂度，H5 工具栏和命令桥接本轮不做。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 H5 富文本同步补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/model/useNoteFormatting.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 初始 HTML 会基于 `textSegments` 生成样式化 segment span
- `onMessage` 会同时回写 `content + textSegments`
- 外部状态更新时注入脚本会带新的 segment 样式

- [ ] **Step 2: 写 formatting 失败测试**

覆盖这些行为：

- H5 回传的富文本状态会直接替换当前 `textSegments`
- 不再退化成单段

- [ ] **Step 3: 写 note-editor 失败测试**

覆盖这些行为：

- H5 模式会把当前 `textSegments` 传给 H5 editor
- H5 回传的多段富文本状态会同步到 `onChangeTextSegments`

- [ ] **Step 4: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 H5 editor 尚未实现 `textSegments` 富文本协议。

## Chunk 2: 实现富文本同步

### Task 2: 实现 `textSegments` 的 H5 协议

**Files:**
- Create: `src/features/h5-editor/model/h5TextEditorMarkup.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/note-editor/model/noteEditorFormattingUtils.ts`
- Modify: `src/features/note-editor/model/useNoteFormatting.ts`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- `textSegments` -> HTML segment span
- WebView `content + textSegments` 回写
- 富文本状态替换入口
- `NoteEditorModal` 的 H5 富文本接线

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- H5 模式已保留已有 `textSegments`
- 当前 H5 仍缺工具栏格式化桥接

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
