# Theme Preferences Controller 重构设计

## 背景

当前 theme 相关职责仍分散在三处：

- `App.tsx` 持有 `themeColor` 和 `isDarkMode` 状态
- `HomeScreen.tsx` 重新根据这两个原始状态生成 `theme`
- `ProfileEntry.tsx` 直接负责把主题色和深色模式写入 `AsyncStorage`

这意味着 app-shell 的主题偏好状态、主题对象派生和持久化写入还没有形成单一边界。

## 目标

本轮只做一轮最小可验证的收口：

- 新增独立的主题偏好控制 hook
- 将主题状态和持久化写入收口到同一边界
- 让 `HomeScreen` 不再自己生成 `theme`
- 保持设置页切换主题色 / 深色模式行为不回退

## 非目标

本轮不做以下事项：

- 不新增启动时从 `AsyncStorage` 恢复主题设置
- 不引入 React Context 或全局 provider
- 不调整 `AuthFlow`、导航结构或 profile 弹层交互
- 不改 `SettingsModal` 的 UI 结构

## 方案对比

### 方案 A：共享主题偏好 hook

新增 `useThemePreferences`，由它统一持有：

- `themeColor`
- `isDarkMode`
- `theme`
- 主题色和深色模式的持久化写入回调

优点：

- `App.tsx` 只接入一个清晰边界
- `ProfileEntry` 不再直接操作 `AsyncStorage`
- `HomeScreen` 不再重复派生 `theme`

缺点：

- 需要改一轮 `App` / `HomeScreen` / `ProfileEntry` 的内部 props 接线

### 方案 B：保留 `App.tsx` 状态，只抽持久化 helper

优点：

- 改动更小

缺点：

- `theme` 派生和状态仍散落在多个文件
- `HomeScreen` 的重复职责仍在

### 方案 C：直接上全局 Theme Provider

优点：

- 看起来更统一

缺点：

- 当前阶段过重，超出这轮最小收口目标
- 会扩大到更多组件的消费方式改造

## 推荐方案

采用方案 A：共享主题偏好 hook。

原因：

- 这是当前最小、最聚焦、也最容易验证的一刀
- 它能同时消掉 `HomeScreen` 的重复派生和 `ProfileEntry` 的直接持久化写入
- 不会把范围扩展到全局 Context 或启动恢复逻辑

## 目标结构

### shared/theme

- `src/shared/theme/useThemePreferences.ts`
  - 负责主题色状态
  - 负责深色模式状态
  - 负责派生 `theme`
  - 负责将主题色 / 深色模式写入 `AsyncStorage`

### App shell

- `App.tsx`
  - 不再直接持有 `themeColor` / `isDarkMode`
  - 改为消费 `useThemePreferences`
  - 将 `theme` 传给 `AuthFlow` 和 `HomeScreen`

### home / profile

- `HomeScreen.tsx`
  - 不再调用 `generateThemeColors()`
  - 只消费 `theme`
  - 透传 `themePreferences` 给 `ProfileEntry`

- `ProfileEntry.tsx`
  - 不再直接写 `AsyncStorage`
  - 继续负责把设置页的色值选择映射成主题名
  - 通过 `themePreferences` 回调上抛主题变化

## 数据流

1. `App.tsx` 调用 `useThemePreferences`
2. hook 返回：
   - `theme`
   - `themeColor`
   - `isDarkMode`
   - `onThemeColorChange`
   - `onToggleDarkMode`
3. `App.tsx` 把 `theme` 传给 `AuthFlow`
4. `App.tsx` 把 `theme` 和 `themePreferences` 传给 `HomeScreen`
5. `HomeScreen` 再把 `themePreferences` 透传给 `ProfileEntry`
6. `ProfileEntry` 在设置页交互后调用 hook 提供的回调，由 hook 负责状态更新和持久化

## 接口设计

### `useThemePreferences`

建议输出：

- `theme`
- `themeColor`
- `isDarkMode`
- `onThemeColorChange(themeName: string)`
- `onToggleDarkMode(value: boolean)`

不暴露 React `setState` 风格的原始 setter，避免 UI 直接感知内部状态实现。

### `ProfileEntry`

建议改为接收：

- `themePreferences`

其中包含：

- `themeColor`
- `isDarkMode`
- `onThemeColorChange`
- `onToggleDarkMode`

这样 `HomeScreen` 只把主题偏好控制对象透传下去，不再感知持久化细节。

## 兼容性约束

- `SettingsModal` 的 props 结构保持不变
- `AuthFlow` 的对外接口保持不变
- 现有主题色名称与色值映射保持不变
- 不改变主题切换时的视觉结果

## 测试策略

### hook 测试

- 为 `useThemePreferences` 补测试：
  - 默认返回 `薄荷生巧` + 非深色模式
  - 切换主题名时更新 `themeColor` 并写入 `AsyncStorage`
  - 切换深色模式时更新状态并写入 `AsyncStorage`

### 接线回归

- `App.test.tsx` 补断言：
  - `HomeScreen` 接收到 `theme`
  - `HomeScreen` 接收到 `themePreferences`
  - 不再直接接收旧的 `themeColor` / `isDarkMode` / `setThemeColor` / `setIsDarkMode`

- `ProfileEntry.test.tsx` 调整断言：
  - 继续调用上层回调
  - 不再直接触发 `AsyncStorage.setItem`

## 风险

- 如果 `ProfileEntry` 的主题色值到主题名映射漏掉默认分支，会导致切换到未知值时回退异常
- 如果 hook 中持久化调用顺序写错，测试可能绿但 UI 状态不同步
- 如果 `HomeScreen` 接线遗漏 `themePreferences`，设置页会失去主题切换能力

## 完成标准

- `App.tsx` 不再直接持有 `themeColor` / `isDarkMode`
- `HomeScreen.tsx` 不再调用 `generateThemeColors()`
- `ProfileEntry.tsx` 不再直接写 `AsyncStorage`
- 新增测试通过，且全量验证通过
