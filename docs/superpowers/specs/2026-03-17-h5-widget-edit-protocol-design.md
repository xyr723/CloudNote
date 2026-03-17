# H5 Widget Edit Protocol 设计

## 背景

当前仓库已经具备：

- `RichDocument` 可以持久化 `widget block`
- AI completion 返回的 `widgets` 已接入 `Note` / `NoteDraft.document`
- `H5DocumentPreview` 已能在预览态通过 RN 真实渲染 widget
- `H5TextDocumentEditor` 已具备文本编辑、选区同步、媒体 marker 删除等 bridge 协议
- `WidgetRenderer` / `TodoListWidget` 已提供预览态 widget 白名单渲染

但 H5 编辑态里的 widget 仍停留在 placeholder：

- `LocalHtmlEditorProvider.renderHtml()` 只输出 `.widget-placeholder`
- `H5TextDocumentEditor` 只处理 `content-change` / `selection-change` / `media-delete`
- `NoteEditorModal` 虽然已持有 `document`，但 H5 编辑态不能对 widget 发起编辑动作

这导致当前存在明显断层：

- 预览态能看到真实 widget
- 持久化层也能保存 widget
- 但 H5 编辑态无法选中、删除、编辑或新增 widget

本轮要解决的问题，不是把所有 widget 都做成 WebView 内联可编辑控件，而是先建立一套可扩展的 **H5 widget 编辑协议**，让 H5 编辑态能把 widget 作为块级对象纳入编辑链。

## 目标

本轮只做最小可扩展闭环：

- H5 编辑态能识别 widget placeholder，并发出统一 widget 事件
- `H5TextDocumentEditor` 新增 widget bridge 协议，不打破现有文本编辑协议
- RN 侧新增统一 widget editor 容器
- `todo-list` 作为首个真实 editor 落地
- 其他 widget 类型至少支持选中、删除，并能进入 fallback editor
- widget 编辑结果能回写 `draft.document`
- 文本、媒体 marker、预览链路不回归

## 非目标

本轮不做以下事项：

- 不做 WebView 内 inline widget 编辑
- 不做 widget 拖拽排序
- 不做正文中任意位置插入 widget
- 不做所有 widget 类型的完整 editor
- 不把 `content + textSegments` 立即替换为 `document-first`
- 不定义文本与 widget 混排时的复杂块级光标语义

## 方案对比

### 方案 A：全在 WebView 内做通用 widget 编辑器

做法：

- H5 内不再只是 placeholder
- widget 在 WebView 内被真实渲染并直接编辑
- 所有表单与列表项修改都在浏览器侧完成，再通过 bridge 回传完整状态

优点：

- 编辑体验最统一
- 视觉上是完全 inline 的块编辑

缺点：

- 要在 WebView 里重做一套 widget runtime 和编辑 UI
- 会复制 RN 侧的 widget 渲染职责
- 范围和复杂度明显过高

### 方案 B：WebView 只负责块级协议，真实编辑 UI 放到 RN 侧

做法：

- H5 里的 widget 仍然是 placeholder，但变成可选中的原子块
- WebView 只发送 `select / edit / delete / insert-request` 等块级事件
- RN 侧按 `widget.type` 打开对应 editor 面板
- 面板提交后更新 `draft.document`，再同步回 H5

优点：

- 协议层通用、类型无关
- 不需要把复杂表单编辑塞进 WebView
- 能复用现有 RN 侧 widget 主题和状态边界
- 最符合当前“文本编辑走 WebView、真实 widget UI 在 RN”这条演进路径

缺点：

- 编辑交互是“点 widget -> RN 面板编辑”，不是完全 inline

### 方案 C：直接把 H5 编辑器升级成完整 document-first block editor

做法：

- H5 编辑器直接编辑整份 `RichDocument`
- 文本与 widget 共用统一 block 编辑协议

优点：

- 长期结构最干净

缺点：

- 已经超出“补 widget 编辑协议”的范围
- 会把当前稳定的 `content + textSegments` 文本链一并推倒重来

## 推荐方案

采用方案 B：**WebView 负责块级 widget 协议，RN 负责真实 widget 编辑 UI。**

原因：

