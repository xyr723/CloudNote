# Timeline Widget Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `timeline` widget 补齐真实 editor 和真实预览卡片，使创建、编辑、预览都不再走 fallback。

**Architecture:** 继续沿用现有 widget registry 扩展模式，不修改 `WidgetSchema` 顶层接口，只给 `timeline` 增加最小真实草稿、专用 editor 和专用 renderer。实现顺序严格遵守 @superpowers:test-driven-development，先写失败测试，再补最小实现，最后跑回归验证。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Timeline 草稿模型

### Task 1: 让 `createWidgetDraft('timeline')` 返回真实草稿

**Files:**
- Modify: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Modify: `src/features/widget-editor/model/widgetDraftFactory.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/model/widgetDraftFactory.test.ts` 中把 `timeline` 改成真实草稿断言，并把 fallback 覆盖改到 `form`：

```ts
expect(createWidgetDraft('timeline')).toEqual({
  id: 'draft-timeline',
  type: 'timeline',
  title: '时间线',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，提示 `timeline` 仍返回 fallback schema。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetDraftFactory.ts` 为 `timeline` 增加专门分支，返回最小真实草稿；保留 `form` fallback。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

## Chunk 2: Timeline Editor

### Task 2: 为 `timeline` 增加专用 editor 组件

**Files:**
- Create: `src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx`
- Create: `src/features/widget-editor/ui/TimelineWidgetEditor.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx` 新增以下行为测试：

```ts
test('updates title item time and item content through onChange', () => {
  // 渲染 timeline editor
  // 修改标题、首个节点时间、首个节点内容
  // 断言 onChange 收到完整 widget
});

test('adds and removes timeline items', () => {
  // 点击新增节点
  // 点击删除节点
  // 断言 items 增删正确
});

test('creates first item when items are missing', () => {
  // 传入无 items 的 widget
  // 点击新增节点
  // 断言生成默认节点
});
```

输入项建议：
- `组件标题`
- `时间 1`
- `内容 1`
- `新增节点`
- `删除节点`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx`

Expected: FAIL，提示文件或组件不存在。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/ui/TimelineWidgetEditor.tsx`：
- 解析 `widget.props?.items`
- 渲染标题输入框
- 渲染节点列表，每个节点提供时间和内容输入框
- 支持新增和删除节点
- `items` 缺失时按空数组处理
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx`

Expected: PASS

### Task 3: 把 `timeline` 接入 editor registry

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Modify: `src/features/widget-editor/model/widgetEditorRegistry.ts`

- [ ] **Step 1: 写失败测试**

更新 `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`：
- `timeline` 改为真实 editor 断言，例如存在 placeholder `时间 1`
- fallback editor 覆盖改到 `form`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，提示 `timeline` 仍走 fallback editor。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetEditorRegistry.ts` 注册：

```ts
timeline: TimelineWidgetEditor
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 3: Timeline Renderer

### Task 4: 为 `timeline` 增加真实预览卡片

**Files:**
- Modify: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Create: `src/features/widget-renderer/ui/TimelineWidget.tsx`
- Modify: `src/features/widget-renderer/model/widgetRegistry.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`：
- 新增 `timeline` 真实渲染断言，覆盖标题、多个节点时间和内容
- 新增空节点数组时不崩溃
- fallback 覆盖改到 `form`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，提示 `timeline` 仍由 fallback card 渲染。

- [ ] **Step 3: 写最小实现**

新增 `src/features/widget-renderer/ui/TimelineWidget.tsx`：
- 解析 `widget.props?.items`
- 展示标题、节点时间和节点内容
- 空节点数组时只显示标题

并在 `src/features/widget-renderer/model/widgetRegistry.ts` 注册：

```ts
timeline: TimelineWidget
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: H5 集成回归

### Task 5: 覆盖 H5 模式下的 `timeline` 创建保存

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/note-editor/ui/NoteEditorModal.test.tsx` 新增 H5 模式下选择 `timeline` 的集成用例，断言写回真实 `timeline` block，并把 fallback 创建覆盖改到 `form`。

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，提示 `timeline` 仍写回 fallback schema。

- [ ] **Step 3: 写最小实现**

如果前面草稿工厂和 editor registry 已正确接线，这一步通常无需额外改业务代码；只在确实有缺口时补最小实现。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 5: 集成回归

### Task 6: 跑本轮相关回归

**Files:**
- Verify only: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Verify only: `src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx`
- Verify only: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Verify only: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Verify only: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 跑 widget 相关测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/TimelineWidgetEditor.test.tsx \
  src/features/widget-editor/ui/WidgetEditorSheet.test.tsx \
  src/features/widget-renderer/ui/WidgetRenderer.test.tsx \
  src/features/note-editor/ui/NoteEditorModal.test.tsx
```

Expected: PASS

- [ ] **Step 2: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 人工核对变更边界**

确认：
- `timeline` 创建/编辑走真实 editor
- `timeline` 预览走真实 renderer
- `form` 仍走 fallback
- 未修改 `WidgetSchema` 顶层结构
- 未引入排序、状态、图标或链接配置
