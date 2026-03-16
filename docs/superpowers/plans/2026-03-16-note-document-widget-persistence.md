# Note Document Widget Persistence Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 AI 返回的 `widgets` 接入 `Note` 的持久化 `document` 状态，并让它们参与保存、同步与预览，同时保持现有 `content + textSegments` 文本编辑链不变。

**Architecture:** 在 `Note` / `NoteDraft` 上新增可选 `document?: RichDocument`，把 widget 持久化收口到结构化文档字段里。文本编辑仍然只改 `content + textSegments`，预览和保存时再把当前文本解析成 text blocks，并与已有 widget blocks 合并成 live document。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、AsyncStorage、现有 `EditorProvider` / `AiProvider`

---

## File Map

- Modify: `src/entities/note/types.ts`
  - 给 `Note` 增加 `document?: RichDocument`
- Modify: `src/entities/note/draft.ts`
  - 给 `NoteDraft` 增加 `document?: RichDocument`
  - `createDraftFromNote()` 带上 `document`
- Create: `src/entities/note/document.ts`
  - 放纯函数辅助逻辑：提取 widget blocks、把文本 document 与已有 widgets 合并、判断是否存在 widgets
- Create: `src/entities/note/document.test.ts`
  - 覆盖文档辅助函数的核心规则
- Modify: `src/shared/lib/localNoteStore.ts`
  - 解析、校验、容错 `document`
- Create: `src/shared/lib/localNoteStore.test.ts`
  - 覆盖新旧数据兼容和脏数据降级
- Modify: `src/features/home/model/homeNoteUtils.ts`
  - `createNoteFromDraft()` / `mergeDraftIntoNote()` / `hasNoteChanged()` / `hasDraftContent()` 纳入 `document`
- Create: `src/features/home/model/homeNoteUtils.test.ts`
  - 覆盖保存、变更判断和“只有 widget 也可保存”
- Modify: `src/features/note-editor/model/noteEditorAi.ts`
  - 返回完整 `AiCompletionResult`
- Modify: `src/features/note-editor/model/noteEditorAi.test.ts`
  - 跟进新的返回契约
- Modify: `src/features/note-editor/model/useNoteEditorActions.ts`
  - AI 成功后同时追加文本和 widgets
  - 保存校验纳入 widgets
