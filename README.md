# CloudNote

CloudNote 是一个面向多端的云笔记应用，当前代码基于 React Native CLI 构建，已经具备登录注册、笔记编辑、图片/音频附件、头像、主题切换、回收站和简单 AI 文本补全等能力。

当前项目可以运行，但架构已经明显失衡：

- `App.tsx` 同时承担路由、状态、同步、页面编排和业务逻辑。
- `EditNotePage.tsx`、`storage.ts` 等文件体量过大，职责混杂。
- 客户端直接持有对象存储密钥，存在明显安全问题。
- 登录、用户数据、附件上传、回收站、AI 调用都直接耦合在页面里，不可替换、不可扩展。
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

当前工程仍基于 React Native CLI，可继续使用以下命令：

```bash
yarn
yarn start
yarn android
yarn ios
yarn lint
yarn test
```

后续迁入 Expo 后，会补充 Expo 相关命令与多端启动方式。

## 当前状态

当前已完成的第一轮重构工作：

- README 已替换为项目专用架构文档。
- 已建立 `src/` 目录下的实体类型与 provider 骨架。
- 已引入 `providerRegistry`，作为 AI 和笔记同步的统一入口。
- 旧的 `chatComplete.ts` 已改为通过 AI provider 调用，不再硬编码 API Key。
- `App.tsx` 中的笔记读写已开始通过 `NoteSyncProvider` 过渡，不再直接在主流程里调用底层同步实现。

仍未完成的高风险遗留项：

- 登录、注册、回收站、附件上传仍直接耦合旧 OSS 逻辑。
- `App.tsx`、`EditNotePage.tsx`、`TrashPage.tsx` 仍然是大文件。
- H5 富文本编辑器、Widget Registry、Expo 迁移尚未落地。

后续建议按以下顺序推进：

1. 先建新目录与 provider 接口
2. 再迁认证和同步
3. 再替换编辑器
4. 最后接 AI widget

这样成本最低，回滚也最容易。
