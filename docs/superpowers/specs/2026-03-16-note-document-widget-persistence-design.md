# Note Document Widget Persistence 设计

## 背景

当前仓库已经具备：

- `RichDocument` 文档模型，支持 `widget block`
- `H5DocumentPreview` 的混合宿主预览链路
- `WidgetRenderer` 与 `todo-list` 的真实预览能力
- `AiProvider.completeDocument()` 返回 `AiCompletionResult`
- `AiCompletionResult` 类型已经预留 `widgets?: WidgetSchema[]`

但 note editor 这条链仍然停留在纯文本中心：

- `Note` / `NoteDraft` 只有 `content + textSegments + media`
- `completeNoteEditorTextWithAi()` 当前只返回字符串
- `useNoteEditorActions()` 只会把 AI 返回文本追加到正文
- `NoteEditorPreviewPane` 每次都从 `content` 重新 parse，不消费持久化文档
- `localNoteStore` 不解析也不校验 `document`

这导致当前存在一个明显断点：

- AI provider 即使返回了 `widgets`
- 这些 widgets 也不会进入 note editor 状态
- 更不会落盘、同步或参与预览

因此这轮要解决的问题，不是“做 widget 编辑器”，而是先把 AI 产出的 widgets 接到 `Note` 的持久化文档状态里，并且不破坏已经稳定的文本编辑链。

## 目标

本轮只做最小可验证闭环：

- `Note` / `NoteDraft` 可以持久化 `RichDocument`
- AI 返回的 `widgets` 可以进入当前编辑草稿
- 保存后 widgets 会随 `Note` 一起进入同步链
- 预览态能基于草稿中的 `document` 立即展示 widgets
- 现有 `content + textSegments` 文本编辑体验保持不变
- 旧笔记没有 `document` 时仍能正常打开和保存

## 非目标

本轮不做以下事项：

- 不做 widget 的插入位置选择，统一只追加到文末
- 不做 widget 的删除、拖拽、重排或属性编辑
- 不让原生编辑器或 H5 编辑器直接编辑 widget
- 不把 `document` 升级成唯一事实来源
- 不新增独立的“单独生成 widgets”编辑器交互流程
- 不修改搜索语义，不把 widget 内容纳入搜索索引
- 不写一次性迁移脚本批量升级旧数据

## 方案对比

### 方案 A：给 `Note` 单独增加 `widgets?: WidgetSchema[]`

做法：

- `content` 与 `textSegments` 保持原状
- `Note` / `NoteDraft` 额外新增 `widgets`
- 预览时先 parse 文本，再把 widgets 追加到文档尾部

优点：

- 表面改动最小

缺点：

- 会形成“文本一套、widgets 一套”的双轨模型
- widget 顺序语义很弱
- 后续如果还要做 widget 编辑或块级排序，大概率还要再次迁移

### 方案 B：给 `Note` / `NoteDraft` 增加 `document?: RichDocument`，`content` 保留为镜像

做法：

- `content` 继续服务现有文本编辑与兼容链路
- `textSegments` 继续服务现有富文本样式编辑
- `document` 作为结构化正文持久化容器
- AI 返回的 `widgets` 统一写成 `widget block`

优点：

- 与现有 `RichDocument`、预览链、widget registry 方向一致
- 后续如果要做 widget 编辑，不需要再迁一次存储模型
- 这一步只需定义清晰的同步规则，不用重写现有文本编辑器

缺点：

- 需要管理 `content` 与 `document` 的同步边界

### 方案 C：直接让 `document` 成为唯一事实来源

做法：

- `content` 与 `textSegments` 都由 `document` 派生
- 保存、预览、编辑全部围绕 `document`

优点：

- 长期结构最干净

缺点：

- 会同时波及原生编辑、H5 编辑、媒体 marker、保存同步和大量测试
- 明显超出本轮“最小闭环”的范围

## 推荐方案

采用方案 B：给 `Note` / `NoteDraft` 增加 `document?: RichDocument`，并继续保留 `content` 作为纯文本镜像。

原因：

- 这是当前最小但方向正确的承接点
- 能直接复用已经落地的 `RichDocument -> H5DocumentPreview -> WidgetRenderer` 链路
- 不要求现在就推翻原生/H5 文本编辑器
- 同时为后续 widget 编辑保留扩展位

本轮必须明确一个范围约束：

- `v1` 中所有 AI 生成的 widgets 都只允许追加到正文末尾

这样可以避免在本轮定义复杂的块级光标、插入点和排序协议。

## 架构设计

