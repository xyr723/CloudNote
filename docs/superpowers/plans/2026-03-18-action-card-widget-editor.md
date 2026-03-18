# Action Card Widget Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `action-card` widget 补齐真实 editor 和真实预览卡片，使创建、编辑、预览都不再走 fallback。

**Architecture:** 继续沿用现有 widget registry 扩展模式，不修改 `WidgetSchema` 顶层接口，直接复用顶层 `actions[0]` 表示唯一主动作。实现顺序严格遵守 @superpowers:test-driven-development，先写失败测试，再补最小实现，最后跑回归验证。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Action Card 草稿模型

### Task 1: 让 `createWidgetDraft('action-card')` 返回真实草稿

**Files:**
- Modify: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Modify: `src/features/widget-editor/model/widgetDraftFactory.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/model/widgetDraftFactory.test.ts` 中新增 `action-card` 真实草稿断言：

```ts
expect(createWidgetDraft('action-card')).toEqual({
  id: 'draft-action-card',
  type: 'action-card',
  title: '动作卡片',
  description: '补充说明',
  actions: [
    {
      id: 'action-1',
      label: '立即查看',
      type: 'open-url',
      payload: {
        url: 'https://example.com',
      },
    },
  ],
  props: {},
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，提示 `action-card` 仍返回 fallback schema。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetDraftFactory.ts` 为 `action-card` 增加专门分支，返回最小真实草稿；保留 `timeline` 等其他未支持类型 fallback。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

## Chunk 2: Action Card Editor

### Task 2: 为 `action-card` 增加专用 editor 组件

**Files:**
- Create: `src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx`
- Create: `src/features/widget-editor/ui/ActionCardWidgetEditor.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx` 新增以下行为测试：

```ts
test('updates title description button label and payload through onChange', () => {
  // 渲染 action-card editor
  // 更新标题、说明、按钮文案、payload
  // 断言 onChange 收到完整 widget
});

test('switches action type from open-url to insert-text', () => {
  // 点击类型切换按钮
  // 断言 actions[0].type 变为 insert-text
  // 断言 payload 只保留 text
});

test('creates a default action when actions are missing', () => {
  // 传入无 actions 的 widget
  // 更新 payload 输入
  // 断言 editor 使用默认主动作兜底
});
```

表单元素建议：
- `组件标题`
- `说明（可选）`
- `按钮文案`
- `URL`
- `插入文本`
- 类型切换按钮文本：`打开链接` / `插入文本`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx`

Expected: FAIL，提示文件或组件不存在。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/ui/ActionCardWidgetEditor.tsx`：
- 解析并兜底 `actions[0]`
- 渲染标题、说明、按钮文案输入框
- 渲染两个类型切换按钮：`打开链接` / `插入文本`
- 根据当前类型渲染 `URL` 或 `插入文本` 输入框
- 切换类型时重建 payload：
  - `open-url` -> `{url: 'https://example.com'}`
  - `insert-text` -> `{text: '插入内容'}`
- `description` 输入空字符串时回写 `undefined`

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx`

Expected: PASS

### Task 3: 把 `action-card` 接入 editor registry

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Modify: `src/features/widget-editor/model/widgetEditorRegistry.ts`

- [ ] **Step 1: 写失败测试**

更新 `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`：
- 新增或改写断言，确认 `action-card` 渲染真实输入框，例如存在 placeholder `按钮文案`
- fallback editor 覆盖继续留给 `timeline`

示例：

```ts
expect(
  renderer.root.findAllByProps({placeholder: '按钮文案'}).length,
).toBeGreaterThan(0);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，提示 `action-card` 仍走 fallback editor。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetEditorRegistry.ts` 注册：

```ts
'action-card': ActionCardWidgetEditor
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 3: Action Card Renderer

### Task 4: 为 `action-card` 增加真实预览卡片

**Files:**
- Modify: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Create: `src/features/widget-renderer/ui/ActionCardWidget.tsx`
- Modify: `src/features/widget-renderer/model/widgetRegistry.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`：
- 新增 `action-card` 真实渲染断言，覆盖标题、说明、按钮文案、动作明细
- 覆盖 `open-url` 显示 URL
- 覆盖 `insert-text` 显示将插入的文本
- fallback 覆盖继续留给 `timeline`

示例：

```ts
expect(readAllTextChildren(renderer)).toEqual(
  expect.arrayContaining(['动作卡片', '补充说明', '立即查看', 'https://example.com']),
);
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，提示 `action-card` 仍由 fallback card 渲染。

- [ ] **Step 3: 写最小实现**

新增 `src/features/widget-renderer/ui/ActionCardWidget.tsx`：
- 解析并兜底 `actions[0]`
- 展示标题、说明、主按钮文案
- `open-url` 显示 URL
- `insert-text` 显示将插入的文本
- 只读取第一个动作

并在 `src/features/widget-renderer/model/widgetRegistry.ts` 注册：

```ts
'action-card': ActionCardWidget
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: H5 集成回归

### Task 5: 覆盖 H5 模式下的 `action-card` 创建保存

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/note-editor/ui/NoteEditorModal.test.tsx` 新增 H5 模式下选择 `action-card` 的集成用例，断言写回真实 `action-card` block：

```ts
widget: {
  id: 'draft-action-card',
  type: 'action-card',
  title: '动作卡片',
  description: '补充说明',
  actions: [
    {
      id: 'action-1',
      label: '立即查看',
      type: 'open-url',
      payload: {
        url: 'https://example.com',
      },
    },
  ],
  props: {},
}
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，提示 `action-card` 仍写回 fallback schema。

- [ ] **Step 3: 写最小实现**

如果前面草稿工厂和 editor registry 已正确接线，这一步通常无需额外改业务代码；只在确实有缺口时补最小实现。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

## Chunk 5: 集成回归

### Task 6: 跑本轮相关回归

**Files:**
- Verify only: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Verify only: `src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx`
- Verify only: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Verify only: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Verify only: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 跑 widget 相关测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/ActionCardWidgetEditor.test.tsx \
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
- `action-card` 创建/编辑走真实 editor
- `action-card` 预览走真实 renderer
- `timeline` 等其他未支持类型仍走 fallback
- 未修改 `WidgetSchema` 顶层结构
- 未引入第二按钮、图标、toggle、submit-form 或真实动作执行
