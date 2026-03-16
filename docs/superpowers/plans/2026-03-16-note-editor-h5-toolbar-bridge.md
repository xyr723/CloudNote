# Note Editor H5 Toolbar Bridge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `NoteEditorModal` 在 H5 模式下通过原生工具栏桥接粗体 / 斜体命令，并继续复用现有 `content + textSegments` 回写链路。

**Architecture:** 为 H5 editor 增加一次性格式化命令输入和注入脚本生成；`NoteEditorModal` 在 H5 模式下继续展示现有工具栏，但只把粗体 / 斜体改为下发 H5 命令。本轮不接字号桥接，也不做 H5 选区状态同步。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 失败测试

### Task 1: 为 H5 工具栏桥接补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 H5 editor 失败测试**

覆盖这些行为：

- 当格式化命令从父级传入时，`WebView` 会注入对应 `bold` / `italic` 脚本
- 注入脚本会在执行命令后触发内容回写

- [ ] **Step 2: 写 note-editor 失败测试**

覆盖这些行为：

- H5 模式下点击粗体按钮会向 `H5TextDocumentEditor` 传递 `bold` 命令
- H5 模式下点击斜体按钮会向 `H5TextDocumentEditor` 传递 `italic` 命令

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 H5 editor 尚未实现格式化命令桥接。

## Chunk 2: 实现格式化命令桥接

### Task 2: 实现 H5 粗体 / 斜体命令协议

**Files:**
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- H5 格式化命令脚本生成
- `H5TextDocumentEditor` 的一次性命令注入
- `NoteEditorModal` 的 H5 模式工具栏命令接线

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

- H5 模式已支持通过原生工具栏桥接粗体 / 斜体
- H5 编辑当前剩余缺口为字号桥接与媒体新增 / 删除

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