### 1. 扩展 `Note` / `NoteDraft` 数据模型

新增可选字段：

```ts
interface Note {
  ...
  content: string;
  textSegments?: TextSegment[];
  document?: RichDocument;
}

interface NoteDraft {
  ...
  content: string;
  textSegments?: TextSegment[];
  document?: RichDocument;
}
```

职责划分保持清晰：

- `content`
  - 纯文本镜像
  - 服务现有文本编辑、内容校验与兼容链路
- `textSegments`
  - 服务现有字体、粗体、斜体样式编辑
  - 不承担 widget 存储职责
- `document`
  - 作为结构化正文持久化容器
  - 唯一允许存放 `widget block`

### 2. 新增 note 文档同步辅助模块

建议新增一个很薄的 note 文档辅助模块，例如：

- `src/entities/note/document.ts`

职责：

- 从纯文本构建最小文本 `RichDocument`
- 从已有 `document` 中提取 `widget block`
- 在当前文本内容变化后，重建文本 blocks 并把 widget blocks 追加回去
- 统计 `document` 中是否存在 widget blocks

这样可以把以下规则收口到一处：

- 编辑文本时如何保留已有 widgets
- 预览态如何构造 live document
- 保存时如何避免 `content` 和 `document` 漂移

### 3. 定义 `content` 与 `document` 的同步规则

本轮同步规则固定为：

- 打开旧笔记时：
  - 如果没有 `document`，按当前 `content` 解析出纯文本 document 供预览使用
  - 不主动写回，等用户保存时再补齐

- 文本编辑时：
  - 继续只改 `content + textSegments`
  - 不在编辑过程中直接修改 widget blocks

- 预览或保存时：
  - 用当前文本重建 text/list blocks
  - 再把已有 widget blocks 追加回文末
  - 最终得到新的 `document`

这意味着：

- widgets 不会被普通文本编辑覆盖掉
- 但本轮也不支持把 widgets 插入到正文中间

### 4. AI 结果进入编辑态

`note editor` 的 UI 层仍然只发起一次 AI 补全动作：

- `completeNoteEditorTextWithAi()` 不再只返回字符串，而是返回完整 `AiCompletionResult`
- `useNoteEditorActions()` 在拿到结果后：
  - 继续把 `result.text` 追加进正文文本
  - 如果 `result.widgets` 存在，则把这些 widgets 映射成 `widget block` 并追加到 `draft.document.blocks` 末尾

编辑器侧不直接调用 `generateWidgets()`。

如果具体 provider 不能在一次 `completeDocument()` 里天然返回 widgets，那么这个兼容细节应收口在 provider 内部，而不是扩散到 editor UI。例如：

- `MockAiProvider` 继续直接返回 `text + widgets`
- `OpenAiCompatibleAiProvider` 可以在内部复用现有 widget 生成逻辑，把结果折叠进 `AiCompletionResult.widgets`
- widget 请求失败时，应降级成“只返回文本”，而不是让整次补全文本失败

这样对 editor 来说，契约始终保持统一：

- 只消费一次 `completeDocument()` 的结果

### 5. 预览态优先消费草稿文档

当前 `NoteEditorPreviewPane` 每次都从 `content` 重新 parse。

本轮改为：

- 优先基于当前草稿构造 live `RichDocument`
- 这个 live document 由“当前文本生成的 text blocks + 草稿里已有的 widget blocks”组成
- 如果草稿里没有 `document`，再退回到现有的纯文本 parse 逻辑

这样能保证：

- AI 刚追加的 widgets，切到预览时可以立即看到
- 文本编辑仍然反映最新 `content`
- 旧笔记没有 `document` 时不回归

### 6. 保存、同步与本地存储

同步 provider 的接口本身不需要改：

- `pushNotes(username, notes: Note[])`
- `pullNotes(username): Promise<Note[]>`

因为 `document` 只是 `Note` 的新增可选字段。

真正要补的是：

- `localNoteStore`
  - 解析 `document`
  - 宽容校验 block 结构
  - 非法 `document` 降级成基于 `content` 的纯文本 document

- `createDraftFromNote()`
  - 把 `note.document` 带进草稿

- `createNoteFromDraft()` / `mergeDraftIntoNote()`
  - 把同步后的 `document` 带进最终 `Note`

- `hasNoteChanged()`
  - 把 `document` 纳入变更判断

- `hasDraftContent()`
  - 在判断是否允许保存时，把“存在 widget block”视为有效内容

## 数据流

### 打开旧笔记

