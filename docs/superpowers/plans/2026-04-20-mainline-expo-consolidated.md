# 主链收口与 Expo 渐进迁移 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用一个连续的计划串起主链收口、Expo runtime baseline、Expo Router 根入口接管、`auth / notes` 文件路由拆分与 Web/PWA baseline 验证。

**Architecture:** Chunk 1-10 已完成：Phase 6 收口、Expo runtime baseline、Expo Router 根入口接管、整体验证、`auth / notes` 文件路由拆分、Web/PWA baseline、note editor 独立 Expo Router 页面、H5 编辑器内部媒体上传入口、H5 widget 更完整的内联交互，以及 Web 媒体能力与发布级 PWA 验证。

**Tech Stack:** React Native、Expo、Expo Router、TypeScript、Jest

---

## Chunk 1: Phase 6 收口

- [x] 删除旧 `app/**` shim
- [x] 清理废弃依赖
- [x] 对齐 README 当前状态
- [x] 补 repo-state 回归测试

## Chunk 2: Expo runtime baseline

- [x] 接入 `expo`
- [x] 切到 Expo CLI bundling 链路
- [x] 补齐 Expo 开发脚本与 `app.json`
- [x] 运行 `expo config`、Jest 与类型检查验证

## Chunk 3: Expo Router 根入口接管

### Task 1: 用失败测试锁定 Router 根入口和 AppShell 边界

**Files:**
- Create: `src/shared/config/expoRouterEntry.test.ts`
- Modify: `src/features/app-shell/ui/AppShell.test.tsx`

- [x] **Step 1: 写失败测试**

覆盖：

- `package.json` 的 `main` 指向 `expo-router/entry`
- `package.json` 已安装 `expo-router`
- `app.json` 包含 `scheme`、`experiments.typedRoutes`、`web.bundler`
- `src/app/_layout.tsx` 与 `src/app/index.tsx` 已存在
- `AppShell` 默认仍包裹 `NavigationContainer`
- `AppShell` 在 Router 路径下可关闭 `NavigationContainer`

- [x] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/expoRouterEntry.test.ts src/features/app-shell/ui/AppShell.test.tsx`

Expected: FAIL，因为 Router 入口和 `AppShell` 可选容器能力还未实现。

### Task 2: 安装 Expo Router 依赖

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`

- [x] **Step 1: 安装 Router 依赖**

Run:

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-web react-dom
```

Expected: 安装与当前 Expo SDK 兼容的 Router / linking / web 依赖。

### Task 3: 实现最小 Router 根入口

**Files:**
- Modify: `src/features/app-shell/ui/AppShell.tsx`
- Modify: `src/features/app-shell/ui/AppShell.test.tsx`
- Modify: `package.json`
- Modify: `app.json`
- Create: `src/app/_layout.tsx`
- Create: `src/app/index.tsx`
- Modify: `README.md`
- Modify: `src/shared/config/expoRouterEntry.test.ts`

- [x] **Step 1: 让 AppShell 支持可选 NavigationContainer**

新增一个可选 prop，让默认路径保持旧行为，Router 路径可关闭根容器。

- [x] **Step 2: 接入 Expo Router 主入口**

调整：

- `package.json` 增加 `main: "expo-router/entry"`
- 新增 `src/app/_layout.tsx`
- 新增 `src/app/index.tsx`

- [x] **Step 3: 补齐 Router 所需 app config**

在 `app.json` 中补：

- `scheme`
- `experiments.typedRoutes`
- `web.bundler`

- [x] **Step 4: 更新 README 当前状态**

补充：

- Expo Router 根入口已开始
- 当前仍未开始的是 auth / notes 路由细分和 Web/PWA 实机验证

- [x] **Step 5: 运行回归测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/expoRouterEntry.test.ts src/features/app-shell/ui/AppShell.test.tsx`

Expected: PASS

## Chunk 4: 最终验证

