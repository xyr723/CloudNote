# CloudNote

CloudNote 是一个面向多端的云笔记应用，当前代码基于 React Native CLI 构建，已经具备登录注册、笔记编辑、图片/音频附件、头像、主题切换、回收站和简单 AI 文本补全等能力。

当前项目可以运行，但架构仍处于重构过渡期：

- `App.tsx` 仍承担认证态切换和页面编排入口。
- `ProfilePage.tsx`、`storage.ts` 等文件体量仍偏大，职责混杂。
- 客户端直接持有对象存储密钥，存在明显安全问题。
- 用户资料、附件上传、部分设置流程以及部分 AI 调用仍直接耦合在页面里，不可替换、不可扩展。
- 编辑器仍以原生输入为主，不适合后续的富文本、动态组件和 Agent Widget 演进。

因此本项目后续不继续围绕旧 OSS 方案修补，而是按“本地优先、可插拔、可多端扩展”的方向重构。

## 重构目标

- 支持 Android、iOS、iPadOS、Web 多端统一演进。
- 用最小拆分实现高复用 UI，避免组件碎片化。
- 通过 provider 抽象存储、认证、AI、编辑器能力，实现热插拔。
- 以 H5 富文本编辑器为核心，统一文章编辑与浏览体验。
- 为后续 Agent Widget、动态组件、结构化 AI 生成预留稳定扩展点。
- 移除客户端硬编码密钥、直连对象存储和弱密码方案。

## 技术路线

### 1. 运行时与平台

推荐迁移到 Expo，但采用增量迁移，不推倒重写。

原因：

- Expo 更适合同时覆盖 Android、iOS 和 Web。
- Expo Router 适合把当前混乱的页面入口重组为清晰路由树。
- 图片、文件、音频、权限等能力可以逐步迁移到 Expo 官方模块。
- 可以先迁底座，再迁业务，不需要一次性重写所有页面。

第一阶段平台目标：

- Android
- iOS / iPadOS
- Web

说明：

- “PC 原生桌面”不作为第一阶段目标。
- 第一阶段以 Web/PWA 代替桌面端覆盖，后续再评估 `react-native-macos` 或独立桌面壳。

### 2. 数据与同步

新的设计采用 `local-first` 模式：

- 本地是第一数据源，保证离线可用、编辑流畅。
- 云端只负责同步与备份，不参与页面直接编排。
- 所有远端接入统一走 provider，不允许页面直接访问外部服务。

推荐组合：

- 默认认证与主数据同步：Supabase
- 附件对象存储：可选 Cloudflare R2
- 本地缓存：AsyncStorage / SQLite

约束：

- 不再允许客户端持有永久对象存储密钥。
- 不再允许页面直接 `fetch` 用户文件或回收站文件。
- 所有远端访问都必须经过 `providers/*` 目录中的适配层。

### 3. AI 与 Agent Widget

AI 不再直接返回自由文本或可执行代码作为核心结果，而是改为结构化输出：

- 模型返回受约束的 JSON schema。
- 前端通过 widget registry 渲染为受控组件。
- 动态组件必须是白名单内组件，不允许执行任意 JSX / JS。

推荐方向：

- AI 负责生成 `widgetType + props + actions + layout`
- 前端负责解释和渲染
- MDX 仅作为受信内容层的可选能力，不作为主存储格式

这样可以同时满足：

- 富文本内容生成
- 动态交互卡片
- 任务面板
- 表单类交互块
- 日程、提醒、清单、引用块等定制部件

### 4. 编辑器

编辑和浏览统一切换到 H5 富文本内核。

建议：

- 移动端：`WebView` 承载统一 H5 编辑器
- Web 端：直接复用同一套编辑器/渲染器
- 文档模型：以结构化 block/document schema 存储，而不是把 UI 结构写死在原生组件里

推荐优先级：

1. BlockNote
2. Tiptap

选择原则：

- 如果重点是块编辑、动态组件、后续 Widget 扩展，优先 BlockNote。
- 如果重点是传统文章型富文本和成熟插件体系，可考虑 Tiptap。

## 目标目录结构

后续推荐目录结构如下：

