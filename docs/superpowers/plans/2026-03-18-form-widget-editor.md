# Form Widget Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `form` widget 补齐真实 editor 和真实预览卡片，使创建、编辑、预览都不再走 fallback。

**Architecture:** 继续沿用现有 widget registry 扩展模式，不修改 `WidgetSchema` 顶层接口，只给 `form` 增加最小真实草稿、专用 editor 和专用 renderer。实现顺序严格遵守 @superpowers:test-driven-development，先写失败测试，再补最小实现，最后跑回归验证。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## Chunk 1: Form 草稿模型

### Task 1: 让 `createWidgetDraft('form')` 返回真实草稿

**Files:**
- Modify: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Modify: `src/features/widget-editor/model/widgetDraftFactory.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/model/widgetDraftFactory.test.ts` 中把 `form` 改成真实草稿断言，并把 fallback 覆盖改到运行时未知类型：

```ts
expect(createWidgetDraft('form')).toEqual({
  id: 'draft-form',
  type: 'form',
  title: '表单',
  props: {
    fields: [
      {
        id: 'field-1',
        label: '姓名',
        type: 'text',
        placeholder: '请输入姓名',
      },
      {
        id: 'field-2',
        label: '补充说明',
        type: 'textarea',
        placeholder: '写点备注',
      },
    ],
  },
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，提示 `form` 仍返回 fallback schema。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetDraftFactory.ts` 为 `form` 增加专门分支，返回最小真实草稿；保留默认 fallback 处理未知类型。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

## Chunk 2: Form Editor

### Task 2: 为 `form` 增加专用 editor 组件

**Files:**
- Create: `src/features/widget-editor/ui/FormWidgetEditor.test.tsx`
- Create: `src/features/widget-editor/ui/FormWidgetEditor.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-editor/ui/FormWidgetEditor.test.tsx` 新增以下行为测试：

```ts
test('updates title field label type and placeholder through onChange', () => {
  // 修改标题、字段标题、字段类型和占位提示
  // 断言 onChange 收到完整 widget
});

test('adds and removes fields through onChange', () => {
  // 点击新增字段
  // 点击删除字段
  // 断言 fields 增删正确
});

test('creates first field when fields are missing', () => {
  // 传入无 fields 的 widget
  // 点击新增字段
  // 断言生成默认字段
});
```

输入项建议：
- `组件标题`
- `字段标题 1`
- `占位提示 1`
- `新增字段`
- `删除字段`
- `单行文本`
- `多行文本`

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/FormWidgetEditor.test.tsx`

Expected: FAIL，提示文件或组件不存在。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/ui/FormWidgetEditor.tsx`：
- 解析 `widget.props?.fields`
- 渲染标题输入框
- 渲染字段列表，每个字段提供标题、类型、占位提示编辑能力
- 支持新增和删除字段
- `fields` 缺失时按空数组处理
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/FormWidgetEditor.test.tsx`

Expected: PASS

### Task 3: 把 `form` 接入 editor registry

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Modify: `src/features/widget-editor/model/widgetEditorRegistry.ts`

- [ ] **Step 1: 写失败测试**

更新 `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`：
- `form` 改为真实 editor 断言，例如存在 placeholder `字段标题 1`
- fallback editor 覆盖改到未知类型

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，提示 `form` 仍走 fallback editor。

- [ ] **Step 3: 写最小实现**

在 `src/features/widget-editor/model/widgetEditorRegistry.ts` 注册：

```ts
form: FormWidgetEditor
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 3: Form Renderer

### Task 4: 为 `form` 增加真实预览卡片

**Files:**
- Modify: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Create: `src/features/widget-renderer/ui/FormWidget.tsx`
- Modify: `src/features/widget-renderer/model/widgetRegistry.ts`

- [ ] **Step 1: 写失败测试**

在 `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`：
- 新增 `form` 真实渲染断言，覆盖标题、字段标题和占位提示
- 新增空字段列表时不崩溃
- fallback 覆盖改到未知类型

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: FAIL，提示 `form` 仍由 fallback card 渲染。

- [ ] **Step 3: 写最小实现**

新增 `src/features/widget-renderer/ui/FormWidget.tsx`：
- 解析 `widget.props?.fields`
- 展示标题、字段标题和占位提示
- `textarea` 使用更高的静态预览容器
- 空字段数组时只显示标题

并在 `src/features/widget-renderer/model/widgetRegistry.ts` 注册：

```ts
form: FormWidget
```

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

## Chunk 4: H5 集成回归

### Task 5: 覆盖 H5 模式下的 `form` 创建保存

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `src/features/note-editor/ui/NoteEditorModal.test.tsx` 把 `form` 创建用例改为真实 `form` schema 断言。

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx -t "form"`

Expected: FAIL，提示 `form` 仍写回 fallback schema。

- [ ] **Step 3: 写最小实现**

如果前面草稿工厂和 editor registry 已正确接线，这一步通常无需额外改业务代码；只在确实有缺口时补最小实现。

- [ ] **Step 4: 运行单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx -t "form"`

Expected: PASS

## Chunk 5: 集成回归

### Task 6: 跑本轮相关回归

**Files:**
- Verify only: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
- Verify only: `src/features/widget-editor/ui/FormWidgetEditor.test.tsx`
- Verify only: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Verify only: `src/features/widget-renderer/ui/WidgetRenderer.test.tsx`
- Verify only: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 跑 widget 相关测试**

Run:

```bash
./node_modules/.bin/jest --runInBand \
  src/features/widget-editor/model/widgetDraftFactory.test.ts \
  src/features/widget-editor/ui/FormWidgetEditor.test.tsx \
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
- `form` 创建/编辑走真实 editor
- `form` 预览走真实 renderer
- fallback editor / renderer 只保留给未知运行时类型
- 未引入提交动作、校验规则或复杂字段类型