### Task 4: 跑整合验证

**Files:**
- Verify only

- [x] **Step 1: 跑主链 repo-state 回归**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/refactorPhase6Cleanup.test.ts \
  src/shared/config/expoRuntimeBaseline.test.ts \
  src/shared/config/expoRouterEntry.test.ts \
  src/features/app-shell/ui/AppShell.test.tsx
```

Expected: PASS

- [x] **Step 2: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [x] **Step 3: 跑 Expo 配置解析**

Run: `./node_modules/.bin/expo config --type public`

Expected: 成功解析，并包含 Expo Router 所需 app config。

- [x] **Step 4: 人工核对边界**

确认：

- Phase 6 与 Expo runtime baseline 仍保持已完成状态
- Expo Router 只接管了根入口，没有在本轮拆业务路由
- 现有 `App.tsx -> AppShell` 旧入口仍可保留用于兼容路径

## Chunk 5: auth / notes 文件路由拆分

### Task 5: 用失败测试锁定 route groups、auth session 复用和首页接线

**Files:**
- Create: `src/shared/config/expoRouterRouteGroups.test.ts`
- Create: `src/features/auth/ui/LoginRouteScreen.test.tsx`
- Create: `src/features/auth/ui/RegisterRouteScreen.test.tsx`
- Create: `src/features/home/ui/NotesRouteScreen.test.tsx`

- [x] **Step 1: 写失败测试**

覆盖：

- `src/app/(auth)/_layout.tsx`
- `src/app/(auth)/login.tsx`
- `src/app/(auth)/register.tsx`
- `src/app/(notes)/_layout.tsx`
- `src/app/(notes)/index.tsx`
- 登录 route 复用 `LoginScreen`，并把登录成功后的跳转交给 Expo Router
- 注册 route 复用 `RegisterScreen`
- notes route 在未登录时重定向到 login，在已登录时渲染现有 `HomeScreen`

- [x] **Step 2: 运行测试确认失败**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/expoRouterRouteGroups.test.ts \
  src/features/auth/ui/LoginRouteScreen.test.tsx \
  src/features/auth/ui/RegisterRouteScreen.test.tsx \
  src/features/home/ui/NotesRouteScreen.test.tsx
```

Expected: FAIL，因为 route groups、route wrappers 和共享 auth session 还未实现。

### Task 6: 实现最小 auth / notes 文件路由

**Files:**
- Create: `src/features/auth/model/AuthSessionProvider.tsx`
- Modify: `src/features/auth/ui/AuthFlow.tsx`
- Create: `src/features/auth/ui/AuthIndexRedirect.tsx`
- Create: `src/features/auth/ui/LoginRouteScreen.tsx`
- Create: `src/features/auth/ui/RegisterRouteScreen.tsx`
- Create: `src/features/home/ui/NotesRouteScreen.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/index.tsx`
- Create: `src/app/(auth)/_layout.tsx`
- Create: `src/app/(auth)/login.tsx`
- Create: `src/app/(auth)/register.tsx`
- Create: `src/app/(notes)/_layout.tsx`
- Create: `src/app/(notes)/index.tsx`
- Modify: `README.md`

- [x] **Step 1: 抽 auth session 复用边界**

把 `AuthFlow` 中的 session 恢复 / 登录 / 注册 / 登出编排抽成 provider + hook。

- [x] **Step 2: 接入 auth / notes route groups**

调整：

- 根 `index` 改成根据 session redirect
- `/(auth)` 接管 login / register
- `/(notes)` 接管首页

- [x] **Step 3: 保留旧入口兼容**

确认：

- `App.tsx -> AppShell -> AuthFlow` 旧路径仍可工作
- note editor 仍通过 `HomeScreen` 内部 modal 打开

- [x] **Step 4: 更新 README 当前状态**

补充：

