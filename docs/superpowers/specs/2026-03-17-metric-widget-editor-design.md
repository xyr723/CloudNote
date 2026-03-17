# Metric Widget Editor 设计

## 背景

当前 widget 编辑链路已经具备：

- H5 编辑态可输出 widget placeholder
- `H5TextDocumentEditor` 可向 RN 转发 widget bridge 事件
- RN 侧已有统一 `WidgetTypePickerSheet`
- RN 侧已有统一 `WidgetEditorSheet`
- `todo-list` 已支持真实 editor
- 预览态已有 `WidgetRenderer` 白名单机制

但除 `todo-list` 之外，其他类型当前仍停留在 fallback：

- 创建时只能进入 `FallbackWidgetEditor`
- 预览时只能显示 `FallbackWidgetCard`
- 用户无法对 `metric` 做最小真实编辑

当前最合适的下一步，不是一次把所有 widget 类型都做完，而是继续补第二个真实类型，验证 editor registry 和 renderer registry 的可扩展性。

## 目标

本轮只为 `metric` 补齐最小真实闭环：

- `metric` 支持真实 editor
- `metric` 支持真实预览卡片
- 插入 `metric` 时不再走 fallback editor
- 编辑已有 `metric` block 时不再走 fallback editor
- H5 预览和 note 预览都能看到真实 `metric` 展示

## 非目标

本轮不做：

- 不做 `layout` 编辑
- 不做 `actions` 编辑
- 不做数值格式校验
- 不做涨跌趋势、颜色语义、时间范围标签
- 不做多指标组合卡片
- 不引入新的通用 props schema 抽象层

## 推荐方案

采用“真实 editor + 真实预览”一条龙方案：

- editor 负责最小字段编辑
- renderer 负责最小展示
- schema 只补足当前 UI 必需字段

不采用“只做 editor、不做预览”的方案，因为那会让创建链路和预览链路继续断层，很快还得回头补 renderer。

## 数据结构

### 1. `WidgetSchema` 仍保持通用结构

本轮不修改 `WidgetSchema` 顶层接口，继续复用：

- `title`
- `description`
- `props`

### 2. `metric` 的最小 props

`metric` 本轮只约定：

```ts
type MetricWidgetProps = {
  value: string;
  unit?: string;
};
```

字段分工：

- `title`
  - 指标标题
- `props.value`
  - 指标值
  - 用字符串存储
- `props.unit`
  - 指标单位
  - 可选
- `description`
  - 补充说明
  - 可选

示例：

```ts
{
  id: 'draft-metric',
  type: 'metric',
  title: '关键指标',
  props: {
    value: '85',
    unit: '%',
  },
  description: '本周完成率',
}
```

### 3. 归一化约束

为避免空字符串污染 schema，本轮约定：

- `value`
  - 保留字符串，不做数值校验
- `unit`
  - 用户留空时回写为 `undefined`
- `description`
  - 用户留空时回写为 `undefined`

## 组件设计

### 1. `MetricWidgetEditor`

新增：

- `src/features/widget-editor/ui/MetricWidgetEditor.tsx`

职责：

- 编辑 `metric` 的最小字段：
  - 标题
  - 数值
  - 单位
  - 说明
- 不直接处理 document
- 只通过 `onChange(nextWidget)` 向外回传完整 `WidgetSchema`

不承担：

- 保存/取消/删除
- schema 校验弹层
- layout/actions 编辑

### 2. `MetricWidget`

新增：

- `src/features/widget-renderer/ui/MetricWidget.tsx`

职责：

- 真实渲染 `metric`
- 展示：
  - 标题
  - 大号数值
  - 单位
  - 说明

展示要求：

- 数值视觉层级高于标题和说明
- `unit` 缺失时不占位显示
- `description` 缺失时不渲染说明行

### 3. registry 接线

需要更新：

- `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `metric -> MetricWidgetEditor`
- `src/features/widget-renderer/model/widgetRegistry.ts`
  - `metric -> MetricWidget`

这样可以继续验证当前 registry 路由机制是可扩展的，而不是只为 `todo-list` 特判。

### 4. 默认草稿工厂

需要更新：

- `src/features/widget-editor/model/widgetDraftFactory.ts`

`createWidgetDraft('metric')` 不再返回 fallback schema，而是返回最小真实草稿，例如：

```ts
{
  id: 'draft-metric',
  type: 'metric',
  title: '关键指标',
  props: {
    value: '0',
    unit: '%',
  },
  description: '补充说明',
}
```

这里的默认文案只需要满足：

- 结构合法
- editor 能立即编辑
- 预览不会出现空白卡片

不需要追求最终产品文案。

## 数据流

### 新建 `metric`

1. H5 发出 `widget-insert-request`
2. RN 打开 `WidgetTypePickerSheet`
3. 用户选择 `metric`
4. `createWidgetDraft('metric')`
5. `WidgetEditorSheet(mode='create')` 命中 `MetricWidgetEditor`
6. 用户编辑字段
7. 点击“保存”
8. `NoteEditorModal` 追加 widget block 到 `draft.document`
9. H5 / 预览态刷新为真实 `MetricWidget`

### 编辑已有 `metric`

1. H5 发出 `widget-edit-request`
2. `WidgetEditorSheet(mode='edit')` 命中 `MetricWidgetEditor`
3. 用户编辑字段
4. 点击“保存”
5. `NoteEditorModal` 替换对应 widget block
6. H5 / 预览态刷新为真实 `MetricWidget`

## 测试设计

### `widgetDraftFactory.test.ts`

新增覆盖：

- `createWidgetDraft('metric')` 返回真实 `metric` 草稿
- 草稿包含：
  - `title`
  - `props.value`
  - 可选默认 `unit`
  - 可选默认 `description`

### `MetricWidgetEditor.test.tsx`

覆盖：

- 修改标题会回传新 widget
- 修改数值会回传新 widget
- 修改单位会回传新 widget
- 修改说明会回传新 widget
- 清空单位会回写 `undefined`
- 清空说明会回写 `undefined`

### `WidgetRenderer.test.tsx`

新增覆盖：

- `metric` 不再走 fallback card
- 能展示真实标题
- 能展示真实数值
- 能展示单位
- 能展示说明

### `WidgetEditorSheet.test.tsx`

新增覆盖：

- `metric` 命中真实 editor
- 创建态下能出现 `MetricWidgetEditor` 的输入项，而不是 fallback 提示

## 风险

- 如果后续想让 `metric` 支持更复杂的业务语义，本轮的最小 props 可能需要扩展
- 如果默认草稿文案设置得太激进，可能影响测试稳定性和用户预期
- 如果 `value` 后续要统一数值化处理，本轮字符串方案需要迁移，但当前这是最小成本路径

## 完成标准

- `metric` 创建时进入真实 editor
- `metric` 编辑时进入真实 editor
- `metric` 预览时显示真实卡片
- `createWidgetDraft('metric')` 返回最小真实 schema
- 清空可选字段不会在 schema 中残留空字符串
- 现有 `todo-list` editor 和其他 fallback 类型不回归