```text
src/
  app/
    (auth)/
    (notes)/
    _layout.tsx

  entities/
    account/
    note/
    document/
    widget/

  features/
    auth/
    note-list/
    note-editor/
    note-viewer/
    recycle-bin/
    settings/
    ai-assistant/
    widget-renderer/

  providers/
    auth/
      local/
      supabase/
    sync/
      local/
      supabase/
      r2-assets/
    ai/
      mock/
      openai-compatible/
    editor/
      blocknote/

  shared/
    ui/
      AppButton.tsx
      AppTextField.tsx
      AppModal.tsx
      AppAvatar.tsx
      AppListItem.tsx
      AppEmptyState.tsx
      AppToast.tsx
      RichTextView.tsx
    theme/
    hooks/
    lib/
    types/
```

## UI 组件拆分原则

UI 层遵循“最小拆分、高复用”原则，不做过度组件化。

只抽离真正跨功能复用的基础件：

- `AppButton`
- `AppTextField`
- `AppModal`
- `AppAvatar`
- `AppListItem`
- `AppEmptyState`
- `AppToast`
- `RichTextView`

不建议：

- 为了“规范”把每个区块都拆成独立组件
- 为了复用而复用
- 把业务组件提到全局 `components` 垃圾桶目录

建议：

- 基础组件只关心样式变体与交互基线
- 业务组件保留在对应 `features/*` 目录
- 主题 token 集中放在 `shared/theme`
- 页面只负责装配，不写持久化和远端访问逻辑

## 分层职责

### `app`

- 路由
- 页面入口
- 页面级装配

### `entities`

- 核心领域模型
- 文档结构定义
- 纯类型与纯数据变换

### `features`

- 面向用户功能组织代码
- 组合领域对象、provider 和 UI

### `providers`

- 对接外部系统
- 统一封装认证、同步、AI、附件、编辑器
- 允许在不改页面的情况下切换实现

### `shared`

- 通用 UI
- 主题
- 工具方法
- 跨功能 hooks 和类型

## Provider 设计原则

所有外部能力都要先抽接口，再落实现。

示例：

```ts
export interface AuthProvider {
  signIn(username: string, password: string): Promise<void>;
  signUp(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<Account | null>;
}

export interface NoteSyncProvider {
  pullNotes(userId: string): Promise<Note[]>;
  pushNotes(userId: string, notes: Note[]): Promise<void>;
  moveToTrash(userId: string, noteId: string): Promise<void>;
}

export interface AiProvider {
  completeDocument(input: CompleteDocumentInput): Promise<AiCompletionResult>;
  generateWidgets(input: GenerateWidgetsInput): Promise<WidgetSchema[]>;
}
```

要求：

- 页面不直接依赖具体实现
- 通过 provider registry 或依赖注入绑定实际实现
- 允许本地 mock、开发环境 provider、正式 provider 并存

## 安全基线

以下做法必须在重构中彻底移除：

- 客户端硬编码 AccessKey / Secret
- 客户端直连对象存储上传用户私有数据
- 使用 MD5 存储或校验密码
- 页面直接请求用户文件地址
- 在富文本内容中执行不受控脚本

新的安全要求：

- 所有密钥仅存在服务端或受控环境变量
- 用户认证交给专门认证服务
- 私有资源通过受控 token、签名 URL 或服务端代理访问
- AI 输出只能渲染受控 schema

## 重构阶段

### Phase 1：止血

- 去除硬编码 OSS / AI 密钥
- 移除页面中的云存储直连逻辑
- 梳理用户、笔记、回收站、附件的数据边界
- 更新 README 与目录规划

### Phase 2：底座迁移

- 引入 Expo
- 引入 Expo Router
- 建立 `src/` 新目录
- 保留现有功能，先完成基础壳迁移

### Phase 3：Provider 化

- 抽离认证 provider
- 抽离同步 provider
- 抽离附件 provider
- 抽离 AI provider

### Phase 4：编辑器替换

- 引入 H5 富文本编辑器
- 接入文档 schema
- 提供只读浏览与编辑模式

### Phase 5：AI + Widget

- 引入 widget schema
- 建立 widget registry
- 支持 AI 生成受控交互组件

### Phase 6：收口

- 删除旧目录与废弃依赖
- 补齐测试
- 稳定多端构建流程

## 当前开发原则