- Modify: `src/features/note-editor/model/useNoteEditorActions.test.tsx`
  - 覆盖 AI widget 追加和新的保存校验
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 把 `document` 读写接入编辑器状态
  - 预览态传入当前草稿 `document`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
  - 跟进新 props 和预览读法
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
  - 优先消费 live document，而不是只 parse `content`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`
  - 覆盖已有 widgets 的 live preview
- Modify: `src/providers/ai/openai-compatible/openAiCompatibleAiProvider.ts`
  - 在 `completeDocument()` 内部宽容补充 `widgets`
- Modify: `README.md`
  - 更新当前状态与剩余风险

## Execution Notes

- 执行时先用 `@superpowers/test-driven-development`，每个任务都先写失败测试。
- 完成前用 `@superpowers/verification-before-completion` 跑全量验证。
- 仓库 `AGENTS.md` 禁止未明确要求时主动 `git commit` / `git push`。
  - 本计划保留“提交检查点建议”，但执行时只有在用户明确要求拆分提交时才真正提交。

## Chunk 1: Note 文档模型与辅助函数

### Task 1: 扩展 `Note` / `NoteDraft` 类型并补纯函数辅助模块

**Files:**
- Modify: `src/entities/note/types.ts`
- Modify: `src/entities/note/draft.ts`
- Create: `src/entities/note/document.ts`
- Test: `src/entities/note/document.test.ts`

- [ ] **Step 1: 写 `document` 辅助函数的失败测试**

覆盖这些行为：

- `extractWidgetBlocks(undefined)` 返回空数组
- `extractWidgetBlocks(document)` 只返回 `widget block`
- `mergeTextDocumentWithWidgets(textDocument, existingDocument)` 会保留 textDocument 的文本 blocks，并把 existing widgets 追加到末尾
- `appendWidgetSchemasToDocument(existingDocument, widgets)` 会把 `WidgetSchema[]` 映射成 `widget block[]` 并追加到末尾
- `hasWidgetBlocks(document)` 只在存在至少一个 `widget block` 时返回 `true`

- [ ] **Step 2: 运行新测试，确认失败**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: FAIL，原因是 `src/entities/note/document.ts` 尚不存在或导出不完整。

- [ ] **Step 3: 实现最小辅助函数**

实现这些导出：

- `extractWidgetBlocks(document?: RichDocument): WidgetBlock[]`
- `mergeTextDocumentWithWidgets(textDocument: RichDocument, existingDocument?: RichDocument): RichDocument`
- `appendWidgetSchemasToDocument(document: RichDocument | undefined, widgets: WidgetSchema[]): RichDocument`
- `hasWidgetBlocks(document?: RichDocument): boolean`

约束：

- 只处理 widget block 的提取与合并，不引入 provider 依赖
- `appendWidgetSchemasToDocument()` 生成稳定的 widget block `id`
- 空 widgets 输入时原样返回

- [ ] **Step 4: 扩展 `Note` / `NoteDraft` 类型**

实现：

- `Note` 新增 `document?: RichDocument`
- `NoteDraft` 新增 `document?: RichDocument`
- `createDraftFromNote()` 带上 `note.document`

- [ ] **Step 5: 运行针对性测试**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: PASS

- [ ] **Step 6: 跑类型检查，确认新增类型没有破坏调用方**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS，或仅暴露尚未接线的后续编译错误。

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `refactor(note): add persisted document helpers`

## Chunk 2: 本地存储与 Home 保存语义

### Task 2: 让 `localNoteStore` 支持 `document` 读写和脏数据降级

**Files:**
- Modify: `src/shared/lib/localNoteStore.ts`
- Test: `src/shared/lib/localNoteStore.test.ts`

- [ ] **Step 1: 写存储层失败测试**

覆盖这些行为：

- 带 `document + widget block` 的 note 经过 `saveNotes()` / `loadNotes()` 后不丢失
- 旧 note 没有 `document` 时仍能正常解析
- 非法 `document.blocks` 会被忽略或降级，不影响 note 读取

- [ ] **Step 2: 运行新测试，确认失败**

Run: `./node_modules/.bin/jest --runInBand src/shared/lib/localNoteStore.test.ts`

Expected: FAIL，原因是 `localNoteStore` 还不会解析 `document`。

- [ ] **Step 3: 实现 `document` 解析与降级**

实现要点：

- 新增 `parseDocumentBlock()` / `parseRichDocument()` 一类的宽容解析函数
- 仅接受已知 block 结构
- 非法 block 直接过滤
- `document` 非法时返回 `undefined`
- 不因为一条 note 的 `document` 非法让整个 note 读取失败

- [ ] **Step 4: 回归存储层测试**

Run: `./node_modules/.bin/jest --runInBand src/shared/lib/localNoteStore.test.ts`

Expected: PASS

### Task 3: 更新 Home 保存、变更判断和空内容校验

**Files:**
- Modify: `src/features/home/model/homeNoteUtils.ts`
- Test: `src/features/home/model/homeNoteUtils.test.ts`

- [ ] **Step 1: 写 Home 语义失败测试**

覆盖这些行为：

- `createNoteFromDraft()` 会保留 `document`
- `mergeDraftIntoNote()` 会保留 `document`
- `hasNoteChanged()` 在 `document` 变化时返回 `true`
- `hasDraftContent()` 在 `content` 为空但存在 widget block 时返回 `true`

- [ ] **Step 2: 运行新测试，确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/home/model/homeNoteUtils.test.ts`

Expected: FAIL，原因是工具函数尚未把 `document` 纳入逻辑。

- [ ] **Step 3: 实现最小改动**

实现：

- `createNoteFromDraft()` / `mergeDraftIntoNote()` 透传 `document`
- `hasNoteChanged()` 增加 `JSON.stringify(cachedNote.document) !== JSON.stringify(note.document)`
- `hasDraftContent()` 使用 `hasWidgetBlocks(draft.document)` 作为额外真值来源

- [ ] **Step 4: 运行 Home 语义测试**

Run: `./node_modules/.bin/jest --runInBand src/features/home/model/homeNoteUtils.test.ts`

Expected: PASS

- [ ] **Step 5: 跑一组窄回归**

