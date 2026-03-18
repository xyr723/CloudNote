# Live Text Document Mirror Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `NoteEditorModal` 在正文变化时持续生成当前文本 + widget 的 live `document`，并让预览态优先复用这份镜像。

**Architecture:** 保持 `content + textSegments` 作为当前编辑事实来源，不直接改成完整 `document-first`。通过新增正文镜像 helper、在 `NoteEditorModal` 增加 live mirror 同步、在预览态增加 direct-render fast path，实现第一阶段收口；H5 编辑态继续只消费 widget-only document。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: 正文镜像 helper

### Task 1: 提取共享的正文镜像与 widget-only helper

**Files:**
- Create: `src/features/note-editor/model/noteEditorDocument.ts`
- Create: `src/features/note-editor/model/noteEditorDocument.test.ts`

- [ ] **Step 1: 先写失败测试**

覆盖：

- marker 文本规范化
- `plainText` 与当前正文同步判定
- widget-only document 提取

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorDocument.test.ts`

Expected: FAIL，因为 helper 还不存在。

- [ ] **Step 3: 写最小实现**

在 `noteEditorDocument.ts` 中提供：

- 正文镜像输入规范化 helper
- live document 与正文同步判定 helper
- widget-only document 提取 helper

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorDocument.test.ts`

Expected: PASS

## Chunk 2: NoteEditorModal live mirror

### Task 2: 用失败测试锁定 H5 / AI / 媒体文本变更后的 live document

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 先写失败测试**

补这些覆盖：

- H5 富文本回写后，`onChangeDocument` 最终拿到新的 live document
- AI 追加文本后，`onChangeDocument` 最终拿到新的 live document
- 媒体 marker 插入后，`onChangeDocument` 最终拿到新的 live document
- AI 同时追加 widgets 时，最终 document 仍保留文本 blocks

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是当前文本变化不会同步更新 `document`。

### Task 3: 在 NoteEditorModal 中实现 live text mirror

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写最小实现**

在 `NoteEditorModal.tsx`：

- 使用共享 helper 规范化正文镜像输入
- 监听当前正文变化并重新 parse 文本 document
- 与当前 widget blocks merge 成新的 live `draftDocument`
- 同步回写 `onChangeDocument`
- 传给 `H5TextDocumentEditor` 的 document 改为 widget-only document

- [ ] **Step 2: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 3: 预览态直连 live document

### Task 4: 为预览 fast path 先写失败测试

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

- [ ] **Step 1: 先写失败测试**

覆盖：

- document 已与正文同步时，不再调用 parse
- document 未同步时，仍会回退 parse + merge

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: FAIL，原因是当前预览态总会 parse。

### Task 5: 在预览态接入 fast path

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

- [ ] **Step 1: 写最小实现**

在 `NoteEditorPreviewPane.tsx`：

- 先判断传入 document 是否已与当前正文同步
- 命中时直接渲染该 document
- 未命中时保留现有 parse + merge 兼容逻辑

- [ ] **Step 2: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

## Chunk 4: 回归验证

### Task 6: 跑相关回归和类型检查

**Files:**
- Verify only

- [ ] **Step 1: 跑针对性测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/note-editor/model/noteEditorDocument.test.ts \
  src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.test.tsx \
  src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx \
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

- 仍然是 `content + textSegments` 驱动编辑
- `document` 只是 live mirror，不是唯一事实来源
- H5 编辑态收到的依然是 widget-only document
- 预览态优先消费 live document，但旧 document 仍能回退兼容
