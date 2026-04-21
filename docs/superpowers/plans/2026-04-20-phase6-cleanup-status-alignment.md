# Phase 6 清理与状态对齐 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除主链重构里已经无引用的兼容 shim 和废弃依赖，并把 `README.md` 的当前状态更新到与代码一致。

**Architecture:** 本轮不碰业务行为，只做低风险仓库收口。通过一个最小 repo-state 回归测试锁定“旧 shim 不存在、废弃依赖已移除、README 已反映当前实现”这三个结果，再做删除和文档更新，最后用 Jest + TypeScript 复核。

**Tech Stack:** React Native、TypeScript、Jest、Node `fs`

---

## Chunk 1: 回归测试先锁定收口目标

### Task 1: 为 Phase 6 收口写失败测试

**Files:**
- Create: `src/shared/config/refactorPhase6Cleanup.test.ts`

- [x] **Step 1: 写失败测试**

覆盖：

- `app/utils/chatComplete.ts` 不存在
- `app/theme/colors.ts` 不存在
- `package.json` 不再包含 `axios`、`md5`、`@types/md5`
- `README.md` 包含“预览态直接消费 live draft document”的新描述
- `README.md` 不再保留旧的“parse + merge”描述

- [x] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/refactorPhase6Cleanup.test.ts`

Expected: FAIL，因为当前 shim 和废弃依赖仍然存在，README 描述也还没更新。

## Chunk 2: 做最小实现完成收口

### Task 2: 删除无引用 shim 并清理废弃依赖

**Files:**
- Delete: `app/utils/chatComplete.ts`
- Delete: `app/theme/colors.ts`
- Modify: `package.json`

- [x] **Step 1: 删除两个旧 shim**

直接删除：

- `app/utils/chatComplete.ts`
- `app/theme/colors.ts`

- [x] **Step 2: 更新依赖清单**

从 `package.json` 移除：

- `axios`
- `md5`
- `@types/md5`

- [x] **Step 3: 运行回归测试**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/refactorPhase6Cleanup.test.ts`

Expected: 仍然 FAIL，只剩 README 描述未更新相关失败。

### Task 3: 更新 README 当前状态

**Files:**
- Modify: `README.md`

- [x] **Step 1: 更新当前状态描述**

调整：

- 补上旧 `app/**` shim 已删除
- 把预览态描述改成“直接消费 live `draft.document`”
- 保持其余未完成大项不扩散

- [x] **Step 2: 运行回归测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/shared/config/refactorPhase6Cleanup.test.ts`

Expected: PASS

## Chunk 3: 最终验证

### Task 4: 跑类型检查和最小总体验证

**Files:**
- Verify only

- [x] **Step 1: 运行类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [x] **Step 2: 人工核对结果**

确认：

- `app/` 目录不再承载旧兼容入口
- `package.json` 不再包含本轮清理目标依赖
- `README.md` 当前状态与实际代码一致
- 本轮没有引入新的业务行为变化
