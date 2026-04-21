# 主链收口与 Expo 渐进迁移整合设计

## 背景

CloudNote 当前的主链工作分成了两类：

1. `Phase 6` 收口类事项
   - 删除旧 shim
   - 清理废弃依赖
   - 同步 README 当前状态

2. `Phase 2` Expo 迁移类事项
   - 接入 Expo runtime baseline
   - 后续接入 Expo Router
   - 再继续处理原生能力适配与 Web/PWA 验证

如果把它们拆成互不关联的文档，会出现两个问题：

- 主链上下文被切碎，难以判断当前到底走到哪一步
- 后续继续推进 Expo Router 时，很难把“已完成的收口”和“新开始的迁移”放在一个时间线里追踪

因此本轮把已经完成和即将继续的主链步骤整合到同一个 spec 和同一个 plan 里，并继续顺序执行下一段：Expo Router 根入口接管。

## 整合范围

这个整合 spec / plan 覆盖三个连续阶段：

1. **Phase 6 收口**
   - 删除旧 `app/**` shim
   - 删除明显废弃依赖
   - 对齐 README 当前状态

2. **Expo runtime baseline**
   - 接入 `expo`
   - 切到 Expo CLI bundling 链路
   - 保持现有 `App.tsx -> AppShell` 业务结构不变

3. **Expo Router root entry migration**
   - 让 Expo Router 接管根入口
   - 暂时仍由单个 route 渲染现有 `AppShell`
   - 不在本轮立即拆 `auth/notes` 细分路由

## 非目标

本轮仍然不做：

- 不开始 `auth` / `notes` 文件路由细分
- 不改 `HomeScreen`、`AuthFlow`、`NoteEditorModal` 业务逻辑
- 不处理图片、录音、文件选择器的 Expo 模块替换
- 不完成 Web/PWA 真机或浏览器发布级验证

## 方案选择

### 方案 A：继续拆成多份独立 spec / plan

优点：

- 单份文档更小

缺点：

- 主链时间线被切碎
- 后续追踪“已完成到哪一步”会持续失真

### 方案 B：整合成单一主链文档，并按 chunk 顺序执行

优点：

- 主链上下文统一
- 已完成与待完成状态可以连续表达
- 更适合逐段推进 Expo 迁移

缺点：

- 文档会比单任务文档稍长

## 结论

采用 **方案 B：整合成单一主链文档，并按 chunk 顺序执行**。

## 当前状态

截至本轮开始时：

- `Phase 6` 收口已完成
- Expo runtime baseline 已完成
- 还没开始的是 Expo Router 根入口接管

## 下一段执行目标

本轮继续推进：

### Expo Router 根入口接管

按照 Expo 官方给现有项目接入 Router 的方式：

- 安装 `expo-router`
- 在 `package.json` 中把 `main` 指向 `expo-router/entry`
- 新建 `src/app/_layout.tsx` 和 `src/app/index.tsx`
- 在 `app.json` 中补 `scheme`、`experiments.typedRoutes` 和 `web.bundler`

但为了避免一次性把导航结构全部重写，本轮只让 `src/app/index.tsx` 渲染现有 `AppShell`。

## 边界设计

### 1. Router 接管 Expo 入口

Expo Router 自己会持有根级导航容器，因此不能再让 `AppShell` 无条件包裹 `NavigationContainer`。

### 2. AppShell 变成“可选持有 NavigationContainer”

`AppShell` 调整为：

- 默认继续包裹 `NavigationContainer`
- 在 Router 路径下允许关闭这个容器

这样可以同时兼容：

- 现有 `App.tsx` / React Native CLI 入口
- 新的 Expo Router 根入口

### 3. 路由形态保持最小

本轮只创建：

- `src/app/_layout.tsx`
- `src/app/index.tsx`

不创建 `(auth)`、`(notes)`、动态段或 modal 路由。

这能保证 Router 接管先成立，再继续拆页面。

## 风险与控制

### 风险 1：Expo Router 与现有 NavigationContainer 冲突

控制：

- 通过 `AppShell` 可选容器化解嵌套容器风险
- 用组件测试锁定行为

### 风险 2：入口切到 Router 后业务首页回退

控制：

- `src/app/index.tsx` 先直接渲染现有 `AppShell`
- 不在本轮拆 auth / home 内部实现

### 风险 3：Web 相关配置继续失真

控制：

- 本轮至少补齐 `scheme`、typed routes 和 Metro web bundler 配置
- 真正 Web 运行验证留到下一轮专门计划

## 完成标准

- 主链整合 spec / plan 已建立
- 其中 `Phase 6` 与 Expo runtime baseline 在整合计划里被显式记录为已完成
- Expo Router 已接管 Expo 主入口
- `AppShell` 在 Router 路径下不再强依赖 `NavigationContainer`
- `src/app/_layout.tsx` 与 `src/app/index.tsx` 已成为新的最小 Router 根入口

## 下一段执行目标

在 Router 根入口成立之后，继续推进两个紧邻的 Expo 迁移事项：

1. **`auth / notes` 文件路由拆分**
   - 把当前 `AuthFlow` 内部的登录 / 注册 / 首页分发，切到 Expo Router 文件路由
   - 仍然保持“首页列表 + 内部编辑器 modal”的业务结构
   - 不在本轮把 note editor、profile、settings、trash 再拆成更多页面

2. **Web / PWA baseline 验证**
   - 以 `expo export --platform web` 为最小验证命令
   - 先确保 Web bundle 可以解析、导出并落地静态产物
   - 不要求本轮补齐所有原生媒体能力的 Web 对等实现

