# App Shell Entry 收口设计

## 背景

上一轮已经把主题偏好状态和持久化写入收口到了 `useThemePreferences`。现在 `App.tsx` 只剩下少量但仍然关键的页面编排职责：

- 包裹 `NavigationContainer`
- 将 `theme` 传给 `AuthFlow`
- 将 `AuthFlow` 返回的登录态接到 `HomeScreen`
- 将 `themePreferences` 继续透传给 `HomeScreen`

虽然代码已经不长，但根入口文件仍然直接承担 app-shell 编排，这意味着 app-shell 还没有沉到独立边界中。

## 目标

本轮只做一轮最小可验证的收口：

- 新增独立的 `AppShell`
- 将 `NavigationContainer`、`AuthFlow` 和 `HomeScreen` 的编排移出 `App.tsx`
- 保持当前认证态、主页接线和主题偏好透传行为不回退

## 非目标

本轮不做以下事项：

- 不调整 `AuthFlow` 的 render-prop 接口
- 不修改 `HomeScreen` 的业务逻辑
- 不引入新的导航结构
- 不扩展到更大的全局 Context 或路由抽象

## 方案对比

### 方案 A：独立 `AppShell` 组件

新增 `src/features/app-shell/ui/AppShell.tsx`，内部承接：

- `useThemePreferences`
- `NavigationContainer`
- `AuthFlow`
- `HomeScreen`

优点：

- `App.tsx` 退化成纯入口文件
- app-shell 编排有了清晰的 feature 边界
- 风险低，不动现有 auth / home / profile 内部逻辑

缺点：

- 新增一层中间组件

### 方案 B：仅抽 `AuthHomeBridge` 小组件

只把 `AuthFlow -> HomeScreen` 的桥接抽出来，`NavigationContainer` 和 `useThemePreferences` 仍留在 `App.tsx`。

优点：

- 改动更小

缺点：

- `App.tsx` 仍保留 app-shell 主要职责，收口不彻底

### 方案 C：把 `NavigationContainer` 下沉到 `AuthFlow`

优点：

- 看起来更“集中”

缺点：

- 会把导航基础设施耦合进 auth feature
- 边界方向不对

## 推荐方案

采用方案 A：独立 `AppShell`。

原因：

- 这是最直接、最稳定、也最符合 README 当前目标的一刀
- `App.tsx` 可以真正退成纯入口
- `AuthFlow` 和 `HomeScreen` 接口保持不变，回归风险最低

## 目标结构

### app-shell feature

- `src/features/app-shell/ui/AppShell.tsx`
  - 负责调用 `useThemePreferences`
  - 负责包裹 `NavigationContainer`
  - 负责 `AuthFlow -> HomeScreen` 的页面编排

### root entry

- `App.tsx`
  - 只负责渲染 `AppShell`

## 数据流

1. `AppShell` 调用 `useThemePreferences`
2. `AppShell` 将 `theme` 传给 `AuthFlow`
3. `AuthFlow` 在登录态下回调 `onSignOut`、`setUser`、`user`
4. `AppShell` 把这些 auth 数据与 `themePreferences` 一起传给 `HomeScreen`
5. `HomeScreen` 继续把 `themePreferences` 透传给 `ProfileEntry`

## 测试策略

### 组件测试

- 为 `AppShell` 补测试：
  - 会渲染 `HomeScreen`
  - 会把 `theme` 与 `themePreferences` 透传给 `HomeScreen`

### 入口回归

- `App.test.tsx` 改为断言：
  - `App` 通过 `AppShell` 渲染应用

## 风险

- 如果 `AppShell` 忘记传 `themePreferences`，设置页主题切换链路会失效
- 如果 `NavigationContainer` 位置移动错误，auth 导航测试可能回退
- 如果把 `AuthFlow` / `HomeScreen` 接线改重了，会引入不必要的行为变化

## 完成标准

- `App.tsx` 不再直接持有 app-shell 编排逻辑
- `AppShell` 成为应用页面编排唯一入口
- 现有 auth / home / theme 透传行为保持不变
- 新增测试通过，且全量验证通过
