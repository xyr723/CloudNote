# H5 Widget 区按位置插入设计

## 背景

当前 H5 widget 编辑链路已经支持：

- H5 编辑态可以展示 widget placeholder
- H5 可以向 RN 发出 `widget-insert-request`
- RN 已支持类型选择、真实 widget editor 和保存回写
- 6 种白名单 widget 当前都已具备真实 `draft + editor + renderer`

但插入位置仍停留在上一个阶段的最小简化方案：

- H5 里只有一个“新增组件”按钮
- `widget-insert-request` 虽然带有 `afterBlockId`
- `NoteEditorModal` 保存时仍统一追加到 widget 区尾部

这意味着现有协议字段已经存在，但还没有真正生效。

## 目标

本轮只补齐 **widget 区内部** 的按位置插入闭环：

- H5 widget 区支持：
  - 在第一个 widget 前插入
  - 在任意一个已有 widget 后插入
- RN 保存新 widget 时根据 `afterBlockId` 写入正确位置
- 现有编辑、删除、预览链路保持不变

## 非目标

本轮不做：

- 不做正文文本块之间的任意位置插入
- 不做 widget 拖拽排序
- 不做 WebView 内联编辑
- 不改成 `document-first` 文本编辑模型
- 不调整 AI widget 统一追加到尾部的当前策略

## 方案对比

### 方案 A：只在 RN 侧消费 `afterBlockId`

做法：

- H5 保持现有单个“新增组件”按钮
- `NoteEditorModal` 保存时读取 `afterBlockId`

优点：

- 改动最小

缺点：

- 当前按钮就在 widget 尾部
- 即使消费 `afterBlockId`，用户几乎看不到差异
- 协议落地了，但交互收益很弱

### 方案 B：同时补 H5 插入点和 RN 插入位置

做法：

- H5 在 widget 区渲染多个插入点：
  - 第一个 widget 前
  - 每个 widget 后
- RN 根据 `afterBlockId` 把新 widget 插入到 widget 区正确位置

优点：

- `afterBlockId` 立即有实际意义
- 用户可以直接控制 widget 区顺序
- 改动仍局限在 widget 区，不碰正文复杂光标语义

缺点：

- 需要同时改 H5 markup 和 document helper

### 方案 C：直接支持正文块之间的任意位置插入

优点：

- 长期能力最完整

缺点：

- 会立刻碰到文本块和 widget 混排顺序问题
- 当前 `mergeTextDocumentWithWidgets()` 还不支持这类稳定语义
- 明显超出本轮范围

## 推荐方案

采用方案 B：**widget 区内部按位置插入**。

原因：

- 这是最小但真实可见的下一步
- 继续复用现有 `afterBlockId` 协议，不需要新 bridge 消息
- 范围清晰，且不会和 `document-first` 改造绑死

## 架构设计

### 1. 继续承认“widget 区”是独立尾部区域

当前 H5 编辑态仍按以下方式组织内容：

- 文本内容先渲染
- widget placeholder 区整体放在文本后面

因此本轮插入语义也只在 widget 区内生效：

- `afterBlockId = null`
  - 表示插入到 widget 区首位
- `afterBlockId = 某个 widget block id`
  - 表示插入到该 widget 后

不允许把 widget 插进正文文本块中间。

### 2. `entities/note/document` 增加 widget 区插入 helper

建议新增最小 helper：

```ts
insertWidgetBlock(document, widget, afterBlockId?)
insertWidgetSchemasToDocument(document, widgets, afterBlockId?)
```

行为约束：

- `afterBlockId` 为 `null/undefined`
  - 若已有 widget，则插入到第一个 widget 前
  - 若没有 widget，则追加到尾部
- `afterBlockId` 命中已有 widget block
  - 插入到该 block 后
- `afterBlockId` 未命中
  - 安全降级为追加到 widget 区尾部

这里的“命中”只认现有 widget block，不认普通文本 block。

### 3. `H5TextDocumentEditor` / markup 输出多个插入点

当前只有最后一个按钮：

- widget 区尾部一个“新增组件”

本轮改为：

- widget 区首位一个插入按钮
- 每个 widget block 后一个插入按钮

这样用户就能在不引入拖拽的前提下，按位置插入新组件。

### 4. `NoteEditorModal` 的创建保存消费 `afterBlockId`

现状：

- `pendingWidgetInsert.afterBlockId` 已被保存
- 但 `handleSaveWidget()` 的 `create` 分支仍直接 `appendWidgetBlock()`

本轮改为：

- `create` 模式保存时改用新的插入 helper
- 使用最近一次 `pendingWidgetInsert.afterBlockId`
- 保存或取消后清空 pending 状态

编辑、删除逻辑不变：

- 编辑仍 `replaceWidgetBlock`
- 删除仍 `removeWidgetBlock`

## 数据流

### 在 widget 区首位插入

1. H5 点击首位“新增组件”
2. 发出：

```ts
{type: 'widget-insert-request', afterBlockId: null}
```

3. RN 侧打开类型选择器
4. 用户选择类型并保存
5. widget 插入到第一个已有 widget 前

### 在某个 widget 后插入

1. H5 点击某个 widget 后的“新增组件”
2. 发出：

```ts
{type: 'widget-insert-request', afterBlockId: 'widget-block-2'}
```

3. RN 侧打开类型选择器
4. 用户选择类型并保存
5. widget 插入到 `widget-block-2` 后

## 边界与降级

- 若保存前目标 widget 被删除，`afterBlockId` 可能失效
- 这时降级为追加到 widget 区尾部，避免丢失用户本次创建结果
- AI 统一追加 widgets 的现有链路不改，继续走 append
- 取消类型选择或取消 editor 时不回写 document

## 测试设计

### `src/entities/note/document.test.ts`

新增覆盖：

- `afterBlockId = null` 时插入到第一个 widget 前
- 指定 `afterBlockId` 时插入到对应 widget 后
- `afterBlockId` 未命中时降级追加到尾部

### `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

新增或改造覆盖：

- widget document 渲染时包含多个插入按钮
- 首位按钮不带 `data-widget-insert-after-block-id`
- 每个 widget 后按钮带对应 block id

### `src/features/note-editor/ui/NoteEditorModal.test.tsx`

新增覆盖：

- 收到 `afterBlockId = null` 时，新 widget 插入到 widget 区首位
- 收到指定 `afterBlockId` 时，新 widget 插入到目标 widget 后
- 目标失效时降级追加到 widget 区尾部

## 完成标准

- H5 widget 区不再只有一个尾部“新增组件”按钮
- `afterBlockId` 在 RN 侧真正影响保存位置
- widget 区可在首位或指定 widget 后插入新组件
- 现有 widget 编辑、删除、预览和类型选择链路不回归
