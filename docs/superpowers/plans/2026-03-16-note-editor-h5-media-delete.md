# Note Editor H5 Media Delete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑态能够删除已存在的图片 / 音频 marker，并复用 RN 现有媒体删除链完成状态同步。

**Architecture:** H5 marker 增加删除按钮并发送 `media-delete` 消息；`H5TextDocumentEditor` 负责消息解析与回调；`NoteEditorModal` 将其接到 `useNoteMedia` 的删除 handler。本轮不做媒体新增。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 H5 媒体删除补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 收到 `media-delete` 消息时会调用 `onDeleteMedia`

- [ ] **Step 2: 写 note-editor 失败测试**

覆盖这些行为：

- H5 删除图片 marker 会同步 `images + content + textSegments`
- H5 删除音频 marker 会同步 `audios + content + textSegments`

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 H5 editor 还没有 `media-delete` 协议，`NoteEditorModal` 也还没接线。

## Chunk 2: 实现删除协议

### Task 2: 实现 H5 媒体删除闭环

**Files:**
- Modify: `src/features/h5-editor/model/h5TextEditorMarkup.ts`
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- marker 删除按钮
- `media-delete` 消息解析
- `NoteEditorModal` 删除接线

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/model/useNoteMedia.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- H5 模式已支持删除已存在媒体 marker
- 剩余主要缺口收敛为 H5 媒体新增

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
