# H5 编辑器内部媒体入口 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑器内部显示相册、拍照、录音动作入口，并通过 bridge 复用 RN 现有媒体插入链。

**Architecture:** 保持实际文件选择、权限和附件保存继续由 RN 承担，只在 H5 内新增动作栏和 `media-insert-request` 协议。`H5TextDocumentEditor` 负责转发，`NoteEditorModal` 负责把请求映射到现有 `useNoteMedia / useNoteRecording` handler。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: H5 bridge 消息

### Task 1: 为 `media-insert-request` 补失败测试与协议

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- H5 HTML 渲染“相册 / 拍照 / 录音”按钮
- 收到 `media-insert-request` 消息时，会调用 `onMediaInsertRequest`

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: FAIL，原因是当前没有内部媒体动作和对应 bridge 消息。

- [ ] **Step 3: 写最小实现**

实现：

- `H5TextEditorBridge` 新增 `media-insert-request`
- H5 HTML 增加媒体动作栏
- `H5TextDocumentEditor` 新增 `onMediaInsertRequest`

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: PASS

## Chunk 2: NoteEditorModal 接线

### Task 2: 让 H5 内部媒体入口复用现有媒体插入链

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- `pick-image` 会复用图片选择链
- `capture-image` 会复用拍照链
- `record-audio` 会复用录音 toggle 链

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx -t "h5 internal media"`

Expected: FAIL，原因是当前 H5 editor 没有对应回调接线。

- [ ] **Step 3: 写最小实现**

在 `NoteEditorModal.tsx`：

- H5 模式给 `H5TextDocumentEditor` 传入 `onMediaInsertRequest`
- 映射：
  - `pick-image -> media.handleImagePicker`
  - `capture-image -> media.handleCamera`
  - `record-audio -> recording.handleRecordingToggle`

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx -t "h5 internal media"`

Expected: PASS

## Chunk 3: 相关回归验证

### Task 3: 跑相关测试与类型检查

**Files:**
- Verify only

- [ ] **Step 1: 跑针对性测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.test.tsx \
  src/features/note-editor/ui/NoteImageEntryFlow.test.tsx \
  src/features/note-editor/model/useNoteMedia.test.tsx \
  src/features/note-editor/model/useAudioPlayback.test.tsx
```

Expected: PASS

- [ ] **Step 2: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 人工核对边界**

确认：

- H5 内部动作只是 bridge 入口，不是真实文件选择器
- RN 工具栏媒体入口仍可用
- marker 删除和 widget 编辑链路未回归
