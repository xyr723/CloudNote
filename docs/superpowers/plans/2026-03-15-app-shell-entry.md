# App Shell Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将应用入口的页面编排从 `App.tsx` 中拆出，进一步收紧 app-shell 边界。

**Architecture:** 新增 `AppShell` 负责 `useThemePreferences`、`NavigationContainer`、`AuthFlow` 和 `HomeScreen` 的编排。`App.tsx` 只保留根入口职责，不改现有 auth、home 与 profile 的内部接口。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、React Navigation

---

## Chunk 1: AppShell 组件

### Task 1: 为 `AppShell` 写失败测试

**Files:**
- Create: `src/features/app-shell/ui/AppShell.test.tsx`
- Reference: `App.tsx`
- Reference: `src/features/auth/ui/AuthFlow.tsx`

- [ ] **Step 1: 写 AppShell 失败测试**

覆盖这些行为：

- 会渲染 `HomeScreen`
- 会把 `theme` 传给 `HomeScreen`
- 会把 `themePreferences` 传给 `HomeScreen`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/app-shell/ui/AppShell.test.tsx`

Expected: FAIL，原因是 `AppShell` 模块尚不存在。

### Task 2: 实现 `AppShell`

**Files:**
- Create: `src/features/app-shell/ui/AppShell.tsx`
- Modify: `src/features/app-shell/ui/AppShell.test.tsx`
- Reference: `src/shared/theme/useThemePreferences.ts`

- [ ] **Step 1: 写最小实现**

`AppShell.tsx` 负责：

- 调用 `useThemePreferences`
- 包裹 `NavigationContainer`
- 编排 `AuthFlow -> HomeScreen`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/app-shell/ui/AppShell.test.tsx`

Expected: PASS

## Chunk 2: App 入口接线

### Task 3: 改造 `App.tsx`

**Files:**
- Modify: `App.tsx`
- Modify: `__tests__/App.test.tsx`
- Reference: `src/features/app-shell/ui/AppShell.tsx`

- [ ] **Step 1: 先改入口测试制造失败**

补一条断言，确认：

- `App` 通过 `AppShell` 渲染应用

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand __tests__/App.test.tsx`

Expected: FAIL，原因是 `App.tsx` 仍直接内联 app-shell 编排。

- [ ] **Step 3: 用 `AppShell` 替换当前入口编排**

调整为：

- `App.tsx` 只渲染 `AppShell`

- [ ] **Step 4: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/app-shell/ui/AppShell.test.tsx __tests__/App.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- `App.tsx` 的页面编排已进一步收口到 `src/features/app-shell/**`
- 剩余高风险项更聚焦到更大阶段迁移

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