- Expo Router 已从根入口推进到 `auth / notes` 文件路由
- Web / PWA baseline 验证已开始，但媒体能力仍为最小 fallback

- [x] **Step 5: 运行回归测试确认通过**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/expoRouterRouteGroups.test.ts \
  src/features/auth/ui/LoginRouteScreen.test.tsx \
  src/features/auth/ui/RegisterRouteScreen.test.tsx \
  src/features/home/ui/NotesRouteScreen.test.tsx \
  src/features/auth/ui/AuthFlow.test.tsx
```

Expected: PASS

## Chunk 6: Web / PWA baseline 验证

### Task 7: 修通 Web bundle 最小阻塞项

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `metro.config.js`
- Create/Modify: Web fallback files as needed
- Modify: `README.md`

- [x] **Step 1: 先跑 Web 导出确认真实阻塞**

Run:

```bash
./node_modules/.bin/expo export --platform web
```

Expected: 初次失败，并给出当前真实阻塞项。

- [x] **Step 2: 修复最小阻塞**

优先处理：

- `esbuild` peer 缺失
- `react-native-blob-util`
- `react-native-image-picker`
- `react-native-audio-recorder-player`
- `react-native-webview`

目标：让 Web bundle 可以导出。

- [x] **Step 3: 重新跑 Web 导出**

Run:

```bash
./node_modules/.bin/expo export --platform web
```

Expected: PASS，并生成可导出的 Web 静态产物。

- [x] **Step 4: 跑整合验证**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/refactorPhase6Cleanup.test.ts \
  src/shared/config/expoRuntimeBaseline.test.ts \
  src/shared/config/expoRouterEntry.test.ts \
  src/shared/config/expoRouterRouteGroups.test.ts \
  src/features/app-shell/ui/AppShell.test.tsx \
  src/features/auth/ui/AuthFlow.test.tsx \
  src/features/auth/ui/LoginRouteScreen.test.tsx \
  src/features/auth/ui/RegisterRouteScreen.test.tsx \
  src/features/home/ui/NotesRouteScreen.test.tsx
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/expo config --type public
git diff --check
```

Expected: PASS

## Chunk 7: note editor 独立 Expo Router 页面

### Task 8: 用失败测试锁定独立 editor route 与 notes 首页跳转

**Files:**
- Create: `src/shared/config/expoRouterNoteEditorRoute.test.ts`
- Create: `src/features/note-editor/ui/NoteEditorRouteScreen.test.tsx`
- Modify: `src/features/home/ui/NotesRouteScreen.test.tsx`

- [x] **Step 1: 写失败测试**

覆盖：

- `src/app/(notes)/editor.tsx`
- `NotesRouteScreen` 会把“新建 / 编辑已有笔记”跳转到独立 editor route
- editor route 能根据 `noteId` 加载已有笔记
- editor route 能保存新建 / 编辑结果并返回 notes 首页

- [x] **Step 2: 运行测试确认失败**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/expoRouterNoteEditorRoute.test.ts \
  src/features/note-editor/ui/NoteEditorRouteScreen.test.tsx \
  src/features/home/ui/NotesRouteScreen.test.tsx
