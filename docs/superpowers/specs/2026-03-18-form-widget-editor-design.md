# Form Widget Editor 设计

## 背景

当前 widget 编辑链路已经支持：

- H5 编辑态发起 widget 新建、编辑、删除事件
- RN 侧通过 `WidgetTypePickerSheet` 选择组件类型
- RN 侧通过 `WidgetEditorSheet` 承载真实 editor 或 fallback editor
- `todo-list`、`metric`、`quote`、`action-card`、`timeline` 已接入真实 editor 和真实 renderer

剩余类型里，`form` 是最后一个仍依赖 fallback 主路径的 widget：

- 选择器里已经暴露给用户
- 创建链路已经打通，但草稿、编辑和渲染仍是兜底态
- 它本质上也是结构型组件，可以沿用列表对象编辑模式完成最小闭环

## 目标

本轮只为 `form` 补齐最小真实闭环：

- `form` 支持真实 editor
- `form` 支持真实预览卡片
- 新建 `form` 时不再走 fallback editor
- 编辑已有 `form` 时不再走 fallback editor
- H5 预览和 note 预览都能显示真实 `form`

## 非目标

本轮不做：

- 不做提交按钮和提交动作
- 不做必填、长度、格式等校验
- 不做 `select`、`toggle`、日期等复杂字段
- 不做字段拖拽排序
- 不做真实输入收集与表单状态管理

## 方案选择

### 推荐方案

采用“`title` + `props.fields[]`”的最小结构：

- `title` 表示表单标题
- `props.fields` 表示字段数组
- 每个字段只保留：
  - `id`
  - `label`
  - `type`
  - `placeholder`

字段类型只支持：

- `text`
- `textarea`

这样可以：

- 不修改 `WidgetSchema` 顶层结构
- 不引入额外表单引擎或提交语义
- 继续复用现有列表型 editor/renderer 模式
- 为后续扩展更多字段类型保留空间

### 未采用方案

#### 1. 同时接入提交动作和校验规则

优点：

- 更接近完整表单

缺点：

- 会把这轮重构从“去 fallback”扩大成“做表单系统”
- 需要同时定义动作、校验、错误态和预览语义

#### 2. 仅支持纯文本字段列表，不区分 `text` / `textarea`

优点：

- 实现更快

缺点：

- 无法覆盖最基本的单行/多行差异
- 很快会因为缺少字段类型而返工

## 数据结构

### 1. 顶层结构不变

继续复用现有 `WidgetSchema`：

- `title`
- `props`

### 2. `form` 的最小 props

本轮只约定：

```ts
type FormWidgetField = {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
};

type FormWidgetProps = {
  fields: FormWidgetField[];
};
```

示例：

```ts
{
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
}
```

### 3. 归一化约束

- `props.fields` 不是数组时，在 editor / renderer 中按空数组处理
- 字段对象缺少 `id` 时，按顺序回填默认 id
- `type` 不是 `text` / `textarea` 时按 `text` 处理
- `label` / `placeholder` 不是字符串时按空字符串处理
- 本轮允许删空所有字段，不强制至少保留 1 项

## 组件设计

### 1. `FormWidgetEditor`

新增：

- `src/features/widget-editor/ui/FormWidgetEditor.tsx`

职责：

- 编辑标题
- 编辑字段标题
- 编辑字段类型
- 编辑字段占位提示
- 支持新增字段
- 支持删除字段
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

不承担：

- 字段排序
- 校验规则配置
- 提交动作配置

### 2. `FormWidget`

新增：

- `src/features/widget-renderer/ui/FormWidget.tsx`

职责：

- 真实渲染表单字段预览
- 展示字段标题和占位提示
- 用静态外观区分单行和多行字段

展示要求：

- `text` 显示单行输入预览
- `textarea` 显示多行输入预览
- 字段为空时只显示标题，不额外渲染空状态模板

### 3. registry 接线

需要更新：

- `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `form -> FormWidgetEditor`
- `src/features/widget-renderer/model/widgetRegistry.ts`
  - `form -> FormWidget`

### 4. 默认草稿工厂

需要更新：

- `src/features/widget-editor/model/widgetDraftFactory.ts`

`createWidgetDraft('form')` 返回最小真实草稿，例如：

```ts
{
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
}
```

## 数据流

### 新建 `form`

1. H5 发出 `widget-insert-request`
2. RN 打开 `WidgetTypePickerSheet`
3. 用户选择 `form`
4. `createWidgetDraft('form')`
5. `WidgetEditorSheet(mode='create')` 命中 `FormWidgetEditor`
6. 用户编辑字段
7. 点击“保存”
8. `NoteEditorModal` 追加 widget block 到 `draft.document`
9. H5 / 预览态刷新为真实 `FormWidget`

### 编辑已有 `form`

1. H5 发出 `widget-edit-request`
2. `WidgetEditorSheet(mode='edit')` 命中 `FormWidgetEditor`
3. 用户编辑字段
4. 点击“保存”
5. `NoteEditorModal` 替换对应 widget block
6. H5 / 预览态刷新为真实 `FormWidget`

## 错误处理和边界

- `props.fields` 缺失时，editor 仍允许点击“新增字段”恢复到可编辑状态
- 字段为空数组时，renderer 不崩溃
- 本轮不执行占位提示或标题的必填校验
- fallback editor / renderer 仍保留给运行时未知类型，但不再作为已支持类型的主路径

## 测试设计

### `widgetDraftFactory.test.ts`

新增覆盖：

- `createWidgetDraft('form')` 返回真实草稿
- fallback 草稿覆盖改到运行时未知类型

### `FormWidgetEditor.test.tsx`

覆盖：

- 修改标题、字段标题、字段类型、占位提示会回传新 widget
- 支持新增字段
- 支持删除字段
- `props.fields` 缺失时也能新增出第一个字段

### `WidgetEditorSheet.test.tsx`

覆盖：

- `form` 命中真实 editor
- fallback editor 覆盖改到未知类型

### `WidgetRenderer.test.tsx`

覆盖：

- `form` 渲染标题、字段标题和占位提示
- 空字段列表时不崩
- fallback renderer 覆盖改到未知类型

### `NoteEditorModal.test.tsx`

覆盖：

- H5 模式下选择 `form` 后保存，document 写回真实 `form` block

## 验收标准

- 选择 `form` 时不再进入 fallback editor
- `form` 在预览中不再显示 fallback card
- 已支持类型的 editor / renderer registry 均不再依赖 fallback 主路径
- 类型检查和相关 Jest 回归通过