- 你要的是“通用 widget 编辑协议”，不等于“所有 widget 都必须在 WebView 里原地编辑”
- 当前仓库已经形成了这套职责边界：
  - `H5TextDocumentEditor` 负责文本编辑
  - `WidgetRenderer` / `TodoListWidget` 负责真实 widget UI
  - `NoteDraft.document` 已是 widget 持久化事实来源
- 顺着现有边界推进，代价最低，回滚也最容易

## 架构设计

### 1. 协议分层

新增两层清晰边界：

- `WebView 层`
  - 把 widget block 当作原子节点
  - 负责 placeholder 的选中、高亮、删除按钮和发事件
  - 不承担具体 widget 字段编辑

- `RN 层`
  - 接收 WebView 发来的 widget 事件
  - 根据 `widget.type` 打开 editor 容器
  - 在 editor 内修改 `WidgetSchema`
  - 把更新后的 widget 写回 `draft.document`

这样可以避免 bridge 协议不断塞入不同 widget 的具体字段。

### 2. 新增 widget bridge 消息

在现有 `content-change` / `selection-change` / `media-delete` 之外，新增独立 widget 事件：

```ts
type H5WidgetBridgeEvent =
  | {
      type: 'widget-select';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-edit-request';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-delete';
      blockId: string;
      widgetId: string;
      widgetType: WidgetType;
    }
  | {
      type: 'widget-insert-request';
      afterBlockId?: string | null;
    };
```

约束：

- 消息里只放协议级字段
- 不直接携带完整 `widget.props`
- RN 侧基于 `blockId / widgetId` 去当前 `document` 取完整 schema

### 3. `H5TextDocumentEditor` 扩展为 widget 协议终端

建议新增最小 props：

```ts
type H5TextDocumentEditorProps = {
  ...
  document?: RichDocument;
  onWidgetEvent?: (event: H5WidgetBridgeEvent) => void;
};
```

职责：

- `document`
  - 提供当前 widget blocks
  - 用于在 H5 编辑态输出 widget placeholder 元信息

- `onWidgetEvent`
  - 把 widget 相关块级动作往 RN 抛

本轮不新增额外命令式 widget props，例如：

- `replaceWidgetCommand`
- `focusWidgetCommand`
- `insertWidgetCommand`

只要 `document` 更新后重新同步，H5 placeholder 就能刷新。

### 4. 文本与 widget 状态分流

同步流固定为：

1. RN 持有草稿事实来源：
   - `content`
   - `textSegments`
   - `document`
2. `H5TextDocumentEditor`：
   - 文本部分继续走 `content + textSegments`
   - widget 部分从 `document.blocks` 读取
3. 文本编辑继续通过 `content-change` 回写
4. widget 编辑不走 `content-change`
5. widget 事件由 RN 处理后，更新 `draft.document`
6. 新的 `document` 再回传 H5，同步 placeholder 展示

这一步要明确：

- `content-change` 只负责文本
- widget 永远通过 `document` 回写
- 不把 widget 内容再混回纯文本链

### 5. 新增 RN 侧 widget editor 容器

建议新增 `src/features/widget-editor/**`：

- `model/widgetEditorRegistry.ts`
  - `widget.type -> editor component`

- `ui/WidgetEditorSheet.tsx`
  - 统一 modal / sheet 容器
  - 接收当前 `WidgetSchema`
  - 提供确认 / 取消 / 删除

editor 统一契约：

```ts
type WidgetEditorProps = {
  widget: WidgetSchema;
  onChange: (nextWidget: WidgetSchema) => void;
  theme: ThemeColors;
};
```

关键点：

- editor 只负责修改 `WidgetSchema`
- 不直接碰 `document`
- block 替换、删除、插入由外层 controller 统一处理

### 6. 首个具体 editor：`todo-list`

虽然协议是通用的，但本轮真正落一个具体 editor 即可：

- `todo-list`
  - 编辑标题
  - 新增 item
  - 删除 item
  - 修改 item 文本

未支持类型先走 fallback editor：

- 展示 `title / description / type`
- 提示“暂不支持编辑此类型”
- 仍允许删除

这样可以保证：

- 通用协议已经成立
- 不会因为尝试一次支持所有 widget 类型而失控

