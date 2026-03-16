# Note Editor H5 Preview Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 H5 预览壳接入 `NoteEditorModal`，形成“原生编辑 + H5 预览”的最小正式入口。

**Architecture:** 新增 `NoteEditorPreviewPane`，内部通过 `EditorProvider.parse()` 把当前编辑内容整理成 `RichDocument` 并复用 `H5DocumentPreview`。`NoteEditorModal` 新增编辑 / 预览切换，编辑态保持不变，预览态只读。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 note-editor 预览接线补失败测试

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Create: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

- [ ] **Step 1: 写模式切换失败测试**

覆盖这些行为：

- `NoteEditorModal` 可以切到“预览”模式
- 预览模式会走 `parse -> renderHtml -> WebView`

- [ ] **Step 2: 写预览面板失败测试**

覆盖这些行为：

- 图片 / 音频 marker 会被整理为更适合预览的占位文本
- 预览面板会把解析后的文档交给 H5 预览组件

- [ ] **Step 3: 运行针对性单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是预览模式切换和预览面板尚不存在。

## Chunk 2: 实现预览接线

### Task 2: 实现 `NoteEditorPreviewPane` 和模式切换

**Files:**
- Create: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/styles/layoutStyles.ts`

- [ ] **Step 1: 写最小实现**

实现：

- `NoteEditorPreviewPane`
- 图片 / 音频 marker 的最小占位转换
- `NoteEditorModal` 的编辑 / 预览切换
- 编辑态工具栏只在编辑模式出现

- [ ] **Step 2: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

## Chunk 3: 文档与验证

### Task 3: 更新 README 并验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- `NoteEditorModal` 已支持 H5 预览模式
- 剩余风险更聚焦到 WebView 双向编辑和 Widget Registry

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
