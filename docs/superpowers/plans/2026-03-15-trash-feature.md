# Trash Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将回收站从旧 `app/components/TrashPage.tsx` 迁入 `src/features/trash/**`，同时收口页面状态和反馈弹窗，保持现有行为不回退。

**Architecture:** 保留现有 `TrashProvider` 和 `NoteSyncProvider` 数据边界，只重构页面层。新结构由 `useTrashNotes` 管理状态，`TrashModal` 负责接线，`TrashList` 和 `TrashFeedbackModals` 负责纯渲染。

**Tech Stack:** React Native、React hooks、Jest、react-test-renderer、TypeScript

---

## Chunk 1: 测试与模型层

### Task 1: 为 `useTrashNotes` 建立失败测试

**Files:**
- Create: `src/features/trash/model/useTrashNotes.test.tsx`
- Reference: `src/features/home/model/useHomeNotes.ts`
- Reference: `src/providers/trash/trashProvider.ts`
- Reference: `src/providers/sync/noteSyncProvider.ts`

- [ ] **Step 1: 写 hook 失败测试**

```tsx
test('loads trash notes for current user', async () => {
  const listNotes = jest.fn().mockResolvedValue([
    {id: 'trash-1', title: '已删除', content: '内容', timestamp: new Date()},
  ]);

  jest.doMock('../../../providers/providerRegistry', () => ({
    providerRegistry: {
      getTrashProvider: () => ({listNotes}),
      getNoteSyncProvider: () => ({pullNotes: jest.fn(), pushNotes: jest.fn()}),
    },
  }));

  let latestHook: ReturnType<typeof useTrashNotes> | null = null;

  const Probe = () => {
    latestHook = useTrashNotes({username: 'alice'});
    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  expect(listNotes).toHaveBeenCalledWith('alice');
  expect(latestHook?.notes).toHaveLength(1);
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx`

Expected: FAIL，原因是 `useTrashNotes` 模块尚不存在。

- [ ] **Step 3: 写最小实现让测试可运行**

```tsx
export const useTrashNotes = ({username}: {username: string}) => {
  return {
    notes: [],
    isLoading: true,
    isRefreshing: false,
  };
};
```

- [ ] **Step 4: 补齐更多失败测试覆盖核心行为**

增加这些测试：

- 首次加载完成后关闭 loading
- `refresh()` 会重新拉取列表
- `requestRestore(note)` 会记录 `selectedNote` 和 `activeAction`
- `confirmAction()` 在恢复时会调用 `trashProvider.restoreNote`、`noteSyncProvider.pullNotes`、`noteSyncProvider.pushNotes`
- `confirmAction()` 在删除时会调用 `trashProvider.deleteNote`
- 成功后会更新 `successFeedback`

- [ ] **Step 5: 逐个运行失败测试确认失败原因正确**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx`

Expected: FAIL，原因是缺失状态或行为，不是语法错误。

### Task 2: 实现 `useTrashNotes`

**Files:**
- Create: `src/features/trash/model/useTrashNotes.ts`
- Modify: `src/features/trash/model/useTrashNotes.test.tsx`
- Reference: `src/features/home/model/homeNoteUtils.ts`

- [ ] **Step 1: 写最小 hook 实现**

实现这些状态：

```ts
type TrashAction = 'restore' | 'delete' | null;
type TrashSuccessFeedback = 'restore' | 'delete' | null;
```

输出至少包含：

- `notes`
- `isLoading`
- `isRefreshing`
- `activeAction`
- `selectedNote`
- `successFeedback`
- `refresh`
- `requestRestore`
- `requestDelete`
- `closeActionModal`
- `closeSuccessFeedback`
- `confirmAction`

- [ ] **Step 2: 跑 hook 单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx`

Expected: PASS

- [ ] **Step 3: 在保持绿色的前提下做小型整理**

只允许：

- 抽出成功反馈自动关闭 helper
- 收紧依赖数组
- 清理重复的 `setState`

- [ ] **Step 4: 再跑 hook 单测**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx`

Expected: PASS

## Chunk 2: UI 组件拆分

### Task 3: 为 `TrashModal` 建立失败测试

**Files:**
- Create: `src/features/trash/ui/TrashModal.test.tsx`
- Reference: `src/features/note-editor/ui/NoteEditorModal.test.tsx`
- Reference: `src/shared/theme/colors.ts`

- [ ] **Step 1: 写 UI 失败测试**

至少覆盖：

- loading 时出现 `ActivityIndicator`
- 空列表时显示“暂无已删除的笔记”
- 有数据时显示标题、内容、删除时间、恢复和彻底删除按钮
- 触发恢复 / 删除后弹出确认框
- `successFeedback='restore'` 和 `successFeedback='delete'` 时显示不同成功文案

- [ ] **Step 2: 运行单测确认失败**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/ui/TrashModal.test.tsx`

