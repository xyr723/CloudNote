# Metric Widget Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `metric` widget 补齐真实 editor 和真实预览卡片，使创建、编辑、预览都不再走 fallback。

**Architecture:** 沿用现有 widget registry 结构，不改 `WidgetSchema` 顶层接口，只给 `metric` 增加最小真实草稿、专用 editor 和专用 renderer。实现顺序严格按 TDD 推进，先改失败测试，再补最小代码，最后跑回归验证。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Metric 草稿模型

### Task 1: 让 `createWidgetDraft('metric')` 返回真实草稿

**Files:**
- Modify: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Modify: `src/features/widget-editor/model/widgetDraftFactory.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/model/widgetDraftFactory.test.ts` 中把 `metric` 从 fallback 断言改成真实草稿断言，覆盖：

```ts
expect(createWidgetDraft('metric')).toEqual({
  id: 'draft-metric',
  type: 'metric',
  title: '关键指标',
  description: '补充说明',
  props: {
    value: '0',
    unit: '%',
  },
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，提示 `metric` 仍返回 fallback schema。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetDraftFactory.ts` 为 `metric` 增加专门分支，返回最小真实草稿；保留其他未支持类型的 fallback 行为。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

## Chunk 2: Metric Editor

### Task 2: 为 `metric` 增加专用 editor 组件

**Files:**
- Create: `src/features/widget-editor/ui/MetricWidgetEditor.test.tsx`
- Create: `src/features/widget-editor/ui/MetricWidgetEditor.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/ui/MetricWidgetEditor.test.tsx` 新增以下行为测试：

```ts
test('updates title/value/unit/description fields', () => {
  // 渲染 metric editor
  // 分别触发四个 TextInput 的 onChangeText
  // 断言 onChange 收到完整 widget
});

test('normalizes empty unit and description to undefined', () => {
  // 把 unit / description 改成空字符串
  // 断言 props.unit 与 description 为 undefined
});
```

输入项建议使用以下 placeholder：
- `组件标题`
- `指标值`
- `单位（可选）`
- `说明（可选）`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/MetricWidgetEditor.test.tsx`

Expected: FAIL，提示文件或组件不存在。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/ui/MetricWidgetEditor.tsx`：
- 解析 `widget.props?.value` / `widget.props?.unit`
- 渲染四个 `TextInput`
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`
- `value` 保留字符串
- `unit`、`description` 输入空字符串时回写 `undefined`

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/MetricWidgetEditor.test.tsx`

Expected: PASS

### Task 3: 把 `metric` 接入 editor registry

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Modify: `src/features/widget-editor/model/widgetEditorRegistry.ts`

- [ ] **Step 1: 写失败测试**

更新 `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`：
- 把“unsupported editor types”测试改成断言 `metric` 渲染真实输入框，例如存在 placeholder `指标值`
- 把 fallback 保存测试改为 `timeline` 或 `action-card`

示例断言：

```ts
expect(
  renderer.root.findAllByProps({placeholder: '指标值'}).length,
).toBeGreaterThan(0);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，提示 `metric` 仍走 fallback editor。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetEditorRegistry.ts` 注册：

```ts
'metric': MetricWidgetEditor
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 3: Metric Renderer

### Task 4: 为 `metric` 增加真实预览卡片

**Files:**
- Modify: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Create: `src/features/widget-renderer/ui/MetricWidget.tsx`
- Modify: `src/features/widget-renderer/model/widgetRegistry.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`：
- 把 `metric` fallback 断言改为真实渲染断言，覆盖标题、数值、单位、说明
- 新增缺少 `unit` / `description` 时不渲染空占位
- 把 fallback 断言改到 `timeline` 或 `action-card`

示例：

```ts
expect(readAllTextChildren(renderer)).toEqual(
  expect.arrayContaining(['关键指标', '85', '%', '本周完成率']),
);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，提示 `metric` 仍由 fallback card 渲染。

- [ ] **Step 3: 写最小实现**

新增 `src/features/widget-renderer/ui/MetricWidget.tsx`：
- 解析 `widget.props?.value` / `widget.props?.unit`
- 展示标题、大号数值、可选单位、可选说明
- 使用现有 theme token，不引入新的全局样式抽象

并在 `src/features/widget-renderer/model/widgetRegistry.ts` 注册：

```ts
'metric': MetricWidget
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: 集成回归

### Task 5: 跑本轮相关回归

**Files:**
- Verify only: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Verify only: `src/features/widget-editor/ui/MetricWidgetEditor.test.tsx`
- Verify only: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Verify only: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Verify only: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 跑 widget 相关测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/MetricWidgetEditor.test.tsx \
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
- `metric` 创建/编辑走真实 editor
- 其他未支持类型仍走 fallback
- 未修改 `WidgetSchema` 顶层结构
- 未引入 layout/actions 编辑能力