### 7. 当前版本的位置规则

尽管协议里保留 `widget-insert-request`，`v1` 仍建议沿用前一轮的简化约束：

- `insert`
  - 统一追加到当前 widget 区尾部
- `edit`
  - 原位替换对应 block 的 `widget`
- `delete`
  - 从 `document.blocks` 里移除该 widget block

本轮不处理正文中任意位置插入。

## 数据流

### 选中或编辑 widget

1. WebView 渲染 widget placeholder
2. 用户点击 widget
3. bridge 发出 `widget-select`
4. 用户点击编辑按钮
5. bridge 发出 `widget-edit-request`
6. RN 根据 `blockId/widgetId/widgetType` 找到当前 widget
7. 打开 `WidgetEditorSheet`
8. editor 修改 `WidgetSchema`
9. RN 更新 `draft.document`
10. 新 `document` 回传 H5，placeholder 刷新

### 删除 widget

1. 用户点 widget 删除按钮
2. bridge 发出 `widget-delete`
3. RN 从 `draft.document.blocks` 中移除目标 block
4. H5 重新同步

### 新增 widget

1. 用户从 H5 编辑态发起插入
2. bridge 发出 `widget-insert-request`
3. RN 打开 widget type 选择或默认 editor 入口
4. 用户完成编辑
5. 新 widget block 追加到 `draft.document` 尾部
6. H5 重新同步

## 测试策略

先补失败测试，再实现。

### bridge / parser

- 能识别：
  - `widget-select`
  - `widget-edit-request`
  - `widget-delete`
  - `widget-insert-request`
- 非法 widget 消息仍回到 `unknown`

### `H5TextDocumentEditor`

- 传入 `document` 时会输出 widget placeholder 元信息
- 收到 widget 消息时会触发 `onWidgetEvent`
- 现有 `content-change` / `selection-change` / `media-delete` 不回归

### `NoteEditorModal`

- 收到 `widget-edit-request` 时会打开 editor 容器
- editor 提交后会更新 `document`
- 删除 widget 后会回写 `document`
- 新增 widget 会按当前规则追加到末尾

### `WidgetEditorSheet` / `todo-list` editor

- 能修改标题
- 能增删 item
- 能修改 item 文本
- fallback editor 对未支持类型不崩溃，且允许删除

## 容错与错误处理

### 无法定位 widget

如果 bridge 发来的 `blockId/widgetId` 在当前 `document` 中找不到：

- 忽略该事件
- 记录 `console.warn`
- 不打断用户编辑流程

### 未实现类型

如果 editor registry 找不到对应 editor：

- 打开 fallback editor
- 允许删除
- 不允许编辑复杂 props

### 取消编辑

如果用户关闭 editor 容器而未确认：

- 丢弃本次未提交修改
- 不写回 `document`

### H5 刷新失败

如果 `document` 更新后 H5 placeholder 刷新失败：

- RN 草稿状态仍保持最新
- 下次完整同步时恢复
- 不反向覆盖 RN 状态

## 文件落点

- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
- Modify: `src/features/h5-editor/model/h5TextEditorMarkup.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Create: `src/features/widget-editor/model/widgetEditorRegistry.ts`
- Create: `src/features/widget-editor/ui/WidgetEditorSheet.tsx`
- Create: `src/features/widget-editor/ui/TodoListWidgetEditor.tsx`
- Create: `src/features/widget-editor/ui/FallbackWidgetEditor.tsx`
- Modify: `README.md`

## 风险

- 如果试图把所有 widget 类型一次做完，范围会迅速膨胀
- 如果让 WebView 直接编辑 widget props，bridge 会和不同 widget 结构强耦合
- 如果 widget 事件和 `content-change` 混用，后续状态同步会再次失控
- 如果本轮一并做任意位置插入，会引入新的块级光标语义，明显超出范围

## 完成标准

- H5 编辑态能识别 widget placeholder 并发出统一 widget 事件
- RN 侧存在统一 widget editor 容器
- `todo-list` 支持真实编辑并回写 `document`
- 其他 widget 类型至少支持选中、删除，并进入 fallback editor
- 文本编辑、媒体 marker、预览态与持久化链路不回归