```

Expected: FAIL，因为独立 editor route 和首页跳转接线还未实现。

### Task 9: 接入独立 editor route，同时保留旧 modal 兼容

**Files:**
- Create: `src/features/note-editor/ui/NoteEditorRouteScreen.tsx`
- Modify: `src/features/home/ui/HomeScreen.tsx`
- Modify: `src/features/home/ui/NotesRouteScreen.tsx`
- Create: `src/app/(notes)/editor.tsx`
- Modify: `README.md`

- [x] **Step 1: 让 notes 首页支持 route 模式打开 editor**

默认仍保留 modal 行为；route 模式下改为跳转 `/(notes)/editor`。

- [x] **Step 2: 新增 editor route wrapper**

让 route 自己负责：

- 读取 `noteId`
- 加载现有笔记或创建空 draft
- 保存到 `noteSyncProvider`
- 关闭后回到 `/(notes)`

- [x] **Step 3: 保留旧入口兼容**

确认：

- 旧入口 `HomeScreen + HomeEditorModal` 仍可继续使用
- route 路径只影响 Expo Router notes 首页

- [x] **Step 4: 更新 README 当前状态**

补充：

- note editor 已开始拆到独立 Expo Router 页面
- 首页内部 modal 当前只保留旧入口兼容

- [x] **Step 5: 运行回归测试确认通过**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/config/expoRouterNoteEditorRoute.test.ts \
  src/features/note-editor/ui/NoteEditorRouteScreen.test.tsx \
  src/features/home/ui/NotesRouteScreen.test.tsx \
  src/features/auth/ui/AuthFlow.test.tsx
```

Expected: PASS

## Chunk 8: H5 编辑器内部媒体上传入口

### Task 10: H5 editor 独立媒体上传

**Files:**
- TBD in execution

- [x] **Step 1: 先补失败测试，锁定文件选择器入口**
- [x] **Step 2: 接入 H5 editor 内部图片选择**
- [x] **Step 3: 补拖拽上传与粘贴上传**
- [x] **Step 4: 运行 H5 editor 回归测试**

## Chunk 9: H5 widget 更完整的内联交互

### Task 11: widget inline editing / drag / arbitrary insertion

**Files:**
- TBD in execution

- [x] **Step 1: 先补失败测试**
- [x] **Step 2: 接入 WebView 内联编辑协议**
- [x] **Step 3: 接入拖拽排序与正文任意位置插入**
- [x] **Step 4: 运行 widget editor 回归测试**

## Chunk 10: Web 媒体能力与发布级 PWA 验证

### Task 12: Web parity & release-grade PWA validation

**Files:**
- Create: `src/shared/media/imagePicker.web.test.ts`
- Create: `src/features/note-editor/model/useAudioRecordingSession.web.test.tsx`
- Create: `src/features/note-editor/ui/NoteEditorModal.web.test.tsx`
- Modify: `src/shared/config/expoWebBaseline.test.ts`
- Modify: `src/shared/media/imagePicker.web.ts`
- Create: `src/features/note-editor/model/useAudioRecordingSession.web.ts`
- Modify: `src/features/note-editor/ui/NoteEditorModal.web.tsx`
- Modify: `app.json`
- Modify: `README.md`

- [x] **Step 1: 先补失败测试 / 验证脚本**

覆盖：

- `imagePicker.web.ts` 不再返回空数组 / `null`，而是通过 file input 提供图片选择与拍照 fallback
- `useAudioRecordingSession.web.ts` 在支持 `MediaRecorder` 的浏览器上可以 start / stop，并回传可保存的录音 URL；在不支持时安全失败
- `NoteEditorModal.web.tsx` 不再只显示“暂未接入”，而是复用当前 note-editor controller/media/recording 链支持图片与录音 marker 写回
- `expoWebBaseline` 除了构建通过，还要锁定最小 PWA 配置存在

- [x] **Step 2: 运行测试确认失败**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/shared/media/imagePicker.web.test.ts \
  src/features/note-editor/model/useAudioRecordingSession.web.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.web.test.tsx \
  src/shared/config/expoWebBaseline.test.ts
