# Note Editor Image Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 中图片入口弹层和相册/拍照动作编排下沉到独立入口组件，缩小 `useNoteMedia` 和 `NoteEditorModal` 的职责。

**Architecture:** 新增 `NoteImageEntryFlow` 作为 note-editor 内部图片入口组件，内部管理图片选项弹层显隐和“关闭弹层后再执行相册/拍照动作”的编排。`useNoteMedia` 继续负责图片插入和内容同步，`EditNoteAuxiliaryModals` 收缩为 AI / 校验 / 保存反馈弹层，图片选项弹层拆到独立组件。

**Tech Stack:** React Native、React hooks、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 图片入口编排

### Task 1: 为 `NoteImageEntryFlow` 写失败测试

**Files:**
- Create: `src/features/note-editor/ui/NoteImageEntryFlow.test.tsx`
- Reference: `src/features/profile/ui/AvatarUpdateFlow.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteAuxiliaryModals.tsx`

- [ ] **Step 1: 写入口编排失败测试**

覆盖这些行为：

- 点击入口后显示“添加图片”弹层
- 点击“从相册选择”会先关闭弹层，再调用 `onPickImage()`
- 点击“拍照”会先关闭弹层，再调用 `onCaptureImage()`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteImageEntryFlow.test.tsx`

Expected: FAIL，原因是 `NoteImageEntryFlow` 模块尚不存在。

### Task 2: 实现 `NoteImageEntryFlow`

**Files:**
- Create: `src/features/note-editor/ui/NoteImageEntryFlow.tsx`
- Create: `src/features/note-editor/ui/EditNoteImageOptionsModal.tsx`
- Modify: `src/features/note-editor/ui/NoteImageEntryFlow.test.tsx`
- Reference: `src/features/note-editor/ui/styles.ts`

- [ ] **Step 1: 写最小实现**

`NoteImageEntryFlow.tsx` 负责：

- 管理 `showImageModal`
- 通过 render prop 暴露 `openImageOptions`
- 封装 “关闭弹层 -> 执行 `onPickImage` / `onCaptureImage`” 的顺序
- 组合 `EditNoteImageOptionsModal`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteImageEntryFlow.test.tsx`

Expected: PASS

## Chunk 2: Note Editor 接线

### Task 3: 改造 `useNoteMedia`、`EditNoteAuxiliaryModals` 和 `NoteEditorModal`

**Files:**
- Modify: `src/features/note-editor/model/useNoteMedia.ts`
- Modify: `src/features/note-editor/ui/EditNoteAuxiliaryModals.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Reference: `src/features/note-editor/ui/EditNoteToolbar.tsx`
- Reference: `src/features/note-editor/ui/NoteImageEntryFlow.tsx`

- [ ] **Step 1: 收紧 `useNoteMedia` 的 UI 状态**

移除这些职责：

- `showImageModal`
- `setShowImageModal`

保留这些职责：

- `handleImagePicker`
- `handleCamera`
- 图片与内容同步

- [ ] **Step 2: 收紧 `NoteEditorModal` 的图片入口编排**

调整为：

- `EditNoteToolbar` 从 `NoteImageEntryFlow` 获取 `openImageOptions`
- `NoteEditorModal` 不再直接调用 `setShowImageModal(false)`
- `EditNoteAuxiliaryModals` 只保留 AI / 校验 / 保存弹层

- [ ] **Step 3: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteImageEntryFlow.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/note-editor/model/useNoteMedia.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的图片入口弹层与相册/拍照动作编排已下沉
- 剩余高风险项更聚焦到录音附件 UI 编排与全局 app shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
