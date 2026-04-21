# Expo Runtime Baseline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前项目从纯 React Native CLI 工程提升为可由 Expo CLI 驱动的 bare runtime baseline，同时保持现有 `App.tsx -> AppShell` 业务入口不变。

**Architecture:** 先用 Expo 官方 `install-expo-modules` 命令接入 Expo，再做最小人工补丁，把 JS 注册入口、Babel、Metro、脚本和文档收口到 Expo baseline。Router 迁移不放在本轮。

**Tech Stack:** React Native、Expo、TypeScript、Jest、Node `fs`

---

## Chunk 1: 用失败测试锁定 Expo baseline 目标

### Task 1: 为 Expo runtime baseline 写失败测试

**Files:**
- Create: `src/shared/config/expoRuntimeBaseline.test.ts`

- [x] **Step 1: 写失败测试**

覆盖：

- `package.json` 存在 `expo` 依赖
- `package.json` 存在 `expo:start` / `expo:android` / `expo:ios` / `expo:web`
- `index.js` 使用 `registerRootComponent`
- `babel.config.js` 使用 `babel-preset-expo`
- `metro.config.js` 使用 `expo/metro-config`
- `app.json` 采用 Expo 配置结构
- `README.md` 说明 Expo runtime baseline 已开始，但 Router 迁移仍未开始

- [x] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/expoRuntimeBaseline.test.ts`

Expected: FAIL，因为当前项目尚未接入 Expo baseline。

## Chunk 2: 接入 Expo runtime baseline

### Task 2: 使用官方命令安装 Expo modules

**Files:**
- Modify: `package.json`
- Modify: `ios/**`
- Modify: `android/**`

- [x] **Step 1: 运行官方安装命令**

Run: `npx install-expo-modules@latest`

Expected: 成功安装 `expo` 并为 bare app 写入基础原生配置；如果部分配置未覆盖完整，后续步骤再手补。

### Task 3: 做最小人工补丁

**Files:**
- Modify: `index.js`
- Modify: `app.json`
- Modify: `babel.config.js`
- Modify: `metro.config.js`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `README.md`

- [x] **Step 1: 调整 JS 注册入口**

把 `index.js` 改为使用 `registerRootComponent(App)`，不再手动从 `app.json` 读取应用名。

- [x] **Step 2: 补齐 Expo 脚本和配置**

调整：

- `app.json` 切到 Expo 配置根节点
- `package.json` 新增 `expo:start` / `expo:android` / `expo:ios` / `expo:web`
- `.gitignore` 新增 `.expo/`

- [x] **Step 3: 切 Expo Babel / Metro**

调整：

- `babel.config.js` 使用 `babel-preset-expo`
- `metro.config.js` 基于 `expo/metro-config`
- 保留现有 SVG transformer 与 `md/json/svg` 扩展配置

- [x] **Step 4: 更新 README 当前状态**

补充：

- Expo runtime baseline 已开始
- 当前尚未开始的是 Expo Router 迁移

- [x] **Step 5: 运行回归测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/expoRuntimeBaseline.test.ts`

Expected: PASS

## Chunk 3: 最终验证

### Task 4: 跑 Expo baseline 验证

**Files:**
- Verify only

- [x] **Step 1: 运行类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [x] **Step 2: 验证 Expo 配置可解析**

Run: `./node_modules/.bin/expo config --type public`

Expected: 成功输出 Expo public config

- [x] **Step 3: 人工核对边界**

确认：

- `App.tsx -> AppShell` 入口仍保持不变
- 本轮只完成 runtime baseline，没有引入 Router 迁移
- README 与当前实现状态一致
