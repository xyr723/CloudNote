# Theme Preferences Controller Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 抽离主题偏好控制层，统一管理 theme 状态与持久化写入，并缩小 `App.tsx`、`HomeScreen.tsx`、`ProfileEntry.tsx` 的主题职责。

**Architecture:** 新增 `useThemePreferences` 负责 `themeColor`、`isDarkMode`、`theme` 以及持久化写入回调。`App.tsx` 改为接入该 hook，`HomeScreen.tsx` 不再本地派生 `theme`，`ProfileEntry.tsx` 只负责主题色值到主题名的 UI 映射。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、AsyncStorage

---

## Chunk 1: 主题偏好 hook

### Task 1: 为 `useThemePreferences` 写失败测试

**Files:**
- Create: `src/shared/theme/useThemePreferences.test.tsx`
- Reference: `src/shared/theme/colors.ts`

- [ ] **Step 1: 写主题偏好 hook 失败测试**

覆盖这些行为：

- 默认返回 `薄荷生巧` 和 `false`
- 切换主题名时更新状态并写入 `AsyncStorage`
- 切换深色模式时更新状态并写入 `AsyncStorage`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/shared/theme/useThemePreferences.test.tsx`

Expected: FAIL，原因是 `useThemePreferences` 模块尚不存在。

### Task 2: 实现 `useThemePreferences`

**Files:**
- Create: `src/shared/theme/useThemePreferences.ts`
- Modify: `src/shared/theme/useThemePreferences.test.tsx`

- [ ] **Step 1: 写最小实现**

`useThemePreferences.ts` 负责：

- 持有 `themeColor`
- 持有 `isDarkMode`
- 派生 `theme`
- 封装 `AsyncStorage.setItem`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/shared/theme/useThemePreferences.test.tsx`

Expected: PASS

## Chunk 2: App shell 接线

### Task 3: 为 app-shell 主题接线补回归测试

**Files:**
- Modify: `__tests__/App.test.tsx`
- Modify: `src/features/profile/ui/ProfileEntry.test.tsx`
- Reference: `App.tsx`
- Reference: `src/features/home/ui/HomeScreen.tsx`

- [ ] **Step 1: 先改测试制造失败**

补这些断言：

- `App` 传给 `HomeScreen` 的是 `theme`
- `App` 传给 `HomeScreen` 的是 `themePreferences`
- `HomeScreen` 不再收到旧的原始 theme 状态 props
- `ProfileEntry` 切换设置时继续调用上层回调，但不再直接写 `AsyncStorage`

- [ ] **Step 2: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand __tests__/App.test.tsx src/features/profile/ui/ProfileEntry.test.tsx`

Expected: FAIL，原因是当前 `App.tsx` / `ProfileEntry.tsx` 仍使用旧接线。

### Task 4: 改造 `App.tsx`、`HomeScreen.tsx`、`ProfileEntry.tsx`

**Files:**
- Modify: `App.tsx`
- Modify: `src/features/home/ui/HomeScreen.tsx`
- Modify: `src/features/profile/ui/ProfileEntry.tsx`
- Reference: `src/shared/theme/useThemePreferences.ts`

- [ ] **Step 1: 用 hook 替换当前主题状态接线**

调整为：

- `App.tsx` 使用 `useThemePreferences`
- `HomeScreen.tsx` 只接收 `theme`
- `ProfileEntry.tsx` 通过 `themePreferences` 回调上抛变化

- [ ] **Step 2: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/shared/theme/useThemePreferences.test.tsx __tests__/App.test.tsx src/features/profile/ui/ProfileEntry.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 5: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- 全局 theme 偏好状态与持久化已进一步收口到 `src/shared/theme/**`
- 剩余高风险项更聚焦到 app-shell 页面编排与更大阶段迁移

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
