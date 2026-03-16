# H5 Editor Preview Shell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通 `RichDocument -> HTML -> WebView` 的最小 H5 编辑器链路，为后续正式 H5 编辑器和 Widget Registry 奠定底座。

**Architecture:** 新增 `LocalHtmlEditorProvider` 作为默认 editor provider，实现 parse/serialize/renderHtml；新增 `H5DocumentPreview` 作为只读 H5 预览壳，通过 `providerRegistry.getEditorProvider()` 获取 HTML 并渲染到 `WebView`。当前原生 `NoteEditorModal` 不改入口。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 本地 editor provider

### Task 1: 为 `LocalHtmlEditorProvider` 写失败测试

**Files:**
- Create: `src/providers/editor/local/localHtmlEditorProvider.test.ts`
- Reference: `src/providers/editor/editorProvider.ts`
- Reference: `src/entities/document/types.ts`

- [ ] **Step 1: 写 provider 失败测试**

覆盖这些行为：

- `parse()` 能把纯文本拆成 paragraph blocks
- `serialize()` 能把 document 拼回纯文本
- `renderHtml()` 能输出 paragraph、list、widget 占位 HTML

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: FAIL，原因是 `LocalHtmlEditorProvider` 模块尚不存在。

### Task 2: 实现 `LocalHtmlEditorProvider`

**Files:**
- Create: `src/providers/editor/local/localHtmlEditorProvider.ts`
- Modify: `src/providers/providerRegistry.ts`
- Modify: `src/providers/editor/local/localHtmlEditorProvider.test.ts`

- [ ] **Step 1: 写最小实现**

实现：

- HTML 转义 helper
- 基础 paragraph parse/serialize
- 基础 block HTML 渲染
- `providerRegistry.getEditorProvider()`

- [ ] **Step 2: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: PASS

## Chunk 2: H5 预览壳

### Task 3: 为 `H5DocumentPreview` 写失败测试

**Files:**
- Create: `src/features/h5-editor/ui/H5DocumentPreview.test.tsx`
- Reference: `src/providers/providerRegistry.ts`

- [ ] **Step 1: 写预览壳失败测试**

覆盖这些行为：

- 会调用 provider 生成 HTML
- 会把 HTML 传给 `WebView`
- 文档变化时会重新生成 HTML

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5DocumentPreview.test.tsx`

Expected: FAIL，原因是 `H5DocumentPreview` 模块尚不存在。

### Task 4: 实现 `H5DocumentPreview`

**Files:**
- Create: `src/features/h5-editor/ui/H5DocumentPreview.tsx`
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.test.tsx`
- Reference: `src/shared/theme/colors.ts`

- [ ] **Step 1: 写最小实现**

实现：

- 从 provider 生成 HTML
- 维护 loading/html 状态
- 用 `WebView` 展示只读 HTML

- [ ] **Step 2: 运行针对性回归测试**

Run: `./node_modules/.bin/jest --runInBand src/providers/editor/local/localHtmlEditorProvider.test.ts src/features/h5-editor/ui/H5DocumentPreview.test.tsx`

Expected: PASS

## Chunk 3: 文档与验证

### Task 5: 更新 README 和验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态和后续计划**

补充：

- H5 编辑器基础预览壳与默认 editor provider 已落到 `src/features/h5-editor/**` 和 `src/providers/editor/**`
- 剩余高风险项更聚焦到正式编辑态接线与 Widget Registry

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
