# Action Card Widget Editor 设计

## 背景

当前 widget 编辑链路已经支持：

- H5 编辑态发起 widget 新建、编辑、删除事件
- RN 侧通过 `WidgetTypePickerSheet` 选择组件类型
- RN 侧通过 `WidgetEditorSheet` 承载真实 editor 或 fallback editor
- `todo-list`、`metric`、`quote` 已接入真实 editor 和真实 renderer

剩余类型里，`action-card` 是最适合继续转正的下一类动作型组件：

- 结构仍然相对简单
- 可直接复用现有 `actions` 顶层结构
- 能验证“带动作配置”的 editor/renderer 扩展路径
- 风险明显低于 `form`

## 目标

本轮只为 `action-card` 补齐最小真实闭环：

- `action-card` 支持真实 editor
- `action-card` 支持真实预览卡片
- 新建 `action-card` 时不再走 fallback editor
- 编辑已有 `action-card` 时不再走 fallback editor
- H5 预览和 note 预览都能显示真实 `action-card`

## 非目标

本轮不做：

- 不做第二按钮
- 不做图标
- 不做强调样式、主题模板
- 不做 `toggle`
- 不做 `submit-form`
- 不做真实动作执行

## 方案选择

### 推荐方案

采用“复用顶层 `actions[0]` 做唯一主动作”的方案：

- `title` 表示卡片标题
- `description` 表示卡片说明
- `actions[0]` 表示唯一主按钮

动作范围只支持：

- `open-url`
- `insert-text`

这样可以：

- 保持与现有 `WidgetSchema` 一致
- 避免在 `props` 内再造一套动作结构
- 为后续扩展多按钮保留自然升级路径

### 未采用方案

#### 1. 在 `props.primaryAction` 中维护动作

优点：

- editor 表单会更直观

缺点：

- 会制造两套动作表达
- 后续仍需再转换回顶层 `actions`

#### 2. 只做按钮文案，不做真实动作类型和 payload

优点：

- 实现更快

缺点：

- 与“中等复杂度”目标不符
- 很快还要返工补 `type` 和 `payload`

## 数据结构

### 1. 顶层结构不变

继续复用现有 `WidgetSchema`：

- `title`
- `description`
- `actions`

### 2. `action-card` 的最小动作结构

本轮只约定一个主动作：

```ts
type ActionCardWidgetAction =
  | {
      id: string;
      label: string;
      type: 'open-url';
      payload: {
        url: string;
      };
    }
  | {
      id: string;
      label: string;
      type: 'insert-text';
      payload: {
        text: string;
      };
    };
```

字段分工：

- `title`
  - 卡片标题
- `description`
  - 卡片说明
- `actions[0].label`
  - 主按钮文案
- `actions[0].type`
  - 主按钮动作类型
- `actions[0].payload.url`
  - `open-url` 时的目标地址
- `actions[0].payload.text`
  - `insert-text` 时插入的文本

示例：

```ts
{
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
}
```

### 3. 归一化约束

- `actions` 为空或结构异常时
  - editor 兜底生成一个默认主动作
- `type` 切换时
  - 重建 `payload`
  - 不保留旧字段
- `description`
  - 留空时回写为 `undefined`

## 组件设计

### 1. `ActionCardWidgetEditor`

新增：

- `src/features/widget-editor/ui/ActionCardWidgetEditor.tsx`

职责：

- 编辑最小字段：
  - 标题
  - 说明
  - 按钮文案
  - 动作类型
  - payload
- 只通过 `onChange(nextWidget)` 回传完整 `WidgetSchema`

不承担：

- 第二按钮编辑
- 图标编辑
- 动作执行预览

### 2. `ActionCardWidget`

新增：

- `src/features/widget-renderer/ui/ActionCardWidget.tsx`

职责：

- 真实渲染 `action-card`
- 展示：
  - 标题
  - 说明
  - 主按钮文案
  - 动作明细

展示要求：

- `open-url` 显示目标 URL
- `insert-text` 显示将插入的文本
- 只渲染第一个动作

### 3. registry 接线

需要更新：

- `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `action-card -> ActionCardWidgetEditor`
- `src/features/widget-renderer/model/widgetRegistry.ts`
  - `action-card -> ActionCardWidget`

### 4. 默认草稿工厂

需要更新：

- `src/features/widget-editor/model/widgetDraftFactory.ts`

`createWidgetDraft('action-card')` 返回最小真实草稿，例如：

```ts
{
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
}
```

默认文案只需要满足：

- 结构合法
- editor 能立即编辑
- 预览不会出现空白卡片

## 数据流

### 新建 `action-card`

1. H5 发出 `widget-insert-request`
2. RN 打开 `WidgetTypePickerSheet`
3. 用户选择 `action-card`
4. `createWidgetDraft('action-card')`
5. `WidgetEditorSheet(mode='create')` 命中 `ActionCardWidgetEditor`
6. 用户编辑字段
7. 点击“保存”
8. `NoteEditorModal` 追加 widget block 到 `draft.document`
9. H5 / 预览态刷新为真实 `ActionCardWidget`

### 编辑已有 `action-card`

1. H5 发出 `widget-edit-request`
2. `WidgetEditorSheet(mode='edit')` 命中 `ActionCardWidgetEditor`
3. 用户编辑字段
4. 点击“保存”
5. `NoteEditorModal` 替换对应 widget block
6. H5 / 预览态刷新为真实 `ActionCardWidget`

## 错误处理和边界

- `actions` 为空或不是数组时，editor 使用默认主动作兜底
- `actions[0]` 缺少 `label`、`type` 或合法 payload 时，editor 用默认值补齐
- renderer 只读取第一个动作
- 本轮不执行动作，只展示配置结果

## 测试设计

### `widgetDraftFactory.test.ts`

新增覆盖：

- `createWidgetDraft('action-card')` 返回真实草稿

### `ActionCardWidgetEditor.test.tsx`

覆盖：

- 修改标题、说明、按钮文案会回传新 widget
- 切换 `open-url -> insert-text` 时，payload 从 `url` 重建为 `text`
- 切换 `insert-text -> open-url` 时，payload 从 `text` 重建为 `url`
- `actions` 缺失时兜底生成默认主动作

### `WidgetEditorSheet.test.tsx`

覆盖：

- `action-card` 命中真实 editor
- fallback editor 覆盖继续留给 `timeline`

### `WidgetRenderer.test.tsx`

覆盖：

- `action-card` 渲染标题、说明、按钮文案、动作细节
- `open-url` 显示 URL
- `insert-text` 显示将插入的文本
- fallback renderer 覆盖继续留给 `timeline`

### `NoteEditorModal.test.tsx`

覆盖：

- H5 模式下选择 `action-card` 后保存，document 写回真实 `action-card` block

## 验收标准

- 选择 `action-card` 新建时进入真实 editor，而不是 fallback
- 编辑已有 `action-card` 时进入真实 editor，而不是 fallback
- 预览态显示真实动作卡片
- 动作类型切换后 payload 结构与类型一致，不残留旧字段
- 其他未支持类型仍保持 fallback 行为
- 相关 Jest 和 `tsc --noEmit` 通过
