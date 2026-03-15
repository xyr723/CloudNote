# Note Editor Recording Session Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 中录音权限、临时路径和 start/stop session 编排下沉到独立 hook，缩小 `useNoteRecording` 的职责。

**Architecture:** 新增 `useAudioRecordingSession`，只负责录音权限申请、目录与路径准备、录音开始/停止和 session 状态。`useNoteRecording` 改为组合该 hook，继续负责附件保存、内容 `[音频N]` marker 插入，以及音频播放状态与控制，保持 `NoteEditorModal` 和工具栏接线基本不变。

**Tech Stack:** React Native、React hooks、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 录音 Session Hook

### Task 1: 为 `useAudioRecordingSession` 写失败测试

**Files:**
- Create: `src/features/note-editor/model/useAudioRecordingSession.test.tsx`
- Reference: `src/features/note-editor/model/useNoteRecording.test.tsx`
- Reference: `jest.setup.js`

- [ ] **Step 1: 写录音 session 失败测试**

覆盖这些行为：

- 权限允许时可以开始录音
- 开始录音时会创建目录、生成路径并调用 `startRecorder`
- 停止录音时会调用 `stopRecorder`、移除录音监听并清空当前录音路径
- 权限拒绝时不会开始录音，并提示错误

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioRecordingSession.test.tsx`

Expected: FAIL，原因是 `useAudioRecordingSession` 模块尚不存在。

### Task 2: 实现 `useAudioRecordingSession`

**Files:**
- Create: `src/features/note-editor/model/useAudioRecordingSession.ts`
- Modify: `src/features/note-editor/model/useAudioRecordingSession.test.tsx`

- [ ] **Step 1: 写最小实现**

`useAudioRecordingSession.ts` 负责：

- 申请录音权限
- 确保录音目录存在
- 生成当前录音文件路径
- 调用 `startRecorder()` / `stopRecorder()`
- 维护 `isRecording` 与 `currentAudioPath`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioRecordingSession.test.tsx`

Expected: PASS

## Chunk 2: 组合到 Note Recording

### Task 3: 改造 `useNoteRecording`

**Files:**
- Modify: `src/features/note-editor/model/useNoteRecording.ts`
- Modify: `src/features/note-editor/model/useNoteRecording.test.tsx`
- Reference: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 收紧 `useNoteRecording` 的职责**

移除这些职责：

- `PermissionsAndroid` 权限申请
- `RNFetchBlob` 目录与路径管理
- `startRecorder()` / `stopRecorder()` 的底层 session 管理

保留这些职责：

- `saveNoteAttachment()` 保存音频附件
- 内容与 `textSegments` 插入 `[音频N]`
- 播放状态、播放切换和当前播放索引
- `handleRecordingToggle()` 对外入口

- [ ] **Step 2: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioRecordingSession.test.tsx src/features/note-editor/model/useNoteRecording.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的录音权限、临时路径和 start/stop session 编排已下沉到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到录音播放 / UI 进一步收口与全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