Expected: FAIL，原因是 `TrashModal` 或子组件尚不存在。

### Task 4: 实现 `TrashList` 与 `TrashFeedbackModals`

**Files:**
- Create: `src/features/trash/ui/TrashList.tsx`
- Create: `src/features/trash/ui/TrashFeedbackModals.tsx`
- Create: `src/features/trash/ui/trashStyles.ts`
- Modify: `src/features/trash/ui/TrashModal.test.tsx`

- [ ] **Step 1: 写最小列表组件**

`TrashList.tsx` 只负责：

- loading 渲染
- 空态渲染
- 列表项渲染
- 通过 props 调用 `onRestore(note)` / `onDelete(note)`

- [ ] **Step 2: 写最小反馈弹窗组件**

`TrashFeedbackModals.tsx` 只负责：

- 恢复确认
- 删除确认
- 成功反馈

成功反馈文案根据 `successFeedback` 切换，而不是分两个布尔值。

- [ ] **Step 3: 跑 UI 单测，允许仍然失败在 `TrashModal` 入口未实现**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/ui/TrashModal.test.tsx`

Expected: FAIL，失败点集中在 `TrashModal` 接线层。

### Task 5: 实现 `TrashModal`

**Files:**
- Create: `src/features/trash/ui/TrashModal.tsx`
- Modify: `src/features/trash/ui/TrashModal.test.tsx`
- Reference: `app/components/TrashPage.tsx`

- [ ] **Step 1: 写最小入口组件**

`TrashModal.tsx` 负责：

- 接收 `username`、`onClose`、`theme`
- 调用 `useTrashNotes`
- 渲染头部
- 组合 `TrashList` 和 `TrashFeedbackModals`

- [ ] **Step 2: 跑 UI 单测确认通过**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/ui/TrashModal.test.tsx`

Expected: PASS

- [ ] **Step 3: 跑 hook + UI 组合测试**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx src/features/trash/ui/TrashModal.test.tsx`

Expected: PASS

## Chunk 3: 接线替换与回归

### Task 6: 切换 `ProfilePage` 到新 feature 入口

**Files:**
- Modify: `app/components/ProfilePage.tsx`
- Delete: `app/components/TrashPage.tsx`
- Reference: `src/features/trash/ui/TrashModal.tsx`

- [ ] **Step 1: 先写入口回归测试或更新现有测试**

如果已有 `ProfilePage` 覆盖不足，补一个最小测试，至少验证：

- 打开回收站时渲染 `TrashModal`
- 关闭按钮仍然能回到个人中心

测试文件优先放在：

- `app/components/ProfilePage.test.tsx`

如果这一步成本过高，可以将同等回归验证落到 `__tests__/App.test.tsx`。

- [ ] **Step 2: 运行该测试确认失败**

Run: `./node_modules/.bin/jest --runInBand app/components/ProfilePage.test.tsx`

Expected: FAIL，原因是旧入口和新入口不匹配，或测试尚未满足新结构。

- [ ] **Step 3: 修改入口接线**

将：

```tsx
import TrashPage from './TrashPage';
```

改为：

```tsx
import {TrashModal} from '../../src/features/trash/ui/TrashModal';
```

并删除旧 `TrashPage` 文件。

- [ ] **Step 4: 跑入口测试确认通过**

Run: `./node_modules/.bin/jest --runInBand app/components/ProfilePage.test.tsx`

Expected: PASS

### Task 7: 跑完整验证

**Files:**
- Modify: `jest.setup.js`（如果测试 mock 必须补充）
- Verify: `src/features/trash/**`
- Verify: `app/components/ProfilePage.tsx`

- [ ] **Step 1: 跑新增相关测试**

Run: `./node_modules/.bin/jest --runInBand src/features/trash/model/useTrashNotes.test.tsx src/features/trash/ui/TrashModal.test.tsx app/components/ProfilePage.test.tsx`

Expected: PASS

- [ ] **Step 2: 跑全量 Jest**

Run: `./node_modules/.bin/jest --runInBand`

Expected: PASS

- [ ] **Step 3: 跑 TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS

- [ ] **Step 4: 跑 ESLint**

Run: `./node_modules/.bin/eslint app/components/ProfilePage.tsx src/features/trash`

Expected: 0 errors，允许仓库历史 warning 不在本次命令范围内出现。

- [ ] **Step 5: 跑 diff 检查**

Run: `git diff --check`

Expected: PASS

- [ ] **Step 6: 整理提交边界**

建议提交边界：

```bash
git add src/features/trash app/components/ProfilePage.tsx app/components/TrashPage.tsx jest.setup.js app/components/ProfilePage.test.tsx
```

候选提交信息：

```bash
refactor(trash): extract trash feature module
test(trash): cover trash modal flows
```