1. 读取 `Note`
2. 如果 `note.document` 存在且合法，直接进入草稿
3. 如果不存在或非法，则保留 `content` 作为事实来源
4. 预览时临时构造纯文本 `document`
5. 用户下一次保存时，再把 `document` 一并写回

### AI 补全

1. editor 触发一次 `completeDocument()`
2. provider 返回 `AiCompletionResult`
3. `result.text` 追加到 `content + textSegments`
4. `result.widgets` 如果存在，则映射成 `widget block[]`
5. 这些 widget blocks 统一追加到 `draft.document` 末尾
6. 切到预览时，新的 widgets 立即可见

### 保存

1. 根据当前 `content` 重建文本 blocks
2. 从 `draft.document` 提取已有 widget blocks
3. 生成最终 `document`
4. 把 `content + textSegments + document + media` 一起写回 `Note`
5. 通过现有 sync provider 推送

## 容错与兼容

### 旧数据兼容

采用“读时兼容，写时升级”：

- 不写迁移脚本
- 旧 note 无 `document` 时可以照常使用
- 只有用户保存该 note 时，才补齐 `document`

### 脏数据容错

如果持久化中的 `document` 非法：

- 不让整条笔记读取失败
- 降级为基于 `content` 的文本 document
- 对非法 widget block 直接忽略

### 校验规则

当前“内容不能为空”的逻辑需要放宽为：

- `content.trim()`
- 或存在图片
- 或存在音频
- 或 `document` 中存在至少一个 widget block

满足任一条件即可保存。

### 搜索与列表

本轮保持现状：

- 搜索仍然只依赖现有文本链路
- 不把 widget 内容展开成搜索文本

## 文件落点

- Modify: `src/entities/note/types.ts`
- Modify: `src/entities/note/draft.ts`
- Create: `src/entities/note/document.ts`
- Modify: `src/shared/lib/localNoteStore.ts`
- Modify: `src/features/home/model/homeNoteUtils.ts`
- Modify: `src/features/home/model/useHomeNotes.ts`
- Modify: `src/features/note-editor/model/noteEditorAi.ts`
- Modify: `src/features/note-editor/model/useNoteEditorActions.ts`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
- Modify: `src/providers/ai/openai-compatible/openAiCompatibleAiProvider.ts`
- Modify: `README.md`

## 测试策略

先补失败测试，再实现。

### note 文档辅助模块

- 基于纯文本构建文本 document
- 从 document 中提取 widget blocks
- 文本变化后重建 document 时不会丢 widget blocks

### localNoteStore

- 带 `document + widget blocks` 的 note 可以正确读写
- 旧 note 无 `document` 时仍能正确解析
- 非法 `document` 会降级，不会导致整条 note 丢失

### homeNoteUtils

- `createNoteFromDraft()` 会保留 `document`
- `mergeDraftIntoNote()` 会保留 `document`
- `hasNoteChanged()` 能识别 `document` 变化
- `hasDraftContent()` 在只有 widget 时返回 true

### AI 链路

- `completeNoteEditorTextWithAi()` 返回完整 `AiCompletionResult`
- `useNoteEditorActions()` 在 AI 返回 `text + widgets` 时：
  - 文本被追加
  - widgets 被追加进草稿 document 末尾

### 预览链路

- `NoteEditorPreviewPane` 在草稿已有 widgets 时优先预览 live document
- 文本变化时仍能更新预览
- 图片 / 音频 marker 预览不回归

### provider 兼容

如果本轮修改 `OpenAiCompatibleAiProvider`：

- 文本生成成功但 widget 生成失败时，仍返回文本结果
- widget 成功时，会进入 `AiCompletionResult.widgets`

## 风险

- 如果 `content -> document` 的同步规则分散在多个 feature 里，后续很容易漂移，因此必须收口在单独辅助模块
- 如果把 widget 内容写回 `content`，会污染现有文本编辑模型，因此本轮必须明确禁止
- 如果 `OpenAiCompatibleAiProvider` 通过额外请求补 widgets，AI 响应时延会增加，需要允许“文本成功、widgets 缺失”的降级路径
- 如果 `hasDraftContent()` 不同步更新，用户会遇到“只有 widget 却无法保存”的回归

## 完成标准

- `Note` / `NoteDraft` 可以持久化 `document`
- AI 返回的 widgets 能进入草稿文档状态
- 保存后 widgets 不丢失，并能随 note 一起同步
- 预览态能立即显示草稿中的 widgets
- 旧笔记没有 `document` 时不回归
- 现有文本编辑、图片、音频链路不回归
- 相关测试通过
