# H5 Widget Insert Type Picker 设计

## 背景

当前 H5 widget 编辑协议已经打通：

- H5 编辑态能输出 widget placeholder
- `H5TextDocumentEditor` 能向 RN 转发：
  - `widget-select`
  - `widget-edit-request`
  - `widget-delete`
  - `widget-insert-request`
- RN 侧已有统一 `WidgetEditorSheet`
- `todo-list` 已支持真实编辑
- 其他类型已支持 fallback editor

但当前 `widget-insert-request` 仍是一个硬编码简化版本：

- RN 收到插入事件后，直接创建默认 `todo-list`
- 不给用户选择 widget 类型
- 也不会先进入编辑确认态

这让“通用 widget 编辑协议”在插入链路上仍然不完整。

## 目标

本轮只补齐最小可用的插入闭环：

- H5 发起 `widget-insert-request` 后，RN 先弹出 widget 类型选择器
- 用户可在 6 种 `WidgetType` 中选择一种
- 选择后进入统一 `WidgetEditorSheet`
- 用户点击“保存”后，才真正把 widget block 追加到 `draft.document` 文末
- `todo-list` 继续进入真实 editor
- 其他类型进入 fallback editor

## 非目标

本轮不做：

- 不支持按 `afterBlockId` 精确插入
- 不支持拖拽排序
- 不支持类型搜索、分组、图标系统
- 不支持不同类型的专属创建向导
- 不把 widget 插入流程改成“先写入 document 再编辑”

## 方案对比

### 方案 A：新增独立 `WidgetTypePickerSheet`

流程：

1. `widget-insert-request`
2. 打开类型选择器
3. 用户选择类型
4. 生成默认 draft widget
5. 打开 `WidgetEditorSheet`
6. 用户确认后再写入 document

优点：

- 插入前选择和编辑职责清晰分离
- 现有 `WidgetEditorSheet` 可继续聚焦 widget 编辑
- 后续要补类型说明、图标、排序都更容易扩展

缺点：

- 会新增一个轻量 sheet 组件

### 方案 B：把类型选择塞进 `WidgetEditorSheet` 空态

优点：

- 文件更少

缺点：

- `WidgetEditorSheet` 同时承担“先选类型”和“编辑 widget”两种职责
- 状态机会更绕，测试边界更差

### 方案 C：插入时直接弹原生选择器

优点：

- 实现最快

缺点：

- 不利于主题统一
- 测试体验差
- 后续大概率要重做

## 推荐方案

采用方案 A：新增独立 `WidgetTypePickerSheet`。

原因：

- 它和当前“统一 editor 容器 + 类型分发”的架构最一致
- 插入前选择类型属于 controller 层动作，不应该和具体 widget 编辑 UI 混在一起
- 后续就算补更多类型，状态复杂度也不会堆在一个 sheet 里

## 架构设计

### 1. 新增类型选择器

新增：

- `src/features/widget-editor/ui/WidgetTypePickerSheet.tsx`

职责：

- 展示全部 6 种 `WidgetType`
- 为每种类型展示：
  - 类型名
  - 一行简短说明
- 对外只暴露：
  - `visible`
  - `onSelect(type)`
  - `onClose()`

当前不引入搜索、分组、图标。

### 2. `WidgetEditorSheet` 增加模式

建议新增：

```ts
type WidgetEditorSheetMode = 'create' | 'edit';
```

行为：

- `create`
  - 标题显示“新建组件”
  - 隐藏“删除组件”
  - 保存时走“追加新 block”语义
- `edit`
  - 保持当前行为
  - 保存时替换已有 block
  - 允许删除

### 3. `NoteEditorModal` 的状态机

当前 `activeWidgetEditor` 只有编辑态信息。

建议改成两类显式状态：

```ts
type ActiveWidgetEditorState =
  | {
      mode: 'create';
      widget: WidgetSchema;
    }
  | {
      mode: 'edit';
      blockId: string;
      widget: WidgetSchema;
    }
  | null;
```

并新增：

```ts
type PendingWidgetInsertState = {
  afterBlockId?: string | null;
} | null;
```

数据流：

1. 收到 `widget-insert-request`
2. 记录 `pendingWidgetInsert`
3. 打开 `WidgetTypePickerSheet`
4. 用户选择类型
5. `createWidgetDraft(type)`
6. 打开 `WidgetEditorSheet(mode='create')`
7. 用户点击“保存”
8. 通过 `appendWidgetBlock()` 追加到文末
9. 回写 `draft.document`

### 4. 插入与编辑的边界

关键约束：

- 收到插入事件时，不立即写 document
- 只有用户在 `create` 模式 editor 中点击“保存”时才写 document
- 关闭类型选择器不产生任何 document 变更
- `create` 模式下点击“取消”不产生任何 document 变更
- `edit` 模式继续保持：
  - 保存才替换
  - 删除才移除
  - 取消不回写

### 5. 类型路由

`WidgetTypePickerSheet` 暴露全部 6 种：

- `todo-list`
- `action-card`
- `form`
- `quote`
- `metric`
- `timeline`

当前编辑承接能力：

- `todo-list`
  - 进入真实 editor
- 其他 5 种
  - 进入 fallback editor
  - 允许直接保存最小 schema

### 6. `afterBlockId` 处理

本轮继续保留协议字段，但不改变插入规则：

- `afterBlockId` 只保存在 `pendingWidgetInsert` 中
- 最终仍统一追加到 widget 区尾部

这样可以保持协议可扩展，但不把块级定位逻辑带进本轮范围。

## 测试设计

### `WidgetTypePickerSheet.test.tsx`

覆盖：

- 能渲染 6 种类型
- 点击某种类型会触发 `onSelect(type)`
- 点击取消只触发 `onClose`

### `WidgetEditorSheet.test.tsx`

新增覆盖：

- `create` 模式不显示“删除组件”
- fallback 类型在 `create` 模式也能保存
- `edit` 模式保持当前删除按钮逻辑

### `NoteEditorModal.test.tsx`

新增覆盖：

- `widget-insert-request` 先打开类型选择器，而不是直接写 document
- 选择 `todo-list` 后会进入 editor，保存后才追加
- 选择 `metric` / `timeline` 等 fallback 类型后也能保存并追加
- 类型选择器取消时不回写 document
- `create` 模式 editor 取消时不回写 document

## 风险

- `WidgetEditorSheet` 增加 `mode` 后，如果状态判断写散，容易让创建态和编辑态互相污染
- fallback 类型的默认 schema 如果过弱，后续真实 editor 接入时可能需要迁移默认字段
- 如果未来要支持“插入到指定 block 后”，当前 `append` 语义需要再抽象一次

## 完成标准

- H5 发出 `widget-insert-request` 后，RN 不再直接插入默认 `todo-list`
- 用户可先选择 6 种 widget 类型之一
- 选择类型后进入统一 editor 容器
- `todo-list` 支持真实创建编辑
- 其他类型支持 fallback 创建保存
- 只有点击“保存”后才真正写入 `draft.document`
- 取消类型选择或取消 editor 都不会回写 document
