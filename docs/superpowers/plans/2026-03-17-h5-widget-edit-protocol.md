# H5 Widget Edit Protocol Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑态能把 widget 作为块级对象纳入编辑链，建立通用 widget bridge 协议，并通过 RN 侧 editor 容器完成 `todo-list` 的真实编辑与其他类型的 fallback 编辑。

**Architecture:** `H5TextDocumentEditor` 继续只负责文本编辑，但新增 widget placeholder 与 widget bridge 事件转发；真实 widget 编辑 UI 不放进 WebView，而是在 RN 侧通过统一 `WidgetEditorSheet` 承载。`NoteEditorModal` 负责接收 widget 事件、定位当前 block、更新 `draft.document` 并将变更重新同步回 H5。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer、react-native-webview

---

## File Map

- Modify: `src/entities/note/document.ts`
  - 扩展 widget block 级别的纯函数：查找、替换、删除、追加
- Modify: `src/entities/note/document.test.ts`
  - 覆盖新的 document 级 widget 变更辅助函数
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`
  - 新增 widget bridge 事件类型、解析器与注入脚本片段
- Modify: `src/features/h5-editor/model/h5TextEditorMarkup.ts`
  - 在 H5 编辑态 body html 中输出 widget placeholder 元信息与操作入口
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 接收 `document` / `onWidgetEvent`
  - 转发 widget 事件，不破坏现有文本事件
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
  - 覆盖 widget placeholder 与 widget 事件转发
- Create: `src/features/widget-editor/model/widgetEditorRegistry.ts`
  - `widget.type -> editor component` 映射
- Create: `src/features/widget-editor/model/widgetDraftFactory.ts`
  - 为插入流程创建默认 `WidgetSchema`
- Create: `src/features/widget-editor/model/widgetDraftFactory.test.ts`
  - 覆盖默认 widget 草稿创建规则
- Create: `src/features/widget-editor/ui/WidgetEditorSheet.tsx`
  - 统一 widget 编辑容器
- Create: `src/features/widget-editor/ui/TodoListWidgetEditor.tsx`
  - 首个真实 widget editor
- Create: `src/features/widget-editor/ui/FallbackWidgetEditor.tsx`
  - 未支持类型的只读/可删除 editor
- Create: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
  - 覆盖 editor registry、fallback 与保存/删除动作
- Create: `src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx`
  - 覆盖标题与 item 编辑
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
  - 接 H5 widget 事件
  - 打开/关闭 editor 容器
  - 对 `draft.document` 做 replace/remove/append
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
  - 覆盖 widget 编辑、删除、插入请求接线
- Modify: `README.md`
  - 更新 H5 widget 编辑协议进展与剩余风险

## Execution Notes

- 执行时先用 `@superpowers/test-driven-development`，每个任务先写失败测试，再跑红，再写最小实现。
- 完成前用 `@superpowers/verification-before-completion` 跑全量验证。
- 当前仓库 `AGENTS.md` 禁止未明确要求时主动 `git commit` / `git push`。
  - 计划里保留提交检查点建议，但执行时只有在用户明确要求拆分提交时才真正提交。
- 当前会话没有 `plan-document-reviewer` 子代理。
  - 写完每个 chunk 后，执行者需要做一次本地自检再进入下一个 chunk。

## Chunk 1: Document 辅助函数与 widget bridge RED

### Task 1: 为 `document` 级 widget 变更补失败测试

**Files:**
- Modify: `src/entities/note/document.test.ts`
- Modify: `src/entities/note/document.ts`

- [ ] **Step 1: 扩展 `document` 辅助函数失败测试**

新增这些测试：

- `findWidgetBlock(document, blockId)` 能定位目标 widget block
- `replaceWidgetBlock(document, blockId, nextWidget)` 只替换目标 block 的 `widget`
- `removeWidgetBlock(document, blockId)` 会删除目标 block，其他 block 顺序不变
- `appendWidgetBlock(document, widget)` 会把新 block 追加到末尾

- [ ] **Step 2: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: FAIL，原因是 `document.ts` 尚未导出这些新 helper。

- [ ] **Step 3: 写最小实现**

实现这些导出：

- `findWidgetBlock(document, blockId)`
- `replaceWidgetBlock(document, blockId, nextWidget)`
- `removeWidgetBlock(document, blockId)`
- `appendWidgetBlock(document, widget)`

约束：

- 只做纯函数，不引入 UI 或 provider 依赖
- 如果找不到 block，返回原 document 或 `null`，不要抛异常

- [ ] **Step 4: 运行 document helper 测试**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts`