Run: `./node_modules/.bin/jest --runInBand src/shared/lib/localNoteStore.test.ts src/features/home/model/homeNoteUtils.test.ts src/entities/note/document.test.ts`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(note): persist rich document with widget blocks`

## Chunk 3: AI 结果契约与编辑器动作

### Task 4: 把 note-editor AI 契约从字符串升级为 `AiCompletionResult`

**Files:**
- Modify: `src/features/note-editor/model/noteEditorAi.ts`
- Modify: `src/features/note-editor/model/noteEditorAi.test.ts`

- [ ] **Step 1: 改写失败测试**

把现有断言从：

- `resolves.toBe('补全文本')`

改为：

- `resolves.toEqual({ text: '补全文本', widgets: [...], metadata: ... })`

并保持 `completeDocument()` 入参断言不变。

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorAi.test.ts`

Expected: FAIL，原因是 `completeNoteEditorTextWithAi()` 仍返回字符串。

- [ ] **Step 3: 实现最小返回结构**

实现：

- `completeNoteEditorTextWithAi()` 直接返回 `AiCompletionResult`
- 不在这里做 widget 映射或 UI 逻辑

- [ ] **Step 4: 运行 AI 契约测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/noteEditorAi.test.ts`

Expected: PASS

### Task 5: 让 `useNoteEditorActions` 同时处理文本和 widgets

**Files:**
- Modify: `src/features/note-editor/model/useNoteEditorActions.ts`
- Modify: `src/features/note-editor/model/useNoteEditorActions.test.tsx`

- [ ] **Step 1: 写 hook 失败测试**

新增这些覆盖：

- AI 返回 `text + widgets` 时，同时调用 `onAppendText(text)` 和 `onAppendWidgets(widgets)`
- 标题为空时仍阻止保存
- 正文为空、图片音频为空、但 `hasWidgets` 为 `true` 时允许保存

- [ ] **Step 2: 运行 hook 单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useNoteEditorActions.test.tsx`

Expected: FAIL，原因是 hook 还没有 `onAppendWidgets` / `hasWidgets`。

- [ ] **Step 3: 实现 hook 的最小扩展**

实现：

- 输入参数新增 `hasWidgets: boolean`
- 输入参数新增 `onAppendWidgets?: (widgets: WidgetSchema[]) => void`
- `handleAiComplete()` 解包 `AiCompletionResult`
- `handleSaveWithValidation()` 的空内容判断改成：
  - `content.trim()`
  - 或 `imagesCount > 0`
  - 或 `audiosCount > 0`
  - 或 `hasWidgets`

- [ ] **Step 4: 运行 hook 单测**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/model/useNoteEditorActions.test.tsx src/features/note-editor/model/noteEditorAi.test.ts`

Expected: PASS

### Task 6: 让 `OpenAiCompatibleAiProvider.completeDocument()` 宽容返回 widgets

**Files:**
- Modify: `src/providers/ai/openai-compatible/openAiCompatibleAiProvider.ts`
- Test: `src/providers/ai/openai-compatible/openAiCompatibleAiProvider.test.ts`

- [ ] **Step 1: 新建 provider 失败测试**

覆盖这些行为：

- 文本请求成功、widget 请求成功时，`completeDocument()` 返回 `text + widgets`
- 文本请求成功、widget 请求失败时，`completeDocument()` 仍返回 `text`，并省略 `widgets`
- 文本请求失败时，整个 `completeDocument()` 仍然 reject

- [ ] **Step 2: 运行 provider 测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/providers/ai/openai-compatible/openAiCompatibleAiProvider.test.ts`

Expected: FAIL，原因是 `completeDocument()` 目前不会返回 widgets。

- [ ] **Step 3: 实现最小 provider 兼容**

实现策略：

- `completeDocument()` 先请求文本
- 文本成功后，用 `try/catch` 调用现有 widget 生成逻辑
- widget 成功则折叠进返回值
- widget 失败则忽略，只返回文本结果

不要在本轮引入额外缓存、重试或并行调度。

- [ ] **Step 4: 运行 provider 测试**