```

Expected: FAIL，因为当前 Web 仍只有最小 fallback。

- [x] **Step 3: 补 Web 端图片选择与录音能力**

实现要点：

- `imagePicker.web.ts` 用浏览器 `input[type=file]` 处理相册 / 拍照选择
- `useAudioRecordingSession.web.ts` 用 `navigator.mediaDevices.getUserMedia + MediaRecorder` 提供最小录音链路
- `NoteEditorModal.web.tsx` 复用现有 controller，而不是继续维护纯文本孤岛 fallback

- [x] **Step 4: 补最小 PWA 发布配置**

至少补齐：

- `app.json` 中 Web 侧 manifest / theme / background / favicon 所需字段
- README 当前状态与剩余边界说明

- [x] **Step 5: 跑发布级 PWA 验证**

Run:

```bash
./node_modules/.bin/expo config --type public
./node_modules/.bin/expo export --platform web
```

Expected: PASS，并能在导出产物中看到完整的 Web metadata。

- [x] **Step 6: 跑最终整合验证**

Run:

```bash
./node_modules/.bin/jest --runInBand
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/expo config --type public
./node_modules/.bin/expo export --platform web
git diff --check
```

Expected: PASS

## Chunk 11: document-first 父级 draft 内容更新收口

### Task 13: 统一 route editor 与旧 modal 的父级 content mirror 更新

**Files:**
- Modify: `src/entities/note/draft.ts`
- Modify: `src/features/note-editor/ui/NoteEditorRouteScreen.tsx`
- Modify: `src/features/home/ui/HomeScreen.tsx`
- Create: `src/features/home/ui/HomeScreen.test.tsx`

- [x] **Step 1: 先补失败测试，锁定父级 draft content 更新会刷新 live document mirror**

覆盖：

- `applyDraftContentChange` 会在更新 `content` 时保留 widget blocks 并刷新 `document.plainText`
- `NoteEditorRouteScreen` 新建笔记时，父级 draft 的 `document` 会跟随 `onChangeContent` 即时刷新
- `HomeScreen + HomeEditorModal` 旧 modal 路径下，父级 draft 的 `document` 也会跟随 `onChangeContent` 即时刷新

- [x] **Step 2: 抽出 draft 层 helper 并接到两条父级编辑链路**

实现要点：

- 新增 `applyDraftContentChange(draft, content)`
- helper 内统一走 `createLiveNoteDocument({content, document: draft.document})`
- `NoteEditorRouteScreen` 与 `HomeScreen` 都复用同一个 helper，避免 route / modal 分叉

- [x] **Step 3: 跑回归与整体验证**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/entities/note/draft.test.ts \
  src/features/note-editor/ui/NoteEditorRouteScreen.test.tsx \
  src/features/home/ui/HomeScreen.test.tsx
./node_modules/.bin/jest --runInBand
./node_modules/.bin/tsc --noEmit
git diff --check
```

Expected: PASS

## Chunk 12: Web H5 宿主与 widget inline 收口

### Task 14: 让 Web note editor 接入统一 H5 模式壳

**Files:**
- Create: `src/features/h5-editor/ui/H5TextDocumentEditor.web.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.web.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.web.test.tsx`
- Modify: `README.md`

- [x] **Step 1: 先补失败测试，锁定 Web modal 的 H5 模式、内部媒体请求与 widget inline 编辑**

覆盖：

- `NoteEditorModal.web.tsx` 可切到 H5 模式
- Web H5 模式下可通过内部媒体请求入口复用现有图片插入链路
- Web H5 模式下可触发 widget inline 编辑并把结果回写到 `document`

- [x] **Step 2: 新增 Web 专用 H5 host，并让 Web modal 复用统一 controller/document/widget 编排**

实现要点：

- 新增 `H5TextDocumentEditor.web.tsx`，提供 Web 侧文本输入、媒体请求按钮、marker 删除和 widget inline 操作壳
- `NoteEditorModal.web.tsx` 改为复用 `useNoteDocumentMirror / useNoteEditorController / useNoteWidgetEditing`
- Web modal 不再停留在“原生文本 fallback + 无 widget inline”的孤岛路径

- [x] **Step 3: 跑回归与整体验证**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/note-editor/ui/NoteEditorModal.web.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.h5.media.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.widgets.editor.test.tsx
./node_modules/.bin/jest --runInBand
./node_modules/.bin/tsc --noEmit
git diff --check
```

Expected: PASS
