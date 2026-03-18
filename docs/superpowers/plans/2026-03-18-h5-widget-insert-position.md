# H5 Widget 区按位置插入 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑态中的 widget 区支持首位插入和“某个 widget 后插入”，并在 RN 保存时按 `afterBlockId` 写入正确位置。

**Architecture:** 保持当前“文本内容 + widget 尾部区域”的结构不变，不进入正文任意位置插入。通过在 `entities/note/document` 增加 widget 区插入 helper、在 H5 输出多个插入按钮、在 `NoteEditorModal` 创建分支消费 `afterBlockId`，完成最小闭环。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Document 插入语义

### Task 1: 为 widget 区按位置插入补 helper 与单测

**Files:**
- Modify: `src/entities/note/document.test.ts`
- Modify: `src/entities/note/document.ts`

- [ ] **Step 1: 写失败测试**

补这些覆盖：

- `afterBlockId = null` 时插入到第一个 widget 前
- `afterBlockId = 'block-x'` 时插入到该 widget 后
- `afterBlockId` 未命中时降级追加到尾部

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: FAIL，原因是当前只有 append 语义。

- [ ] **Step 3: 写最小实现**

在 `src/entities/note/document.ts`：

- 增加新 helper，用于 widget 区插入
- `null/undefined` 表示插入到 widget 区首位
- 指定 widget block id 表示插入到该 widget 后
- 失效 target 降级 append

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: PASS

## Chunk 2: H5 插入点 UI

### Task 2: 让 H5 widget 区渲染首位和逐项插入按钮

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/h5-editor/model/h5TextEditorMarkup.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`：

- 断言 widget document 会渲染多个 `data-widget-insert-request="true"`
- 断言首位按钮没有 `data-widget-insert-after-block-id`
- 断言 widget 后按钮带正确的 block id

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: FAIL，原因是当前只有尾部一个插入按钮。

- [ ] **Step 3: 写最小实现**

在 `src/features/h5-editor/model/h5TextEditorMarkup.ts`：

- 空 widget 区时继续只渲染一个插入按钮
- 有 widget 时渲染：
  - 首位插入按钮
  - 每个 widget block
  - 每个 widget 后插入按钮

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: PASS

## Chunk 3: NoteEditorModal 创建保存接线

### Task 3: 让创建态保存按 `afterBlockId` 写入 widget 区位置

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写失败测试**

新增覆盖：

- `afterBlockId = null` 时，新 widget 插入到第一个 widget 前
- `afterBlockId = 某 widget` 时，新 widget 插入到该 widget 后
- target 失效时，降级追加到尾部

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是当前创建分支统一 append。

- [ ] **Step 3: 写最小实现**

在 `src/features/note-editor/ui/NoteEditorModal.tsx`：

- `create` 分支不再直接 `appendWidgetBlock`
- 改用新的 widget 区插入 helper
- 消费 `pendingWidgetInsert.afterBlockId`
- 保存和取消后清空 pending 状态

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 4: 相关回归验证

### Task 4: 跑完整相关回归和类型检查

**Files:**
- Verify only

- [ ] **Step 1: 跑针对性测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/entities/note/document.test.ts \
  src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx \
  src/features/widget-editor/ui/WidgetEditorSheet.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.test.tsx
```

Expected: PASS

- [ ] **Step 2: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 人工核对边界**

确认：

- 当前仍只支持 widget 区内按位置插入
- 不支持正文文本块之间任意位置插入
- AI widget 统一追加逻辑未改
- widget 编辑和删除链路未回归
