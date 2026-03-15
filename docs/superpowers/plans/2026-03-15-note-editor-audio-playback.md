# Note Editor Audio Playback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 note-editor 的音频播放状态与音频块 UI 从当前大文件边界中拆出，进一步收紧录音与内容区职责。

**Architecture:** 新增 `useAudioPlayback` 管理播放状态与播放器切换逻辑，新增 `EditNoteAudioBlock` 承载单个音频块按钮 UI。`useNoteRecording` 收紧为“录音完成后的附件保存与 marker 插入”，`EditNoteContent` 继续负责 token 编排但不再内联音频块按钮 JSX，`NoteEditorModal` 同时接线录音与播放两套 hook。

**Tech Stack:** React Native、React hooks、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 播放 Hook

### Task 1: 为 `useAudioPlayback` 写失败测试

**Files:**
- Create: `src/features/note-editor/model/useAudioPlayback.test.tsx`
- Reference: `src/features/note-editor/model/useNoteRecording.test.tsx`
- Reference: `jest.setup.js`

- [ ] **Step 1: 写播放 hook 失败测试**

覆盖这些行为：

- 首次播放会调用 `startPlayer` 并记录当前播放索引
- 点击同一音频会调用 `stopPlayer` 并清空播放状态
- 切换到另一音频时会先停止旧播放，再启动新播放
- 播放结束监听触发后会清空播放状态

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioPlayback.test.tsx`

Expected: FAIL，原因是 `useAudioPlayback` 模块尚不存在。

### Task 2: 实现 `useAudioPlayback`

**Files:**
- Create: `src/features/note-editor/model/useAudioPlayback.ts`
- Modify: `src/features/note-editor/model/useAudioPlayback.test.tsx`

- [ ] **Step 1: 写最小实现**

`useAudioPlayback.ts` 负责：

- 创建播放器实例
- 维护 `isPlaying`
- 维护 `currentAudioIndex`
- 封装 `handlePlayAudio(audioIndex)`
- 播放结束时清理状态

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioPlayback.test.tsx`

Expected: PASS

## Chunk 2: 音频块 UI

### Task 3: 为 `EditNoteAudioBlock` 写失败测试并实现

**Files:**
- Create: `src/features/note-editor/ui/EditNoteAudioBlock.test.tsx`
- Create: `src/features/note-editor/ui/EditNoteAudioBlock.tsx`
- Reference: `src/features/note-editor/ui/EditNoteContent.tsx`
- Reference: `src/features/note-editor/ui/styles/mediaStyles.ts`

- [ ] **Step 1: 写音频块组件失败测试**

覆盖这些行为：

- 激活态显示“暂停”
- 非激活态显示“播放”
- 点击播放会调用 `onPlay(audioIndex)`
- 点击删除会调用 `onDelete(audioIndex)`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteAudioBlock.test.tsx`

Expected: FAIL，原因是 `EditNoteAudioBlock` 模块尚不存在。

- [ ] **Step 3: 写最小实现**

`EditNoteAudioBlock.tsx` 负责：

- 渲染播放 / 暂停按钮
- 渲染删除按钮
- 根据 `isActive` 切换文案
- 复用现有音频块样式

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/EditNoteAudioBlock.test.tsx`

Expected: PASS

## Chunk 3: 接线与回归

### Task 4: 改造 `useNoteRecording`、`EditNoteContent` 和 `NoteEditorModal`

**Files:**
- Modify: `src/features/note-editor/model/useNoteRecording.ts`
- Modify: `src/features/note-editor/model/useNoteRecording.test.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.tsx`
- Modify: `src/features/note-editor/ui/EditNoteContent.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Reference: `src/features/note-editor/model/useAudioRecordingSession.ts`
- Reference: `src/features/note-editor/model/useAudioPlayback.ts`
- Reference: `src/features/note-editor/ui/EditNoteAudioBlock.tsx`

- [ ] **Step 1: 收紧 `useNoteRecording` 的职责**

移除这些职责：

- `isPlaying`
- `currentAudioIndex`
- `handlePlayAudio`

保留这些职责：

- `handleStartRecording`
- `handleStopRecording`
- `handleRecordingToggle`
- 录音附件保存与 `[音频N]` marker 插入

- [ ] **Step 2: 将音频块渲染替换为独立组件**

调整为：

- `EditNoteContent` 保留 token 编排
- 音频 token 使用 `EditNoteAudioBlock`
- 删除与播放回调继续通过 props 传入

- [ ] **Step 3: 在 `NoteEditorModal` 接入播放 hook**

调整为：

- 新增 `playback = useAudioPlayback({audios: media.audios})`
- 内容区从 `playback` 获取 `currentAudioIndex`、`isPlaying`、`handlePlayAudio`
- 工具栏仍只从 `recording` 获取 `isRecording` 与 `handleRecordingToggle`

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useAudioPlayback.test.tsx src/features/note-editor/model/useNoteRecording.test.tsx src/features/note-editor/ui/EditNoteAudioBlock.test.tsx src/features/note-editor/ui/EditNoteContent.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 4: 文档与验证

### Task 5: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- note-editor 的音频播放状态与音频块 UI 已进一步收口到 `src/features/note-editor/**`
- 剩余高风险项更聚焦到内容区剩余媒体块边界与全局 app-shell 状态

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
