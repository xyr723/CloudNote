# Note Editor 音频播放边界重构设计

## 背景

上一轮已经把 note-editor 的录音权限、临时路径和 start / stop session 编排下沉到 `useAudioRecordingSession`。但音频相关职责仍然分散在两个位置：

- `src/features/note-editor/model/useNoteRecording.ts`
  - 负责录音完成后的附件保存与 `[音频N]` marker 插入
  - 也继续负责播放状态与播放切换
- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 负责文本 token 拆分
  - 负责图片块渲染
  - 也内联负责音频块渲染

这样会导致：

- `useNoteRecording` 同时承担“录音写入”和“播放控制”两类不同职责
- `EditNoteContent` 混合文本、图片、音频三类 UI，文件边界继续发散
- 后续如果继续拆内容区，很难只改一类媒体而不碰整块文件

## 目标

本轮只做一轮最小可验证的边界收口：

- 将音频播放状态与播放控制从 `useNoteRecording` 中拆出
- 将音频块 UI 从 `EditNoteContent` 中拆出为独立组件
- 保持 `NoteEditorModal` 对外行为不变
- 保持音频删除、录音插入 marker、文本编辑逻辑不回退

## 非目标

本轮不做以下事项：

- 不再包一层新的 toolbar / entry flow
- 不调整录音 session hook 的接口
- 不重做音频块视觉样式
- 不同步拆图片块 UI
- 不改 `App.tsx`、theme 或 app-shell

## 推荐方案

采用“播放 hook + 音频块组件”双拆分方案。

原因：

- 播放状态只被内容区消费，独立成 hook 后依赖最清晰
- 音频块 JSX 只在 `EditNoteContent` 中出现，单独组件化成本低、收益直接
- 这一轮只动播放边界，不会和上一轮录音 session 拆分重叠

## 目标结构

### model 边界

- `src/features/note-editor/model/useAudioPlayback.ts`
  - 负责 `isPlaying`
  - 负责 `currentAudioIndex`
  - 负责 `handlePlayAudio(audioIndex)`
  - 负责播放器结束后的状态回收

- `src/features/note-editor/model/useNoteRecording.ts`
  - 继续组合 `useAudioRecordingSession`
  - 继续负责附件保存
  - 继续负责插入 `[音频N]`
  - 不再维护播放状态

### ui 边界

- `src/features/note-editor/ui/EditNoteAudioBlock.tsx`
  - 接收单个音频块需要的 props
  - 负责播放 / 暂停按钮
  - 负责删除按钮
  - 不感知 token 拆分逻辑

- `src/features/note-editor/ui/EditNoteContent.tsx`
  - 继续负责文本、图片、音频 marker 的 token 编排
  - 遇到音频 token 时，改为渲染 `EditNoteAudioBlock`
  - 不再内联音频块按钮 JSX

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 同时组合 `recording` 与 `playback`
  - 将播放相关 props传给 `EditNoteContent`
  - 工具栏仍只关心录音 toggle

## 关键数据流

### 播放

1. `NoteEditorModal` 创建 `playback = useAudioPlayback({audios})`
2. `EditNoteContent` 收到：
   - `currentAudioIndex`
   - `isPlaying`
   - `onPlayAudio`
3. 音频 token 渲染为 `EditNoteAudioBlock`
4. 用户点击播放按钮：
   - 如果当前音频正在播放，则停止播放并清空状态
   - 如果有别的音频正在播放，则先停止旧播放，再开始新播放
   - 播放自然结束时，hook 清空播放状态

### 录音完成后插入音频

1. toolbar 点击录音入口
2. `useNoteRecording` 调 `useAudioRecordingSession`
3. 停止录音后保存附件
4. 将新的音频地址写入 `audios`
5. 在 `content` 和 `textSegments` 中插入 `[音频N]`
6. 内容区根据新的 token 列表渲染音频块

### 删除音频

1. 用户点击 `EditNoteAudioBlock` 的删除按钮
2. `EditNoteContent` 继续调用已有 `onDeleteAudio(audioIndex)`
3. `useNoteMedia` 继续负责：
   - 删除音频数组项
   - 同步移除对应 marker
   - 更新 `textSegments`

本轮不改变删除流向。

## 接口设计

### `useAudioPlayback`

建议输入：

- `audios: string[]`

建议输出：

- `currentAudioIndex: number`
- `isPlaying: boolean`
- `handlePlayAudio: (audioIndex: number) => Promise<void>`

不暴露多余状态，避免过早设计暂停进度、播放时长等暂未使用的能力。

### `EditNoteAudioBlock`

建议输入：

- `audioIndex: number`
- `isActive: boolean`
- `onDelete: (audioIndex: number) => void`
- `onPlay: (audioIndex: number) => void`
- `theme: NoteEditorTheme`

按钮文案维持当前行为：

- 激活中显示“暂停”
- 非激活显示“播放”

## 错误处理

- `useAudioPlayback` 内部继续统一捕获播放器异常
- 播放失败时仍使用 `Alert.alert('错误', '播放音频失败')`
- 如果音频 URL 缺失，不额外补兜底分支，沿用现有“渲染前先判空”的模式

## 兼容性约束

- `EditNoteToolbar` 接口保持不变
- `NoteEditorModal` 仍向 `EditNoteContent` 传递同名播放 props，避免扩大改动面
- `useNoteMedia` 的删除音频逻辑保持原样
- 现有音频 marker 语义 `[音频N]` 不变

## 测试策略

### hook 测试

- 为 `useAudioPlayback` 补测试：
  - 首次播放会调用 `startPlayer`
  - 点击同一音频会停止播放并清空状态
  - 切换到另一音频时会先停止旧播放，再启动新播放
  - 播放结束监听会回收状态

### 组件测试

- 为 `EditNoteAudioBlock` 补测试：
  - 激活态展示“暂停”
  - 非激活态展示“播放”
  - 点击播放触发 `onPlay(audioIndex)`
  - 点击删除触发 `onDelete(audioIndex)`

### 回归测试

- `EditNoteContent` 继续正确渲染音频 token
- `NoteEditorModal` 继续把播放相关 props接到内容区
- 全量 Jest、TypeScript、ESLint 不新增 error

## 风险

- 播放监听的结束回收如果没有解绑干净，可能出现状态串音频
- `EditNoteContent` 在拆音频块时，容易顺手破坏 token 顺序或删除入口
- `useNoteRecording` 去掉播放状态后，若漏改 `NoteEditorModal` 接线，会出现类型或运行时回归

## 完成标准

- 播放状态不再由 `useNoteRecording` 管理
- 音频块按钮 JSX 不再内联在 `EditNoteContent` 中
- `NoteEditorModal` 明确区分录音与播放两套 hook
- 现有录音插入、音频播放、音频删除行为保持不变
- 新增测试通过，且全量验证通过
