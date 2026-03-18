# Quote Widget Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `quote` widget 补齐真实 editor 和真实预览卡片，使创建、编辑、预览都不再走 fallback。

**Architecture:** 延续现有 widget registry 扩展模式，不改 `WidgetSchema` 顶层接口，只给 `quote` 增加最小真实草稿、专用 editor 和专用 renderer。实现顺序严格遵守 @superpowers:test-driven-development，先写失败测试，再补最小实现，最后跑回归验证。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Quote 草稿模型

### Task 1: 让 `createWidgetDraft('quote')` 返回真实草稿

**Files:**
- Modify: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Modify: `src/features/widget-editor/model/widgetDraftFactory.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/model/widgetDraftFactory.test.ts` 中新增 `quote` 真实草稿断言：

```ts
expect(createWidgetDraft('quote')).toEqual({
  id: 'draft-quote',
  type: 'quote',
  title: '引用',
  description: '来源',
  props: {
    content: '在这里写下引用内容',
  },
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，提示 `quote` 仍返回 fallback schema。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetDraftFactory.ts` 为 `quote` 增加专门分支，返回最小真实草稿；保留 `timeline` 等其他未支持类型 fallback。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

## Chunk 2: Quote Editor

### Task 2: 为 `quote` 增加专用 editor 组件

**Files:**
- Create: `src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx`
- Create: `src/features/widget-editor/ui/QuoteWidgetEditor.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx` 新增以下行为测试：

```ts
test('updates title content and source through onChange', () => {
  // 渲染 quote editor
  // 分别更新标题、正文、来源
  // 断言 onChange 收到完整 widget
});

test('normalizes empty source to undefined', () => {
  // 清空来源
  // 断言 description 为 undefined
});
```

输入项使用以下 placeholder：
- `组件标题`
- `引用正文`
- `来源（可选）`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx`

Expected: FAIL，提示文件或组件不存在。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/ui/QuoteWidgetEditor.tsx`：
- 解析 `widget.props?.content`
- 渲染标题、正文、来源三个 `TextInput`
- `content` 非字符串时按空字符串处理
- `description` 输入空字符串时回写 `undefined`
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx`

Expected: PASS

### Task 3: 把 `quote` 接入 editor registry

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Modify: `src/features/widget-editor/model/widgetEditorRegistry.ts`

- [ ] **Step 1: 写失败测试**

更新 `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`：
- 新增或改写断言，确认 `quote` 渲染真实输入框，例如存在 placeholder `引用正文`
- fallback editor 覆盖继续留给 `timeline`

示例：

```ts
expect(
  renderer.root.findAllByProps({placeholder: '引用正文'}).length,
).toBeGreaterThan(0);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，提示 `quote` 仍走 fallback editor。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetEditorRegistry.ts` 注册：

```ts
quote: QuoteWidgetEditor
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 3: Quote Renderer

### Task 4: 为 `quote` 增加真实预览卡片

**Files:**
- Modify: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Create: `src/features/widget-renderer/ui/QuoteWidget.tsx`
- Modify: `src/features/widget-renderer/model/widgetRegistry.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`：
- 新增 `quote` 真实渲染断言，覆盖标题、正文、来源
- 新增来源缺失时不渲染来源行
- fallback 覆盖继续留给 `timeline`

示例：

```ts
expect(readAllTextChildren(renderer)).toEqual(
  expect.arrayContaining(['引用', '保持饥饿，保持愚蠢', '乔布斯']),
);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，提示 `quote` 仍由 fallback card 渲染。

- [ ] **Step 3: 写最小实现**

新增 `src/features/widget-renderer/ui/QuoteWidget.tsx`：
- 解析 `widget.props?.content`
- 展示标题、引用正文、可选来源
- 正文视觉优先级最高
- 来源缺失时不渲染来源行

并在 `src/features/widget-renderer/model/widgetRegistry.ts` 注册：

```ts
quote: QuoteWidget
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: H5 集成回归

### Task 5: 覆盖 H5 模式下的 `quote` 创建保存

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/note-editor/ui/NoteEditorModal.test.tsx` 新增 H5 模式下选择 `quote` 的集成用例，断言写回真实 `quote` block：

```ts
widget: {
  id: 'draft-quote',
  type: 'quote',
  title: '引用',
  description: '来源',
  props: {
    content: '在这里写下引用内容',
  },
}
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，提示 `quote` 仍写回 fallback schema。

- [ ] **Step 3: 写最小实现**

如果前面草稿工厂和 editor registry 已正确接线，这一步通常无需额外改业务代码；只在确实有缺口时补最小实现。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 5: 集成回归

### Task 6: 跑本轮相关回归

**Files:**
- Verify only: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Verify only: `src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx`
- Verify only: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Verify only: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Verify only: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 跑 widget 相关测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/QuoteWidgetEditor.test.tsx \
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
- `quote` 创建/编辑走真实 editor
- `quote` 预览走真实 renderer
- `timeline` 等其他未支持类型仍走 fallback
- 未修改 `WidgetSchema` 顶层结构
- 未引入作者头像、模板样式或链接编辑能力