Expected: PASS

### Task 2: 为 H5 widget bridge parser 补失败测试

**Files:**
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`
- Modify: `src/features/h5-editor/model/h5TextEditorBridge.ts`

- [ ] **Step 1: 写 widget bridge 失败测试**

在 `H5TextDocumentEditor.test.tsx` 补这些覆盖：

- 传入 `document` 时，渲染出的 html 包含 widget placeholder 的 blockId / widgetId / widgetType 元信息
- `onMessage` 收到 `widget-select` 时会转发给 `onWidgetEvent`
- `onMessage` 收到 `widget-edit-request` / `widget-delete` / `widget-insert-request` 时会转发给 `onWidgetEvent`

- [ ] **Step 2: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: FAIL，原因是当前 bridge 只认识文本与媒体消息。

- [ ] **Step 3: 扩展 bridge 类型与解析器**

实现：

- `H5WidgetBridgeEvent` 类型
- `parseH5TextEditorMessage()` 对 4 种 widget 消息的识别

不要在这一任务里接 UI 或 modal。

- [ ] **Step 4: 运行 H5 bridge 测试**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: PASS，或只剩下 placeholder/props 相关的后续失败。

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `refactor(h5-editor): add widget bridge primitives`

## Chunk 2: H5 placeholder 渲染与 widget 事件转发

### Task 3: 让 H5 editor 输出 widget placeholder 元信息

**Files:**
- Modify: `src/features/h5-editor/model/h5TextEditorMarkup.ts`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
- Modify: `src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

- [ ] **Step 1: 写 placeholder 渲染失败测试**

补这些断言：

- `document` 中有 widget blocks 时，html 中会出现 `data-widget-block-id`
- placeholder 是 `contenteditable="false"` 的原子块
- placeholder 里至少有：
  - widget 标题
  - 编辑按钮
  - 删除按钮
- 现有媒体 marker html 不回归

- [ ] **Step 2: 运行针对性测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx`

Expected: FAIL，原因是当前 body html 只会渲染文本 segment 和媒体 marker。

- [ ] **Step 3: 扩展 markup 与 editor props**

实现：

- `createH5TextEditorBodyHtml()` 新增 `document?: RichDocument`
- 通过 `extractWidgetBlocks(document)` 追加 widget placeholder html
- `H5TextDocumentEditorProps` 新增：
  - `document?: RichDocument`
  - `onWidgetEvent?: (event: H5WidgetBridgeEvent) => void`

约束：

- 不把 widget 内容混回 `content-change`
- 先沿用“widget 全在文本尾部”这一当前模型约束

- [ ] **Step 4: 让 `H5TextDocumentEditor` 转发 widget 事件**

实现：

- `handleMessage()` 遇到 widget bridge 消息时调用 `onWidgetEvent`
- 现有 `content-change` / `selection-change` / `media-delete` 分支保持不变

- [ ] **Step 5: 跑 H5 editor 针对性回归**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/h5-editor/ui/H5DocumentPreview.test.tsx src/features/note-editor/ui/NoteEditorPreviewPane.test.tsx`

Expected: PASS

- [ ] **Step 6: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS，或只暴露后续 `NoteEditorModal`/mock props 未跟上的编译错误。

### Task 4: 为插入流程准备默认 widget 草稿工厂

**Files:**
- Create: `src/features/widget-editor/model/widgetDraftFactory.ts`
- Test: `src/features/widget-editor/model/widgetDraftFactory.test.ts`

- [ ] **Step 1: 写 widget 草稿工厂失败测试**

覆盖这些行为：

- `createWidgetDraft('todo-list')` 返回合法的最小 `todo-list` schema
- 未支持类型也能生成一个最小 fallback schema

- [ ] **Step 2: 运行新测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: FAIL，原因是文件尚不存在。

- [ ] **Step 3: 写最小实现**

实现：

- `createWidgetDraft(type: WidgetType): WidgetSchema`

约束：

- 只生成当前 UI 能承接的最小默认数据
- 不引入随机字段

- [ ] **Step 4: 运行 widget 草稿工厂测试**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/model/widgetDraftFactory.test.ts`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(h5-editor): render widget placeholders and bridge widget events`

## Chunk 3: RN 侧 widget editor 容器

### Task 5: 为 widget editor 容器与 registry 补失败测试