## 新的边界设计

### 1. Router 负责页面级导航，业务 feature 继续保留原有装配

新的文件路由只接管三类页面：

- `/(auth)/login`
- `/(auth)/register`
- `/(notes)/index`

其中：

- 登录 / 注册继续复用现有 `LoginScreen` / `RegisterScreen`
- 首页继续复用现有 `HomeScreen`
- note editor 仍由 `HomeScreen` 内部 modal 打开，不单独升成新 route

### 2. 认证状态抽成 Router 与旧入口都能复用的会话边界

当前 `AuthFlow` 把“session 恢复 + 登录/注册/登出编排 + navigator”绑在一个组件里。

要继续拆文件路由，必须把其中的“认证会话状态”抽成独立复用边界，让两条路径都能共存：

- 旧入口：`App.tsx -> AppShell -> AuthFlow`
- 新入口：`Expo Router -> /(auth) | /(notes)` route groups

因此本轮会把认证能力拆成：

- 一个可复用的 auth session provider / hook
- `AuthFlow` 改成消费这个 provider
- Router route 也消费同一份 provider

这样可以避免登录逻辑在 `AuthFlow` 和 route files 里重复实现。

### 3. SDK 52 这轮仍采用 redirect 方案，不提前上 protected routes

因为当前仓库基线是 Expo SDK 52 + `expo-router` v4，本轮文件路由切分继续采用 redirect 方案：

- 根 `index` 根据会话重定向到 `/(auth)/login` 或 `/(notes)`
- `/(auth)` 里的页面在已登录时重定向到 notes
- `/(notes)` 页面在未登录时重定向到 login

这样可以与当前 bare app + 增量迁移路径保持一致。

### 4. Web baseline 只修“阻塞构建”的原生依赖，不做功能完全对齐

当前 Web 导出的主要风险不在路由，而在原生模块：

- `metro-minify-esbuild` 缺少 `esbuild` peer
- `react-native-blob-util`
- `react-native-image-picker`
- `react-native-audio-recorder-player`
- `react-native-webview`

本轮控制策略：

- 对存储/附件链路，优先改造成 Web 可解析的轻量实现
- 对媒体选择、录音、H5 编辑器等能力，优先提供最小 Web fallback
- 目标是让 Web bundle 成立，而不是一次补齐完整媒体体验

## 新的非目标

本轮仍然不做：

- 不把 note editor 升级成独立 URL
- 不把 profile / settings / trash 拆成 Expo Router 页面
- 不要求 Web 端与移动端共享同一套 `WebView + HTML bridge` 宿主实现
- 不引入新的线上部署或 EAS 发布链路

## 剩余边界的执行顺序

截至 Chunk 10 完成后，以下边界已经落地：

1. **note editor 独立 Router 页面**
   - `/(notes)/editor` 已接管新建与编辑入口
   - 首页内部 modal 只保留旧入口兼容，不再作为 Router notes 页主入口

2. **H5 编辑器内部媒体上传入口**
   - 已支持文件选择、拖拽上传与粘贴上传
   - H5 编辑器不再强依赖 RN 工具栏中转媒体插入

3. **H5 widget 更完整的内联交互**
   - 已支持内联类型选择 / 编辑面板、正文任意位置插入和拖拽排序
   - 剩余只剩是否继续把 widget 表单完全下沉到纯 WebView DOM 的体验优化

4. **Web 端媒体能力与 PWA 发布级验证**
   - `imagePicker.web.ts` 已支持 file input 相册选择与拍照 fallback
   - `useAudioRecordingSession.web.ts` 已提供最小录音链路
   - `NoteEditorModal.web.tsx` 已接入现有 note-editor controller/media/recording 链
   - Web note editor 当前也已具备 H5 模式、内部媒体请求与 widget 内联编辑壳
   - `app.json` 已补齐最小 PWA metadata / favicon 配置，并通过 `expo export --platform web`

## 为什么先做 note editor 路由化

这一步已经完成，并验证了：

- `/(notes)` 首页继续负责列表
- `/(notes)/editor` 已接管编辑器页面
- 新建 / 编辑已有笔记已通过 route params 区分
- 本轮没有额外拆 profile / settings / trash

## 最新主链剩余边界

经过 Chunk 10 收口后，Expo 迁移主链剩余的高风险边界只剩两项：

1. **继续收口到 `H5 + document-first` 主编辑链路**
   - 当前仍存在 `native + content + textSegments` 与 `H5 + document` 双轨
   - 本轮已把 `createDraftFromNote / createNoteFromDraft / mergeDraftIntoNote` 的 live `document` mirror 归一化下沉到加载 / 保存边界
   - 本轮也已把 `localNoteStore.loadNotes / saveNotes` 的 live `document` mirror 归一化补到持久化边界
   - 本轮同时让 `createEmptyNoteDraft / createWelcomeNote` 默认产出 text mirror `document`
   - 本轮也让首页卡片与回收站列表优先消费 `document.plainText`
   - 本轮还新增 `applyDraftContentChange`，统一了 `NoteEditorRouteScreen` 与 `HomeScreen + HomeEditorModal` 两条父级 `content -> live document mirror` 更新路径
   - 后续需要逐步把编辑链路统一到 `document-first`

2. **决定 Web 端是否切到统一 H5 编辑宿主**
   - 当前 Web 已具备图片选择、录音 fallback、H5 模式下的内部媒体请求与 widget 内联编辑壳
   - 但它仍不是与移动端完全相同的 `WebView + HTML bridge` 宿主，需要后续决定是否继续统一到底层实现
