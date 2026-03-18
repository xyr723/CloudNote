# Quote Widget Editor 设计

## 背景

当前 widget 编辑链路已经支持：

- H5 编辑态发起 widget 新建、编辑、删除事件
- RN 侧通过 `WidgetTypePickerSheet` 选择组件类型
- RN 侧通过 `WidgetEditorSheet` 承载真实 editor 或 fallback editor
- `todo-list`、`metric` 已接入真实 editor 和真实 renderer

剩余类型里，`quote` 是最适合继续转正的下一个目标：

- 结构简单，只有少量文本字段
- 可复用现有 `WidgetSchema` 顶层字段
- 能继续验证 editor registry / renderer registry 的扩展路径
- 风险明显低于 `form`、`timeline`

## 目标

本轮只为 `quote` 补齐最小真实闭环：

- `quote` 支持真实 editor
- `quote` 支持真实预览卡片
- 新建 `quote` 时不再走 fallback editor
- 编辑已有 `quote` 时不再走 fallback editor
- H5 预览和 note 预览都能显示真实 `quote` 卡片

## 非目标

本轮不做：

- 不做作者头像
- 不做作者链接
- 不做多段引用正文
- 不做引用样式模板切换
- 不做强调色、背景样式配置
- 不做正文必填校验弹层

## 方案选择

### 推荐方案

采用“复用 `title` / `description` + 在 `props` 中补 `content`”的最小方案：

- `title` 继续表示卡片标题
- `props.content` 表示引用正文
- `description` 复用为来源

这样可以：

- 不修改 `WidgetSchema` 顶层结构
- 保持与现有 widget 的编辑表单习惯一致
- 将改动控制在当前 registry 和组件边界内

### 未采用方案

#### 1. 把来源也放到 `props.source`

优点：

- 语义更纯粹

缺点：

- 与当前 `description` 作为次级文案的使用方式不一致
- 这一轮属于过度设计

#### 2. 只做 editor，不做 renderer

优点：

- 代码更少

缺点：

- 会继续保留创建与预览断层
- 后续仍要回头补 renderer，不值得

## 数据结构

### 1. 顶层结构不变

继续复用现有 `WidgetSchema`：

- `title`
- `description`
- `props`

### 2. `quote` 的最小 props

本轮只约定：

```ts
type QuoteWidgetProps = {
  content: string;
};
```

字段分工：

- `title`
  - 卡片标题
- `props.content`
  - 引用正文
  - 用字符串存储
- `description`
  - 来源
  - 可选

示例：

```ts
{
  id: 'draft-quote',
  type: 'quote',
  title: '引用',
  description: '来源',
  props: {
    content: '在这里写下引用内容',
  },
}
```

### 3. 归一化约束

- `props.content`
  - 保留字符串
  - 非字符串时在 editor / renderer 里按空字符串处理
- `description`
  - 留空时回写为 `undefined`

## 组件设计

### 1. `QuoteWidgetEditor`

新增：

- `src/features/widget-editor/ui/QuoteWidgetEditor.tsx`

职责：

- 编辑 `quote` 的最小字段：
  - 标题
  - 引用正文
  - 来源
- 只通过 `onChange(nextWidget)` 向外回传完整 `WidgetSchema`

不承担：

- 保存/取消/删除
- 来源链接编辑
- 正文校验弹层

### 2. `QuoteWidget`

新增：

- `src/features/widget-renderer/ui/QuoteWidget.tsx`

职责：

- 真实渲染 `quote`
- 展示：
  - 标题
  - 引用正文
  - 可选来源

展示要求：

- 正文视觉层级高于标题和来源
- 来源缺失时不渲染来源行

### 3. registry 接线

需要更新：

- `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `quote -> QuoteWidgetEditor`
- `src/features/widget-renderer/model/widgetRegistry.ts`
  - `quote -> QuoteWidget`

### 4. 默认草稿工厂

需要更新：

- `src/features/widget-editor/model/widgetDraftFactory.ts`

`createWidgetDraft('quote')` 返回最小真实草稿，例如：

```ts
{
  id: 'draft-quote',
  type: 'quote',
  title: '引用',
  description: '来源',
  props: {
    content: '在这里写下引用内容',
  },
}
```

默认文案只需要满足：

- 结构合法
- editor 能立即编辑
- 预览不会出现空白卡片

## 数据流

### 新建 `quote`

1. H5 发出 `widget-insert-request`
2. RN 打开 `WidgetTypePickerSheet`
3. 用户选择 `quote`
4. `createWidgetDraft('quote')`
5. `WidgetEditorSheet(mode='create')` 命中 `QuoteWidgetEditor`
6. 用户编辑字段
7. 点击“保存”
8. `NoteEditorModal` 追加 widget block 到 `draft.document`
9. H5 / 预览态刷新为真实 `QuoteWidget`

### 编辑已有 `quote`

1. H5 发出 `widget-edit-request`
2. `WidgetEditorSheet(mode='edit')` 命中 `QuoteWidgetEditor`
3. 用户编辑字段
4. 点击“保存”
5. `NoteEditorModal` 替换对应 widget block
6. H5 / 预览态刷新为真实 `QuoteWidget`

## 错误处理和边界

- `props.content` 不是字符串时，editor 和 renderer 都按空字符串处理，避免崩溃
- `description` 为空时不渲染来源
- 本轮不阻止保存空正文，保持与现有 widget 编辑体验一致

## 测试设计

### `widgetDraftFactory.test.ts`

新增覆盖：

- `createWidgetDraft('quote')` 返回真实 `quote` 草稿

### `QuoteWidgetEditor.test.tsx`

覆盖：

- 修改标题会回传新 widget
- 修改引用正文会回传新 widget
- 修改来源会回传新 widget
- 清空来源会把 `description` 归一化为 `undefined`

### `WidgetEditorSheet.test.tsx`

覆盖：

- `quote` 命中真实 editor
- fallback editor 覆盖继续留给 `timeline`

### `WidgetRenderer.test.tsx`

覆盖：

- `quote` 渲染标题、正文、来源
- 来源缺失时不渲染来源行
- fallback renderer 覆盖继续留给 `timeline`

### `NoteEditorModal.test.tsx`

覆盖：

- H5 模式下选择 `quote` 后保存，document 写回真实 `quote` block

## 验收标准

- 选择 `quote` 新建时进入真实 editor，而不是 fallback
- 编辑已有 `quote` 时进入真实 editor，而不是 fallback
- 预览态显示真实引用卡片
- 其他未支持类型仍保持 fallback 行为
- 相关 Jest 和 `tsc --noEmit` 通过
