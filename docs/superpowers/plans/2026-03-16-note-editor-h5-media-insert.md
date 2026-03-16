# Note Editor H5 Media Insert Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑态补齐媒体新增能力，方式是先同步绝对选区，再复用 RN 现有图片与录音入口完成插入。

**Architecture:** WebView 新增 `selection-change` 消息，把绝对 `start / end / cursorPosition` 回传给 RN；`H5TextDocumentEditor` 负责转发；`NoteEditorModal` 在 H5 模式下重新接通图片入口和录音按钮，媒体插入继续走既有 `useNoteMedia` 与 `useNoteRecording` 链路。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 H5 选区回传和媒体新增补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 收到 `selection-change` 消息时会调用 `onSelectionChange`

- [ ] **Step 2: 写 note-editor 失败测试**

覆盖这些行为：

- H5 模式会把选区变化回传到 RN formatting
- H5 模式下图片入口重新可用，并在当前光标处插入图片 marker
- H5 模式下录音按钮重新可用，并在当前光标处插入音频 marker

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是当前还没有 `selection-change` 协议，且 H5 工具栏仍禁用了图片 / 录音入口。

## Chunk 2: 实现选区协议

### Task 2: 实现 H5 -> RN 选区同步

**Files:**
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- `selection-change` 消息类型及解析
- H5 绝对选区计算
- `H5TextDocumentEditor.onSelectionChange` 回调透传

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: PASS

## Chunk 3: 接通 H5 媒体入口

### Task 3: 在 H5 模式复用原生图片与录音入口

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- H5 模式把 `onSelectionChange` 接到 formatting
- H5 模式用 `NoteImageEntryFlow` 包裹工具栏
- 重新启用图片按钮
- 重新启用录音按钮

- [ ] **Step 2: 跑相关回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/note-editor/ui/NoteImageEntryFlow.test.tsx src/features/note-editor/model/useNoteMedia.test.tsx src/features/note-editor/model/useNoteRecording.test.tsx`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 4: 全量验证

### Task 4: 跑全量验证并确认无格式问题

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- H5 模式已支持媒体新增
- H5 仍然没有内部文件选择器，媒体入口继续由 RN 工具栏提供

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