Run: `./node_modules/.bin/jest --runInBand src/providers/ai/openai-compatible/openAiCompatibleAiProvider.test.ts`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(ai): persist widgets from completion result`

## Chunk 4: 编辑器状态与预览接线

### Task 7: 让 `NoteEditorModal` 把 widgets 写入草稿 `document`

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写 modal 失败测试**

覆盖这些行为：

- `note.document` 会被透传到预览面板
- AI 追加 widgets 后，会通过 `onChangeDocument()` 写回草稿
- widget 追加规则固定为文末追加，不改动已有文本 blocks 顺序

- [ ] **Step 2: 运行 modal 测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 modal 还没有 `document` 接线。

- [ ] **Step 3: 实现 modal 接线**

实现：

- `NoteEditorModalProps` 新增 `onChangeDocument?: (document: RichDocument) => void`
- 通过 `hasWidgetBlocks(note.document)` 计算 `hasWidgets`
- 给 `useNoteEditorActions()` 传 `hasWidgets`
- 新增 `handleAppendWidgets()`，内部调用 `appendWidgetSchemasToDocument(note.document, widgets)` 后再 `onChangeDocument`
- 预览态传入当前 `note.document`

- [ ] **Step 4: 运行 modal 测试**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/note-editor/model/useNoteEditorActions.test.tsx`

Expected: PASS

### Task 8: 让 `NoteEditorPreviewPane` 优先渲染 live document

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

- [ ] **Step 1: 写预览面板失败测试**

覆盖这些行为：

- 传入 `document` 时，预览面板会把当前文本 parse 成 text document，再和已有 widget blocks 合并后交给 `H5DocumentPreview`
- 未传入 `document` 时，维持现有纯文本 parse 行为
- 图片 / 音频 marker 占位不回归

- [ ] **Step 2: 运行预览面板测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: FAIL，原因是组件当前只消费 `content`。

- [ ] **Step 3: 实现 live document 逻辑**

实现：

- props 新增 `document?: RichDocument`
- 内部仍调用 `providerRegistry.getEditorProvider().parse(createPreviewInput(content))`
- parse 完成后，使用 `mergeTextDocumentWithWidgets(parsedTextDocument, document)` 构造 live document
- 只在 parse 失败时回退到空 document

- [ ] **Step 4: 运行预览与 H5 预览回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx`

Expected: PASS

### Task 9: 把草稿 `document` 正式接到 Home 编辑状态

**Files:**
- Modify: `src/features/home/model/useHomeNotes.ts`
- Modify: `src/features/home/ui/HomeEditorModal.tsx`
- Test: `src/features/note-editor/ui/NoteEditorModal.test.tsx`

- [ ] **Step 1: 写失败测试或扩展现有 modal/home 测试**

覆盖这些行为：

- 打开已有 note 时，`document` 会进草稿
- 编辑器里的 `onChangeDocument()` 会回写到 `currentNote`
- 保存后 `document` 会进入最终 notes 状态

- [ ] **Step 2: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 home/editor 还没有把 `document` 接回草稿状态。

- [ ] **Step 3: 实现 home 接线**

实现：

- `useHomeNotes` 新增 `handleChangeDocument(document: RichDocument)` 一类的草稿更新回调
- `HomeEditorModal` 把回调传给 `NoteEditorModal`
- 保存链保持使用现有 `currentNote`

- [ ] **Step 4: 运行编辑器接线回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/features/home/model/homeNoteUtils.test.ts`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(note-editor): wire persisted document widgets into draft preview`

## Chunk 5: 文档同步与全量验证

### Task 10: 更新 README 当前状态

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前进度**

补充这些信息：

- AI provider 返回的 `widgets` 已接入 note editor / 文档状态
- 预览态会优先消费草稿 `document`
- widget 仍然只支持 AI 追加与预览，不支持编辑

- [ ] **Step 2: 保持后续风险描述收敛**

把未完成项聚焦到：

- widget 编辑协议仍未开始
- H5 编辑态仍只支持 widget placeholder
- Expo 迁移尚未开始

### Task 11: 跑最终验证

**Files:**
- Verify only

- [ ] **Step 1: 跑与本轮直接相关的测试集合**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts src/shared/lib/localNoteStore.test.ts src/features/home/model/homeNoteUtils.test.ts src/features/note-editor/model/noteEditorAi.test.ts src/features/note-editor/model/useNoteEditorActions.test.tsx src/providers/ai/openai-compatible/openAiCompatibleAiProvider.test.ts src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

- [ ] **Step 2: 跑全量单测**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

- [ ] **Step 3: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 4: 跑 lint**

Run: `./node_modules/.bin/eslint .`

Expected: `0 error`，允许保留现有历史 warning

- [ ] **Step 5: 跑 diff 健康检查**

Run: `git diff --check`

Expected: 无输出

- [ ] **Step 6: 汇总验证结果**

记录：

- 新增/修改的测试文件
- 全量验证命令结果
- 是否存在需要用户确认的残余风险

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `docs(refactor): record note document widget persistence progress`