**Files:**
- Create: `src/features/widget-editor/model/widgetEditorRegistry.ts`
- Create: `src/features/widget-editor/ui/WidgetEditorSheet.tsx`
- Create: `src/features/widget-editor/ui/FallbackWidgetEditor.tsx`
- Create: `src/features/widget-editor/ui/TodoListWidgetEditor.tsx`
- Create: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
- Create: `src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx`

- [ ] **Step 1: 写 `TodoListWidgetEditor` 失败测试**

覆盖这些行为：

- 能修改标题
- 能新增 item
- 能删除 item
- 能修改 item 文本
- `onChange` 返回新的 `WidgetSchema`

- [ ] **Step 2: 写 `WidgetEditorSheet` 失败测试**

覆盖这些行为：

- `todo-list` 会命中真实 editor
- 未支持类型会命中 fallback editor
- fallback editor 不崩溃并显示“暂不支持编辑”
- 点击删除按钮会触发 `onDelete`
- 点击取消不会提交变更

- [ ] **Step 3: 运行 widget editor 测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，原因是 widget-editor feature 尚不存在。

- [ ] **Step 4: 写最小 editor 容器实现**

实现：

- `widgetEditorRegistry`
- `TodoListWidgetEditor`
- `FallbackWidgetEditor`
- `WidgetEditorSheet`

约束：

- editor 只改 `WidgetSchema`
- 容器负责确认/取消/删除，不直接触碰 `document`

- [ ] **Step 5: 运行 widget editor 测试**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

- [ ] **Step 6: 跑一组窄回归**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx src/features/widget-renderer/ui/WidgetRenderer.test.tsx`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(widget-editor): add sheet-based widget editors`

## Chunk 4: `NoteEditorModal` 接线与 `document` 回写

### Task 6: 为 `NoteEditorModal` 的 widget 编辑流程补失败测试

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`

- [ ] **Step 1: 写 modal 失败测试**

新增这些覆盖：

- H5 模式下收到 `widget-edit-request` 时会打开 `WidgetEditorSheet`
- 编辑 `todo-list` 提交后会通过 `onChangeDocument` 回写替换后的 widget block
- 收到 `widget-delete` 时会从 `document.blocks` 中移除目标 block
- 收到 `widget-insert-request` 时会创建默认 widget 并追加到文末
- 关闭 editor sheet 不会回写未确认修改

- [ ] **Step 2: 运行 modal 测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是 `NoteEditorModal` 还没有 widget editor 容器与 widget 事件处理。

- [ ] **Step 3: 实现 `NoteEditorModal` widget controller**

实现：

- 持有当前选中的 widget block 状态
- 处理 `onWidgetEvent`
- 打开/关闭 `WidgetEditorSheet`
- 使用 `document.ts` helper 做：
  - `replaceWidgetBlock`
  - `removeWidgetBlock`
  - `appendWidgetBlock`

约束：

- 文本编辑链保持原状
- widget 更新只走 `document`
- `widget-select` 先只记录选中态，不引入额外 UI 复杂度

- [ ] **Step 4: 让 H5 mock props 与 modal 接线一致**

如果测试 mock 需要跟进，补这些字段：

- `document`
- `onWidgetEvent`

不要顺手改其他无关 mock 行为。

- [ ] **Step 5: 跑 modal 与 H5 editor 组合回归**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

- [ ] **Step 6: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `feat(note-editor): wire h5 widget edit protocol into modal`

## Chunk 5: README 与全量验证

### Task 7: 更新 README 当前状态

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新当前进度**

补充这些信息：

- H5 编辑态已新增 widget bridge 协议
- `todo-list` 支持通过 RN editor 容器真实编辑
- 其他 widget 类型当前走 fallback editor

- [ ] **Step 2: 收敛剩余风险描述**

把未完成项聚焦到：

- widget 仍不支持 H5 内联编辑
- widget 仍不支持拖拽排序与任意位置插入
- Expo 迁移尚未开始

### Task 8: 跑最终验证

**Files:**
- Verify only

- [ ] **Step 1: 跑本轮直接相关测试集**

Run: `./node_modules/.bin/jest --runInBand src/entities/note/document.test.ts src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/widget-editor/model/widgetDraftFactory.test.ts src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

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

- 新增的 widget-editor 测试文件
- 本轮 bridge / modal / editor 相关回归结果
- 是否还存在需要下一轮继续拆解的协议缺口

提交检查点建议（仅当用户明确要求拆分提交时执行）：

- `docs(refactor): record h5 widget edit protocol progress`
