# 回收站 Feature 重构设计

## 背景

当前回收站能力已经不再直连旧 OSS，数据边界主要通过 `TrashProvider` 和 `NoteSyncProvider` 管理。但页面实现仍停留在 `app/components/TrashPage.tsx`，单文件同时承担：

- 页面壳和导航关闭行为
- 加载、刷新、恢复、彻底删除状态
- 列表、空态、加载态渲染
- 确认弹窗和成功反馈弹窗
- 局部调试日志

这导致文件职责混杂，也让 `ProfilePage` 继续依赖旧目录中的大页面组件。

## 目标

本轮只完成一轮最小可提交的结构重构，并允许顺手修复 1 到 2 个明显问题：

- 将回收站页面迁入 `src/features/trash/**`
- 将回收站数据读写和页面状态抽到独立 hook
- 拆分列表区和反馈弹窗，缩小单文件职责
- 去掉页面中的调试 `console.log`
- 将“恢复成功 / 删除成功”统一为一套反馈状态表达

## 非目标

本轮不做以下事项：

- 不修改 `TrashProvider` 接口
- 不调整 `localNoteStore` 的存储结构
- 不重做回收站 UI 视觉设计
- 不将 `ProfilePage` 一并做大规模 feature 化拆分
- 不引入全局 toast / snackbar 反馈体系

## 推荐方案

采用“feature 迁移 + 状态下沉 + 反馈收口”的中间方案。

原因：

- 当前 provider 边界已经足够支撑页面重构，不需要再向下挖基础设施
- `TrashPage` 的主要问题是页面层职责过多，优先拆页面最划算
- 将成功反馈合并成统一状态，可以在不扩大改动面的情况下减少重复 modal flag

## 目标结构

### 组件边界

- `src/features/trash/ui/TrashModal.tsx`
  - 回收站页面壳
  - 负责头部、关闭、主题接线
  - 组合列表区和反馈弹窗

- `src/features/trash/ui/TrashList.tsx`
  - 负责 loading、空态、列表渲染
  - 不直接访问 provider
  - 通过 props 接收操作回调

- `src/features/trash/ui/TrashFeedbackModals.tsx`
  - 负责恢复确认、删除确认、操作成功提示
  - 成功提示共用一套状态输入，不分散成多个布尔值

### 状态边界

- `src/features/trash/model/useTrashNotes.ts`
  - 负责加载回收站列表
  - 负责下拉刷新
  - 负责恢复笔记
  - 负责彻底删除笔记
  - 负责确认弹窗状态
  - 负责统一成功反馈状态

### 入口接线

- `app/components/ProfilePage.tsx`
  - 保留打开 / 关闭回收站 modal 的入口状态
  - 将旧 `TrashPage` 引用改为新 `TrashModal`
  - 不在本轮承担回收站业务逻辑

## 关键数据流

### 加载

1. `TrashModal` 接收 `username` 和 `theme`
2. `useTrashNotes` 在用户名有效时调用 `trashProvider.listNotes(username)`
3. hook 输出 `notes`、`isLoading`、`isRefreshing`
4. `TrashList` 纯渲染这些状态

### 恢复

1. 列表点击“恢复”
2. hook 记录当前选中笔记，并打开确认弹窗
3. 用户确认后：
   - 调用 `trashProvider.restoreNote(username, noteId)`
   - 调用 `noteSyncProvider.pullNotes(username)`
   - 将恢复结果插回普通笔记列表
   - 从本地回收站列表状态移除该条目
4. hook 将成功反馈状态更新为统一的 `successFeedback`

### 彻底删除

1. 列表点击“彻底删除”
2. hook 记录当前选中笔记，并打开确认弹窗
3. 用户确认后调用 `trashProvider.deleteNote(username, noteId)`
4. 本地列表移除该条目
5. hook 更新统一成功反馈状态

## 状态设计

当前页面有多组重复状态：

- `restoreModalVisible`
- `deleteModalVisible`
- `restoreSuccessModalVisible`
- `deleteSuccessModalVisible`
- `selectedNote`

重构后收敛为：

- `activeAction: 'restore' | 'delete' | null`
- `selectedNote: Note | null`
- `successFeedback: 'restore' | 'delete' | null`
- `notes`
- `isLoading`
- `isRefreshing`

这样能减少重复布尔值，并明确“当前正在确认什么操作”和“最近一次成功的是哪类操作”。

## 错误处理

- 保持现有用户可见行为：恢复失败和删除失败仍使用 `Alert.alert`
- provider 返回空值时，恢复流程抛出显式错误，不静默吞掉
- hook 统一记录错误日志，删除页面层调试日志

## 兼容性约束

- 保持 `ProfilePage` 的打开方式不变，避免牵连更多个人中心逻辑
- 保持主题色入参形式不变，沿用现有 `theme` 对象
- 保持回收站列表展示字段不变：标题、内容摘要、删除时间、恢复/删除按钮

## 测试策略

### 单元 / hook 测试

- 为 `useTrashNotes` 补测试：
  - 加载成功
  - 下拉刷新
  - 恢复成功后更新普通笔记和回收站列表
  - 删除成功后更新回收站列表
  - 恢复失败 / 删除失败时触发错误处理

### 组件测试

- 为 `TrashModal` 补测试：
  - loading 渲染
  - 空态渲染
  - 列表渲染
  - 点击恢复 / 删除时弹出确认框
  - 成功反馈文案随 `successFeedback` 变化

### 回归验证

- `ProfilePage` 中可以继续打开和关闭回收站
- TypeScript、Jest、ESLint 不新增 error

## 提交拆分建议

为了保持每笔提交语义清晰，建议至少拆成两笔：

1. `refactor(trash): extract trash feature module`
   - 新增 `src/features/trash/**`
   - `ProfilePage` 接线切换
   - 旧 `TrashPage` 删除

2. `test(trash): cover trash hook and modal flows`
   - 回收站 hook / UI 测试
   - 必要的 jest mock 调整

如果接线和测试无法自然拆开，也可以合并成一笔，但必须保证提交信息能准确表达“feature 抽取 + 状态收口”。

## 风险

- 恢复流程同时触达回收站 provider 和普通笔记同步 provider，hook 抽取时容易漏掉顺序
- 成功提示状态合并后，如果自动关闭计时没有收好，可能出现提示不消失或串提示
- `ProfilePage` 仍然较大，本轮只改入口接线，不能顺手继续扩改

## 完成标准

- 回收站不再从 `app/components/TrashPage.tsx` 提供实现
- `src/features/trash/**` 成为唯一页面实现入口
- 回收站页面状态由 hook 管理，不再由单个大组件直接编排
- 页面中的调试 `console.log` 被移除
- 成功反馈状态收敛为统一表达
- 相关测试通过，现有行为不回退
