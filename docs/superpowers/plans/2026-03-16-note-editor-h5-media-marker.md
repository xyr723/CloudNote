# Note Editor H5 Media Marker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让含图片 / 音频 marker 的笔记也能进入 H5 编辑模式，并保证 marker 在 WebView 往返同步过程中不丢失。

**Architecture:** 扩展 `H5TextDocumentEditor`，把 marker 渲染成不可编辑原子占位块，并在 WebView 序列化时还原为原始 marker 文本；`NoteEditorModal` 移除含媒体笔记的 H5 禁用逻辑。媒体新增 / 删除仍保留在原生编辑态。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为媒体 marker 协议补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 初始 HTML 会把 `[图片N] / [音频N]` 变成 marker 占位块
- 外部内容同步时注入脚本会带 marker 占位块

- [ ] **Step 2: 写 note-editor 失败测试**

覆盖这些行为：

- 含媒体笔记的 H5 模式按钮不再禁用
- H5 模式可以承载含 marker 的正文

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 H5 editor 尚未实现 marker 原子占位协议。

## Chunk 2: 实现 marker 协议

### Task 2: 实现 H5 媒体 marker 协议

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/styles/layoutStyles.ts`

- [ ] **Step 1: 写最小实现**

实现：

- marker 到占位块的 HTML 转换
- WebView 内 marker 到文本的序列化
- 对 marker 的直接删除保护
- 移除含媒体笔记的 H5 禁用限制

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/note-editor/model/useNoteFormatting.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- 含媒体笔记已可进入 H5 编辑模式
- 当前 H5 仍不支持媒体的新增 / 删除，只保证 marker 稳定同步

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
