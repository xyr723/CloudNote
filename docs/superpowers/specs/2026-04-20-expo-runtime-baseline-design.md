# Expo Runtime Baseline 迁移设计

## 背景

README 已经把 Expo 迁移定义为主链 `Phase 2：底座迁移` 的核心任务：

- 引入 Expo
- 引入 Expo Router
- 保留现有功能，先完成基础壳迁移

但当前仓库实际状态仍停留在 React Native CLI：

- `package.json` 里没有 `expo`
- `index.js` 仍使用 `AppRegistry.registerComponent`
- `babel.config.js` 仍使用 `@react-native/babel-preset`
- `metro.config.js` 仍基于 `@react-native/metro-config`
- 没有任何可执行的 Expo 迁移 spec / implementation plan

这意味着 Expo 迁移虽然在 README 里是主链目标，但工程上还没有真正起步。

## 子项目拆分

Expo 迁移不应该一口气和 Router 改造、页面重组、Web/PWA 一起做。当前最合理的拆分是：

1. **Expo runtime baseline**
   - 把当前项目变成可由 Expo CLI 驱动的 bare app
   - 不改页面结构和业务流
2. **Expo Router entry migration**
   - 把当前 `App.tsx` / `AppShell` / `AuthFlow` 编排迁到文件路由
3. **Expo native capabilities adapter**
   - 评估并替换图片、录音、文件、权限能力
4. **Expo web / PWA validation**
   - 验证 Web 与 PWA 真正可跑

本轮只做第 1 项。

## 目标

建立一份最小但真实可用的 Expo baseline：

- 安装并配置 `expo`，让项目能使用 Expo CLI
- 保留现有 `App.tsx -> AppShell` 入口，不改业务结构
- 将 bundler / entry 配置切到 Expo 官方建议链路
- 为后续 Router 迁移留下稳定底座

## 非目标

本轮明确不做：

- 不接入 `expo-router`
- 不重写 `AppShell`、`AuthFlow`、`HomeScreen`
- 不改 note editor、H5 editor、widget 主流程
- 不把现有原生能力一次性迁到 Expo 官方模块
- 不做 Web/PWA 真正上线验证

## 方案比较

### 方案 A：直接上 Expo + Expo Router 一起迁

优点：

- 一步到位

缺点：

- 范围太大
- 一旦出问题，很难判断是 runtime、router 还是业务接线导致

### 方案 B：先做 Expo runtime baseline

做法：

- 先接入 `expo`
- 切换到 Expo CLI 的 bundler / entry 配置
- 保持当前应用结构不变

优点：

- 风险最低
- 能真实启动 Phase 2
- 为后续 Router 迁移提供干净底座

缺点：

- 这一轮还看不到文件路由收益

### 方案 C：继续只停留在 React Native CLI，先补更多业务重构

优点：

- 眼前改动最少

缺点：

- README 的主链阶段继续空转
- 后续 Router / Web / Expo SDK 模块接入都会继续被拖延

## 结论

采用 **方案 B：先做 Expo runtime baseline**。

这是符合“增量迁移，不推倒重写”的最小切口。

## 详细设计

### 1. 通过官方方式接入 Expo Modules

优先使用 Expo 官方推荐的自动安装命令：

- `npx install-expo-modules@latest`

原因：

- 这是 Expo 官方给现有 React Native 项目的推荐入口
- 它会补齐 Expo Modules API 和基础配置
- 比手改原生文件更稳

如果自动安装未完全适配当前仓库，再基于官方文档做最小人工补丁。

### 2. 保持当前 JS 入口结构不变

本轮不改 `App.tsx` 和 `AppShell` 的页面编排，只改运行时入口：

- `App.tsx` 继续渲染 `AppShell`
- `index.js` 改为 `registerRootComponent(App)`

这样做的意义：

- 先完成 runtime 切换
- 把 Router 改造留到下一轮

### 3. 切到 Expo CLI bundling 链路

按 Expo 官方建议完成这些配置：

- `babel.config.js` 改为使用 `babel-preset-expo`
- `metro.config.js` 改为基于 `expo/metro-config`
- 保留当前 SVG transformer 和自定义 sourceExts

这样后续才能稳定接 `expo start`、`expo run:*` 和 `expo-router`。

### 4. 对齐项目配置与开发命令

需要补齐：

- `app.json` 的 Expo 配置根节点
- `package.json` 的 Expo 开发脚本：
  - `expo:start`
  - `expo:android`
  - `expo:ios`
  - `expo:web`
- `.gitignore` 中加入 `.expo/`

这样开发者才能明确区分：

- 旧 RN CLI 命令
- 新 Expo CLI 命令

本轮允许保留旧脚本，避免一次性切断现有工作流。

### 5. 文档状态同步

README 需要更新到新的真实状态：

- Expo runtime baseline 已开始
- 当前仍未开始的是 Expo Router 与 Web/PWA 验证

避免继续出现“README 说要迁，但仓库里完全没起步”的状态失真。

## 测试与验证

本轮以“配置回归 + 命令可解析”为主：

1. 新增一个 repo-state 测试，覆盖：
   - `expo` 依赖已存在
   - Expo 脚本已存在
   - `index.js` 已改为 `registerRootComponent`
   - `babel.config.js` 使用 `babel-preset-expo`
   - `metro.config.js` 使用 `expo/metro-config`
   - `app.json` 为 Expo 配置结构

2. 运行：

- `./node_modules/.bin/jest --runInBand src/shared/config/expoRuntimeBaseline.test.ts`
- `./node_modules/.bin/tsc --noEmit`
- `./node_modules/.bin/expo config --type public`

## 风险与控制

### 风险 1：自动安装命令和当前仓库有差异

控制：

- 先跑失败测试锁定目标
- 自动安装后只做最小人工补丁

### 风险 2：切 Expo Metro 后影响现有 SVG / bundler 配置

控制：

- 保留现有 transformer 配置
- 用 repo-state 测试锁定 `expo/metro-config + svg transformer` 共存

### 风险 3：误把 Router 改造混进本轮

控制：

- spec 明确把 Router 迁移排除在本轮之外
- 只动 runtime baseline 必要文件

## 完成标准

- 项目已安装并配置 `expo`
- `index.js` 已改为 Expo 根入口注册方式
- Babel / Metro 已切到 Expo 官方链路
- `app.json` 和 `package.json` 已具备 Expo baseline 所需配置
- README 已明确 runtime baseline 已开始，Router 仍待后续计划
