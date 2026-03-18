# Timeline Widget Editor 设计

## 背景

当前 widget 编辑链路已经支持：

- H5 编辑态发起 widget 新建、编辑、删除事件
- RN 侧通过 `WidgetTypePickerSheet` 选择组件类型
- RN 侧通过 `WidgetEditorSheet` 承载真实 editor 或 fallback editor
- `todo-list`、`metric`、`quote`、`action-card` 已接入真实 editor 和真实 renderer

剩余类型里，`timeline` 是最适合继续转正的结构型组件：

- 可以复用列表型 editor 模式
- 数据结构清晰，只有节点数组
- 能继续验证 registry 路线对嵌套列表对象的扩展能力

## 目标

本轮只为 `timeline` 补齐最小真实闭环：

- `timeline` 支持真实 editor
- `timeline` 支持真实预览卡片
- 新建 `timeline` 时不再走 fallback editor
- 编辑已有 `timeline` 时不再走 fallback editor
- H5 预览和 note 预览都能显示真实 `timeline`

## 非目标

本轮不做：

- 不做拖拽排序
- 不做时间格式校验
- 不做状态、颜色、图标
- 不做链接
- 不做空状态插画或模板

## 推荐方案

采用“复用 `title` + 在 `props.items` 中维护节点数组”的最小方案：

- `title` 表示卡片标题
- `props.items` 表示节点数组
- 每个节点只保留：
  - `time`
  - `content`

这样可以：

- 不修改 `WidgetSchema` 顶层结构
- 保持 editor/renderer 实现集中在当前 feature
- 控制复杂度，避免把时间线做成事件系统

## 数据结构

### 1. 顶层结构不变

继续复用现有 `WidgetSchema`：

- `title`
- `props`

### 2. `timeline` 的最小 props

本轮只约定：

```ts
type TimelineWidgetItem = {
  time: string;
  content: string;
};

type TimelineWidgetProps = {
  items: TimelineWidgetItem[];
};
```

示例：

```ts
{
  id: 'draft-timeline',
  type: 'timeline',
  title: '时间线',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
}
```

### 3. 归一化约束

- `props.items` 不是数组时，在 editor / renderer 中按空数组处理
- 节点里的 `time` / `content` 不是字符串时按空字符串处理
- 本轮允许删空所有节点，不强制至少保留 1 项

## 组件设计

### 1. `TimelineWidgetEditor`

新增：

- `src/features/widget-editor/ui/TimelineWidgetEditor.tsx`

职责：

- 编辑标题
- 编辑节点列表
- 支持新增节点
- 支持删除节点
- 通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

不承担：

- 排序
- 模板选择
- 节点图标和状态配置

### 2. `TimelineWidget`

新增：

- `src/features/widget-renderer/ui/TimelineWidget.tsx`

职责：

- 真实渲染时间线节点
- 按顺序展示：
  - 节点时间
  - 节点内容

展示要求：

- 时间作为次级标签
- 内容作为主信息
- 节点为空时只显示标题，不额外渲染空状态模板

### 3. registry 接线

需要更新：

- `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `timeline -> TimelineWidgetEditor`
- `src/features/widget-renderer/model/widgetRegistry.ts`
  - `timeline -> TimelineWidget`

### 4. 默认草稿工厂

需要更新：

- `src/features/widget-editor/model/widgetDraftFactory.ts`

`createWidgetDraft('timeline')` 返回最小真实草稿，例如：

```ts
{
  id: 'draft-timeline',
  type: 'timeline',
  title: '时间线',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
}
```

## 数据流

### 新建 `timeline`

1. H5 发出 `widget-insert-request`
2. RN 打开 `WidgetTypePickerSheet`
3. 用户选择 `timeline`
4. `createWidgetDraft('timeline')`
5. `WidgetEditorSheet(mode='create')` 命中 `TimelineWidgetEditor`
6. 用户编辑字段
7. 点击“保存”
8. `NoteEditorModal` 追加 widget block 到 `draft.document`
9. H5 / 预览态刷新为真实 `TimelineWidget`

### 编辑已有 `timeline`

1. H5 发出 `widget-edit-request`
2. `WidgetEditorSheet(mode='edit')` 命中 `TimelineWidgetEditor`
3. 用户编辑字段
4. 点击“保存”
5. `NoteEditorModal` 替换对应 widget block
6. H5 / 预览态刷新为真实 `TimelineWidget`

## 错误处理和边界

- `props.items` 缺失时，editor 仍允许点击“新增节点”恢复到可编辑状态
- 节点为空数组时，renderer 不崩溃
- 本轮不执行时间格式或顺序校验

## 测试设计

### `widgetDraftFactory.test.ts`

新增覆盖：

- `createWidgetDraft('timeline')` 返回真实草稿

### `TimelineWidgetEditor.test.tsx`

覆盖：

- 修改标题、节点时间、节点内容会回传新 widget
- 支持新增节点
- 支持删除节点
- `props.items` 缺失时也能新增出第一个节点

### `WidgetEditorSheet.test.tsx`

覆盖：

- `timeline` 命中真实 editor
- fallback editor 覆盖改到 `form`

### `WidgetRenderer.test.tsx`

覆盖：

- `timeline` 渲染标题、多个节点的时间和内容
- 空节点列表时不崩
- fallback renderer 覆盖改到 `form`

### `NoteEditorModal.test.tsx`

覆盖：

- H5 模式下选择 `timeline` 后保存，document 写回真实 `timeline` block

## 验收标准

- 选择 `timeline` 新建时进入真实 editor，而不是 fallback
- 编辑已有 `timeline` 时进入真实 editor，而不是 fallback
- 预览态显示真实时间线卡片
- 其他未支持类型只剩 `form` 且仍保持 fallback 行为
- 相关 Jest 和 `tsc --noEmit` 通过
