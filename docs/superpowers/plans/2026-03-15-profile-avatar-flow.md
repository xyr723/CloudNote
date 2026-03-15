# Profile Avatar Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `ProfileModal` 中头像确认弹层、图片选择和上传错误反馈下沉到独立头像入口组件，缩小 profile modal 的职责。

**Architecture:** 新增 `AvatarUpdateFlow` 作为 profile feature 内部头像入口组件，内部管理确认弹层可见性、图片选择、头像上传和错误提示，并通过 render prop 暴露“打开头像流程”的入口。`ProfileModal` 保留头像展示和用户信息渲染，只把 `onPressAvatar` 接到 `AvatarUpdateFlow`。

**Tech Stack:** React Native、React hooks、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 头像入口编排

### Task 1: 为 `AvatarUpdateFlow` 写失败测试

**Files:**
- Create: `src/features/profile/ui/AvatarUpdateFlow.test.tsx`
- Reference: `src/features/profile/ui/ProfileModal.test.tsx`
- Reference: `src/shared/media/imagePicker.ts`
- Reference: `src/shared/account/accountCommands.ts`

- [ ] **Step 1: 写入口编排失败测试**

覆盖这些行为：

- 点击入口后显示头像确认弹层
- 点击“选择图片”会调用 `pickSingleImageFromLibrary()` 和 `saveUserAvatar()`
- 上传成功后调用 `onUpdateAvatar(avatarUrl)` 并关闭确认弹层
- 图片选择或上传失败时调用 `Alert.alert('错误', ...)`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/AvatarUpdateFlow.test.tsx`

Expected: FAIL，原因是 `AvatarUpdateFlow` 模块尚不存在。

### Task 2: 实现 `AvatarUpdateFlow`

**Files:**
- Create: `src/features/profile/ui/AvatarUpdateFlow.tsx`
- Modify: `src/features/profile/ui/AvatarUpdateFlow.test.tsx`
- Reference: `src/features/profile/ui/profileModalStyles.ts`

- [ ] **Step 1: 写最小实现**

`AvatarUpdateFlow.tsx` 负责：

- 管理 `showAvatarPicker`
- 通过 render prop 暴露 `openAvatarPicker`
- 封装 `pickSingleImageFromLibrary()` 和 `saveUserAvatar()`
- 成功时调用 `onUpdateAvatar`
- 失败时统一 `Alert.alert`
- 渲染头像确认弹层

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/AvatarUpdateFlow.test.tsx`

Expected: PASS

## Chunk 2: Profile 接线与回归

### Task 3: 改造 `ProfileModal`

**Files:**
- Modify: `src/features/profile/ui/ProfileModal.tsx`
- Modify: `src/features/profile/ui/ProfileModal.test.tsx`
- Reference: `src/features/profile/ui/ProfileSummaryCard.tsx`
- Reference: `src/features/profile/ui/AvatarUpdateFlow.tsx`

- [ ] **Step 1: 将头像编排替换为 feature 入口**

保留这些职责在 `ProfileModal`：

- 个人中心页壳层
- `avatarSource` 计算
- 修改密码、设置、回收站、登出入口

移除这些职责：

- `showAvatarPicker`
- `handleConfirmImagePicker`
- 内联头像确认弹层 JSX

- [ ] **Step 2: 跑针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/features/profile/ui/AvatarUpdateFlow.test.tsx src/features/profile/ui/ProfileModal.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 4: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- 头像确认弹层与上传编排已下沉到 `src/features/profile/**`
- 剩余高风险项更聚焦到 note-editor 附件 UI 编排

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
