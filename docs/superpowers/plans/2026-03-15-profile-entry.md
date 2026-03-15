# Profile Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `HomeScreen` 中 profile/settings 的显隐编排和设置持久化下沉到 `src/features/profile/**`，缩小 home 页职责且不改变现有交互。

**Architecture:** 新增 `ProfileEntry` 作为 profile feature 的入口编排组件，内部管理 `ProfileModal` / `SettingsModal` 的显示状态，以及主题色、深色模式、头像更新的回写逻辑。`HomeScreen` 只保留 header 触发入口和登出确认弹层，避免这轮扩大到共享确认框抽象。

**Tech Stack:** React Native、React hooks、AsyncStorage、Jest、react-test-renderer、TypeScript

---

## Chunk 1: Profile 入口编排

### Task 1: 为 `ProfileEntry` 写失败测试

**Files:**
- Create: `src/features/profile/ui/ProfileEntry.test.tsx`
- Reference: `src/features/profile/ui/ProfileModal.test.tsx`
- Reference: `src/features/profile/ui/SettingsModal.test.tsx`
- Reference: `src/features/profile/ui/profileThemeOptions.ts`

- [ ] **Step 1: 写入口编排失败测试**

覆盖这些行为：

- 点击入口后渲染 `ProfileModal`
- 在 profile 中点击设置后渲染 `SettingsModal`
- 选择主题色时调用 `setThemeColor('桃桃乌龙')`，并写入 `AsyncStorage.setItem('themeColor', '桃桃乌龙')`
- 切换深色模式时调用 `setIsDarkMode(true)`，并写入 `AsyncStorage.setItem('isDarkMode', 'true')`
- 头像更新时通过 `setUser(previous => ({...previous, avatar}))` 回写用户状态

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/ProfileEntry.test.tsx`

Expected: FAIL，原因是 `ProfileEntry` 模块尚不存在。

### Task 2: 实现 `ProfileEntry`

**Files:**
- Create: `src/features/profile/ui/ProfileEntry.tsx`
- Modify: `src/features/profile/ui/ProfileEntry.test.tsx`
- Reference: `src/features/profile/ui/ProfileModal.tsx`
- Reference: `src/features/profile/ui/SettingsModal.tsx`

- [ ] **Step 1: 写最小实现**

`ProfileEntry.tsx` 负责：

- 管理 `showProfile` 和 `showSettings`
- 通过 render prop 暴露 `openProfile`
- 复用 `profileThemeOptions` 把颜色值映射到主题名
- 将主题色和深色模式持久化到 `AsyncStorage`
- 将头像更新回写到 `setUser`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/ProfileEntry.test.tsx`

Expected: PASS

### Task 3: 改造 `HomeScreen` 接线

**Files:**
- Modify: `src/features/home/ui/HomeScreen.tsx`
- Reference: `src/features/home/ui/HomeHeader.tsx`
- Reference: `src/features/home/ui/HomeOverlayModals.tsx`
- Reference: `src/features/profile/ui/ProfileEntry.tsx`

- [ ] **Step 1: 将 profile/settings 编排替换为 feature 入口**

保留这些职责在 `HomeScreen`：

- 主题计算
- 笔记列表与编辑器编排
- 登出确认弹层和真正的 `handleLogout`

移除这些职责：

- `showProfile`
- `showSettings`
- `handleThemeColorChange`
- `handleToggleDarkMode`
- `handleUpdateAvatar`

- [ ] **Step 2: 跑针对性单测**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/ProfileEntry.test.tsx src/features/profile/ui/ProfileModal.test.tsx src/features/profile/ui/SettingsModal.test.tsx`

Expected: PASS

## Chunk 2: 文档与回归

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- `HomeScreen` 中 profile/settings 编排已下沉到 `src/features/profile/**`
- 剩余高风险项调整为 `App.tsx` 的 auth / app-shell 边界，以及后续 H5 / Expo 评估

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
