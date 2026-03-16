# Widget Registry Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `RichDocument` 中的 `widget block` 在预览态通过 Widget Registry 真实渲染，同时保持 H5 编辑态继续使用只读占位。

**Architecture:** 新增 `widget-renderer` feature 作为原生白名单渲染层；`H5DocumentPreview` 改成混合宿主，连续文本 block 继续通过 `EditorProvider.renderHtml()` 渲染为自动高度 `WebView`，widget block 则直接交给 `WidgetRenderer`；这轮只把 `todo-list` 做成真实 widget，其余类型走统一 fallback 卡片。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## Chunk 1: 文档分段与 Registry 测试先行

### Task 1: 为预览分段和 Widget Registry 补失败测试

**Files:**
- Create: `src/features/h5-editor/model/previewDocumentSegments.test.ts`
- Create: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

- [ ] **Step 1: 写 `previewDocumentSegments` 失败测试**

覆盖这些行为：

- 连续 `paragraph / heading / quote / code / list` block 会被合并成一个 `html segment`
- `widget block` 会单独成为一个 `widget segment`
- 前后都有文本 block 时，不会把 widget 错误并进 HTML segment

- [ ] **Step 2: 写 `WidgetRenderer` 失败测试**

覆盖这些行为：

- `todo-list` 类型会真实渲染 `props.items`
- `action-card / form / quote / metric / timeline` 会走 fallback 卡片
- fallback 至少展示 `title` 或 `type`

- [ ] **Step 3: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/model/previewDocumentSegments.test.ts src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，原因是分段函数、registry、真实 widget 渲染层都还不存在。

## Chunk 2: 实现文档分段与 Widget Renderer

### Task 2: 新增 `widget-renderer` feature 与分段模型

**Files:**
- Create: `src/features/h5-editor/model/previewDocumentSegments.ts`
- Create: `src/features/widget-renderer/model/widgetRegistry.ts`
- Create: `src/features/widget-renderer/ui/WidgetRenderer.tsx`
- Create: `src/features/widget-renderer/ui/TodoListWidget.tsx`
- Create: `src/features/widget-renderer/ui/FallbackWidgetCard.tsx`
- Test: `src/features/h5-editor/model/previewDocumentSegments.test.ts`
- Test: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

- [ ] **Step 1: 写最小实现**

实现：

- `previewDocumentSegments(document)` 返回有序 segment 列表
- `widgetRegistry` 提供 `todo-list` 白名单映射
- `WidgetRenderer` 先查 registry，命中则渲染真实组件，否则渲染 fallback
- `TodoListWidget` 只读解析 `widget.props.items`，仅接受字符串数组
- `FallbackWidgetCard` 稳定展示 `title / description / actions / layout`

- [ ] **Step 2: 跑针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/model/previewDocumentSegments.test.ts src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 3: 让 H5 预览支持混合宿主

### Task 3: 为 HTML segment 新增自动高度宿主

**Files:**
- Create: `src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.tsx`
- Create: `src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖这些行为：

- 会调用 `EditorProvider.renderHtml()` 渲染单个 segment 对应的子文档
- 会把返回的 HTML 包进 `WebView`
- 会处理来自 `WebView` 的高度消息并更新自身高度

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.test.tsx`

Expected: FAIL，原因是自动高度预览块尚不存在。

- [ ] **Step 3: 写最小实现**

实现：

- 接收 `blocks` 和 `theme`
- 组装单段 `RichDocument`
- 调用 `EditorProvider.renderHtml()`
- 在 HTML 中注入高度上报脚本
- 通过 `onMessage` 更新本地高度

- [ ] **Step 4: 跑测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.test.tsx`

Expected: PASS

### Task 4: 改造 `H5DocumentPreview` 为混合宿主

**Files:**
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.tsx`
- Modify: `src/features/h5-editor/ui/H5DocumentPreview.test.tsx`
- Test: `src/features/h5-editor/model/previewDocumentSegments.test.ts`
- Test: `src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖这些行为：

- 会把文档拆分为 HTML segment + widget segment
- HTML segment 交给 `AutoHeightHtmlPreviewBlock`
- widget segment 交给 `WidgetRenderer`
- 文档更新时会重新渲染对应内容

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5DocumentPreview.test.tsx`

Expected: FAIL，原因是当前实现仍是单个整页 `WebView`。

- [ ] **Step 3: 写最小实现**

实现：

- 使用 `previewDocumentSegments(document)`
- 按顺序渲染 segment
- HTML segment 渲染 `AutoHeightHtmlPreviewBlock`
- widget segment 渲染 `WidgetRenderer`

- [ ] **Step 4: 跑测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/h5-editor/model/previewDocumentSegments.test.ts src/features/h5-editor/ui/AutoHeightHtmlPreviewBlock.test.tsx src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: 预览链路回归与编辑态守边界

### Task 5: 补 note editor 预览回归

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`

- [ ] **Step 1: 写回归测试**

覆盖这些行为：

- 现有图片 / 音频 marker 占位预览不回归
- `NoteEditorPreviewPane` 仍然只负责 `content -> parse() -> RichDocument -> H5DocumentPreview`

- [ ] **Step 2: 运行测试确认当前状态**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS 或因 `H5DocumentPreview` mock 形态变化出现可预期失败。

- [ ] **Step 3: 做最小适配**

仅在测试或类型接线需要时修改 [NoteEditorPreviewPane.tsx](/Volumes/helllo/project/CloudNote/src/features/note-editor/ui/NoteEditorPreviewPane.tsx)，不要扩展 widget 编辑态逻辑。

- [ ] **Step 4: 跑相关回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: PASS

### Task 6: 保持 H5 编辑态边界不变

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/providers/editor/local/localHtmlEditorProvider.test.ts`

- [ ] **Step 1: 补编辑态守边界测试**

覆盖这些行为：

- `LocalHtmlEditorProvider.renderHtml()` 仍保留 widget placeholder 输出
- `H5TextDocumentEditor` 不会把 widget 当真实原生组件处理

- [ ] **Step 2: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/providers/editor/local/localHtmlEditorProvider.test.ts`

Expected: PASS

## Chunk 5: 文档与全量验证

### Task 7: 更新 README 当前状态

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前状态**

补充：

- Widget Registry 已接入预览链路
- `todo-list` 已有真实预览实现
- 其他 widget 类型当前仍走 fallback 卡片
- H5 编辑态里的 widget 仍保持只读占位

- [ ] **Step 2: 跑全量验证**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

Run: `./node_modules/.bin/eslint .`

Expected: 0 error，允许保留现有历史 warning

Run: `git diff --check`

Expected: 无输出