- KISS
- YAGNI
- DRY
- SOLID

代码约束：

- 函数尽量不超过 50 行
- 单文件尽量不超过 300 行
- 禁止 `any`
- 全部使用严格类型
- 错误处理不得吞异常
- 注释全部使用中文

## 本地开发

当前工程已接入 Expo runtime baseline，但仍保留 React Native CLI 工作流，可继续使用以下命令：

```bash
yarn
yarn start
yarn android
yarn ios
yarn lint
yarn test
```

Expo CLI 当前也已可使用：

```bash
yarn expo:start
yarn expo:android
yarn expo:ios
yarn expo:web
```

Expo Router 已开始接管 `auth / notes` 文件路由，当前由 `/(auth)` 和 `/(notes)` 组织登录与首页入口。

Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。

note editor 已开始拆到独立 Expo Router 页面，当前由 `/(notes)/editor` 接管新建与编辑入口。

首页内部 modal 当前只保留旧入口兼容，不再作为 Expo Router notes 页的主编辑入口。

## 当前状态

当前已完成的重构工作：

- README 已替换为项目专用架构文档。
- 已建立 `src/` 目录下的实体类型与 provider 骨架。
- 已引入 `providerRegistry`，作为认证、AI、同步、附件、回收站等能力的统一入口。
- 旧的 `app/utils/chatComplete.ts` 兼容 shim 已删除，AI 调用已统一收口到 provider registry，不再硬编码 API Key。
- 首页主业务已迁到 `src/features/home/**`。
- 旧 `EditNotePage.tsx` 已删除，编辑器入口已切到 `src/features/note-editor/**`。
- 旧 `TrashPage.tsx` 已删除，回收站已切到 `src/features/trash/**`。
- 登录 / 注册页已迁到 `src/features/auth/**`。
- 个人中心 / 设置 / 修改密码已迁到 `src/features/profile/**`。
- 头像选择、图片选择与附件保存已收口到 `src/shared/account/**` 和 `src/shared/media/**` 边界。
- `HomeScreen` 中 profile / settings 的显隐编排已下沉到 `src/features/profile/**`。
- 全局 theme 偏好状态与持久化已进一步收口到 `src/shared/theme/**`。
- 旧的 `app/theme/colors.ts` 兼容 shim 已删除，主题能力已统一收口到 `src/shared/theme/**`。
- `App.tsx` 的页面编排已进一步收口到 `src/features/app-shell/**`。
- `App.tsx` 中认证导航、session 恢复和用户状态管理已下沉到 `src/features/auth/**`。
- 默认 `EditorProvider` 已落到 `src/providers/editor/**`，最小 `RichDocument -> HTML` 转换链路已打通。
- H5 只读预览壳已落到 `src/features/h5-editor/**`，当前已支持“HTML 片段 WebView + 原生 widget”混合预览宿主。
- `src/features/widget-renderer/**` 已落地，开始承载受控 widget 白名单渲染。
- Widget Registry 已接入 H5 预览链路，当前已覆盖 `todo-list / action-card / form / quote / metric / timeline` 的真实预览。
- `Note` / `NoteDraft` 已新增可选 `document` 持久化字段，当前会随现有本地同步链保存和读取 widget blocks。
- `NoteEditorModal` 已接入“编辑 / 预览”模式切换，H5 预览开始进入正式编辑入口。
- `NoteEditorModal` 已新增 H5 正文编辑模式，当前可通过 `WebView` 回写 `content + textSegments` 到 RN 状态。
- AI provider 返回的 `widgets` 已接入 note editor 草稿文档状态，当前会统一追加到正文尾部并参与后续预览与同步。
- `NoteEditorPreviewPane` 预览态当前直接消费 live `draft.document`，不再走 parse + merge 回退链路。
- 含图片 / 音频的笔记当前也可进入 H5 编辑模式，媒体 marker 会作为不可编辑占位块保留。
- H5 编辑态已新增 widget bridge 协议，当前会向 RN 侧转发 `widget-edit-request / widget-delete / widget-move / widget-insert-request`。
- `src/features/widget-editor/**` 已落地，当前提供统一 `WidgetEditorSheet`，并覆盖 `todo-list / action-card / form / quote / metric / timeline` 的专用 editor。
- `NoteEditorModal` 已接入 H5 widget 编辑链路，`todo-list` 当前可通过 RN editor 容器真实编辑并回写 `draft.document`。
- H5 模式下，widget 当前已支持新增 / 编辑 / 删除、按位置插入和上移 / 下移排序。
- H5 模式下，已有 `textSegments` 样式在本地同步回写时可继续保留，不再退化成单段纯文本。
- H5 模式下，原生工具栏已可桥接粗体 / 斜体命令到 `WebView`，并继续复用 `content + textSegments` 回写。
- H5 模式下，`A+ / A-` 已通过现有 `fontSize + textSegments` 同步链支持全局字号调整。
- H5 模式下，已支持删除已存在的图片 / 音频 marker，并复用 RN 侧媒体删除链同步 content、segments 与附件数组。
- H5 模式下，已支持通过 RN 工具栏复用现有相册 / 拍照 / 录音入口，在当前光标位置新增图片 / 音频 marker。
- H5 模式下，编辑器内部已新增“上传图片”入口，并支持文件选择、拖拽上传、粘贴上传，统一复用现有图片插入与附件保存链路。
- H5 模式下，widget 已支持在正文内联上下文里打开类型选择 / 编辑面板，支持拖拽排序，并支持在任意 text block 或 widget block 后插入。
- `ProfileModal` 中头像确认弹层与上传编排已下沉到 `src/features/profile/**`。
- note-editor 的图片入口弹层与相册 / 拍照动作编排已下沉到 `src/features/note-editor/**`。
- note-editor 的录音权限、临时路径与 start / stop session 编排已下沉到 `src/features/note-editor/**`。
- note-editor 的音频播放状态与音频块 UI 已进一步收口到 `src/features/note-editor/**`。
- note-editor 的图片块 UI 已进一步收口到 `src/features/note-editor/**`。
- note-editor 的内容 token 编排已进一步收口到 `src/features/note-editor/**`。
- note-editor 的文本输入块与内容区渲染接线已进一步收口到 `src/features/note-editor/**`。
- note-editor 的空态输入块与内容区空态切换已进一步收口到 `src/features/note-editor/**`。
- note-editor 的最终内容分发已进一步收口到 `src/features/note-editor/**`。
- Expo runtime baseline 已开始，当前已切到 Expo CLI 驱动的 bare app 配置。
- Expo Router 已开始接管 `auth / notes` 文件路由，当前由 `/(auth)` 和 `/(notes)` 组织登录与首页入口。
- Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。
- Web 端 note editor 当前也已切到统一 controller / document / widget 编排，支持 H5 模式下的内部媒体请求与 widget 内联编辑。
- note editor 已开始拆到独立 Expo Router 页面，当前由 `/(notes)/editor` 接管新建与编辑入口。
- 首页内部 modal 当前只保留旧入口兼容，不再作为 Expo Router notes 页的主编辑入口。
- `createDraftFromNote / createNoteFromDraft / mergeDraftIntoNote` 当前会自动归一化 live `document` mirror，降低离开编辑器后的双轨漂移。
- `localNoteStore` 当前会在 `loadNotes / saveNotes` 两端归一化已有 `document` 的 live mirror，减少旧持久化数据继续扩散。
- `createEmptyNoteDraft` 与 `createWelcomeNote` 当前也会默认带上 text mirror `document`，让新建态和内置示例笔记直接进入统一结构。
- 首页卡片与回收站列表当前也优先消费 `document.plainText`，不再各自重复猜测 marker 展示文本。

仍未完成的高风险遗留项：

- Web 端当前已具备图片选择、录音 fallback、H5 模式下的内部媒体请求与 widget 内联编辑，但仍不是与移动端完全相同的 `WebView + HTML bridge` 宿主。
- 编辑器主链当前仍是 `native + content + textSegments` 与 `H5 + document` 双轨并存，后续仍需要继续收口到 `document-first`。

后续建议按以下顺序推进：

1. 继续收口到 `H5 + document-first` 主编辑链路，逐步退出当前 `native + content + textSegments` 双轨状态
2. 再决定是否把 Web 端当前 RN H5 shell 升级为与移动端同一套 `WebView + HTML bridge` 宿主

这样成本最低，回滚也最容易。
