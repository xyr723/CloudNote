# Note Editor H5 Text Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `NoteEditorModal` 增加一个只负责纯文本正文的 H5 编辑模式，并打通 WebView 与 RN 的双向文本同步。

**Architecture:** 新增 `H5TextDocumentEditor` 作为 WebView 纯文本编辑器，通过 `EditorProvider.parse()` 和 `renderHtml()` 生成初始 HTML，并用 `onMessage` 把正文同步回 RN。`NoteEditorModal` 增加“原生 / H5 / 预览”模式切换，H5 模式只在无媒体笔记时可用；`useNoteFormatting` 新增整段正文替换入口，负责同步 `content` 和 `textSegments`。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 H5 正文同步补失败测试

**Files:**
- Create: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Modify: `src/features/note-editor/model/useNoteFormatting.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 初始渲染会走 `parse()` 和 `renderHtml()`
- `onMessage` 会回调 `onChangeContent`
- 外部正文更新时会调用 `injectJavaScript()`

- [ ] **Step 2: 写 formatting 失败测试**

覆盖这些行为：

- 整段正文替换会同步 `content`
- `textSegments` 会收敛为单段并继承当前默认样式

- [ ] **Step 3: 写 note-editor 失败测试**

覆盖这些行为：

- `NoteEditorModal` 可以切到 H5 模式
- H5 模式下输入会回写 `onChangeContent` / `onChangeTextSegments`
- 含媒体笔记时 H5 按钮禁用

- [ ] **Step 4: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 H5 editor 和整段正文同步入口尚不存在。

## Chunk 2: 实现 H5 文本同步

### Task 2: 实现 WebView 文本编辑器与 RN 同步

**Files:**
- Create: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.tsx`
- Modify: `src/features/note-editor/model/noteEditorFormattingUtils.ts`
- Modify: `src/features/note-editor/model/useNoteFormatting.ts`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/styles/layoutStyles.ts`

- [ ] **Step 1: 写最小实现**

实现：

- `H5TextDocumentEditor`
- WebView `onMessage` 文本回写
- 外部正文变化时的 `injectJavaScript()` 同步
- `useNoteFormatting` 的整段正文替换入口
- `NoteEditorModal` 的“原生 / H5 / 预览”模式切换
- H5 模式的媒体禁用保护

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/model/useNoteFormatting.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- `NoteEditorModal` 已具备 H5 正文编辑模式
- 当前 H5 编辑只支持纯文本正文，媒体仍走原生编辑

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
