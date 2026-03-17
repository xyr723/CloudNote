# H5 Widget Insert Type Picker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 H5 编辑态发起 `widget-insert-request` 后，先在 RN 侧选择 widget 类型，再进入对应 editor，并且只有保存时才真正追加 widget block。

**Architecture:** 保持 WebView 只负责块级协议，新增独立 `WidgetTypePickerSheet` 承担类型选择，`WidgetEditorSheet` 继续承担 widget 编辑。`NoteEditorModal` 作为 controller 协调“插入请求 -> 类型选择 -> editor -> document 回写”的状态流，避免在取消流程中污染 `draft.document`。

**Tech Stack:** React Native、TypeScript、Jest、react-test-renderer

---

## File Map

- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.tsx`
  - 展示 6 种 `WidgetType` 的选择器
- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx`
  - 覆盖类型渲染、选择、取消
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.tsx`
  - 新增 `mode: 'create' | 'edit'`
  - `create` 模式隐藏删除按钮
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`
  - 覆盖 `create/edit` 模式差异和 fallback 保存
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
  - `widget-insert-request` 改为先打开类型选择器
  - 选择类型后打开 `WidgetEditorSheet`
  - 仅在 `create` 模式保存时 append widget
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
  - 覆盖插入请求不会立即写 document、选择类型后保存才追加、取消不回写

## Execution Notes

- 执行时先用 `@superpowers/test-driven-development`，每个任务先写失败测试，再跑红，再写最小实现。
- 完成前用 `@superpowers/verification-before-completion` 跑针对性测试与类型检查。
- 当前会话没有 `plan-document-reviewer` 子代理。
  - 每个 chunk 完成后，执行者需要做一次本地自检再进入下一个 chunk。
- 仓库 `AGENTS.md` 禁止未明确要求时主动 `git commit` / `git push`。

## Chunk 1: 类型选择器 UI

### Task 1: 为 `WidgetTypePickerSheet` 补失败测试并实现

**Files:**
- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.tsx`
- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- 渲染 6 种 `WidgetType`
- 点击任意类型会触发 `onSelect(type)`
- 点击取消只触发 `onClose`

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx`

Expected: FAIL，原因是组件文件尚不存在。

- [ ] **Step 3: 写最小实现**

实现要求：

- 只接受 `visible / onSelect / onClose / theme`
- `visible=false` 时返回 `null`
- 文案直接内置在组件中，不额外抽象搜索、图标、分组

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx`

Expected: PASS

## Chunk 2: `WidgetEditorSheet` 创建模式

### Task 2: 为 `WidgetEditorSheet` 增加 `create/edit` 模式

**Files:**
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.tsx`
- Modify: `src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

- [ ] **Step 1: 先补失败测试**

新增覆盖：

- `create` 模式标题显示“新建组件”
- `create` 模式不显示“删除组件”
- fallback 类型在 `create` 模式点击保存会提交当前 draft widget
- `edit` 模式仍显示“删除组件”

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: FAIL，原因是当前没有 `mode` 概念，始终显示编辑态。

- [ ] **Step 3: 写最小实现**

实现要求：

- `mode` 默认保持向后兼容，可默认为 `edit`
- `create` 模式只改变标题和删除按钮可见性，不改变 editor 内部 `onChange` 逻辑
- 不引入额外 modal 层级

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/widget-editor/ui/WidgetEditorSheet.test.tsx src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx`

Expected: PASS

## Chunk 3: `NoteEditorModal` 插入流重构

### Task 3: 把 `widget-insert-request` 改为“先选类型，再保存追加”

**Files:**
- Modify: `src/features/note-editor/ui/NoteEditorModal.tsx`
- Modify: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.tsx`
- Create: `src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx`

- [ ] **Step 1: 先改 modal 测试为失败用例**

新增或改造这些覆盖：

- 收到 `widget-insert-request` 时不会立即调用 `onChangeDocument`
- 先显示类型选择器
- 选择 `todo-list` 后进入 editor，点击保存才追加 block
- 选择 `metric` 等 fallback 类型后也能保存并追加
- 关闭类型选择器不会回写 document
- `create` 模式 editor 点击取消不会回写 document

- [ ] **Step 2: 运行测试确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: FAIL，原因是当前收到插入事件后会直接 append 默认 `todo-list`。

- [ ] **Step 3: 写最小实现**

实现要求：

- 新增 `pendingWidgetInsert` 状态
- `widget-insert-request` 只负责打开 `WidgetTypePickerSheet`
- 选择类型后：
  - 调用 `createWidgetDraft(type)`
  - 打开 `WidgetEditorSheet(mode='create')`
- `create` 模式保存时才 `appendWidgetBlock`
- `edit` 模式继续使用现有 replace/remove 逻辑
- 取消任何中间步骤都不回写 document
- 本轮继续统一追加到文末，不处理 `afterBlockId`

- [ ] **Step 4: 运行测试确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/note-editor/ui/NoteEditorModal.test.tsx src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx`

Expected: PASS

## Chunk 4: 针对性回归验证

### Task 4: 跑相关回归与类型检查

**Files:**
- Verify only

- [ ] **Step 1: 跑编辑器与 modal 相关测试**

Run: `./node_modules/.bin/jest --runInBand src/features/h5-editor/ui/H5TextDocumentEditor.test.tsx src/features/widget-editor/ui/TodoListWidgetEditor.test.tsx src/features/widget-editor/ui/WidgetTypePickerSheet.test.tsx src/features/widget-editor/ui/WidgetEditorSheet.test.tsx src/features/note-editor/ui/NoteEditorModal.test.tsx`

Expected: PASS

- [ ] **Step 2: 跑类型检查**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 本地自检**

检查点：

- `widget-insert-request` 不会立刻写 document
- 选择类型后才进入 editor
- `create` 模式取消不落库
- fallback 类型可保存最小 schema

