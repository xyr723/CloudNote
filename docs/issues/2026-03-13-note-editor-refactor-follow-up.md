# Issue Draft: 收口 note-editor 拆分并恢复编译

## 背景

CloudNote 正在从“页面直连存储/AI/附件”的旧结构迁移到 `local-first + provider + feature` 架构。

当前已完成的主线重构：

- `be54db7` `docs(readme): 更新重构路线与架构说明`
- `cee7a7a` `refactor(core): 引入本地优先 provider 架构`
- `443fd2d` `refactor(editor): 移除旧 OSS 附件链路`
- `f448499` `refactor(home): extract home feature module`
- `30f4446` `wip(note-editor): start extracting editor ui modules`

当前用于继续开发的远程分支：

- `origin/wip/editor-split-20260313`

## 当前状态

### 已完成

- `App.tsx` 已收缩为路由壳，首页主业务迁入 `src/features/home/**`
- 旧 OSS 附件主流程已移除，改为走 attachment provider
- 已新增 `src/features/note-editor/ui/**`，开始拆出编辑器内容区、工具栏、辅助模态框和样式

### 未完成

- `app/components/EditNotePage.tsx` 仍处于半迁移状态
- 新的 `note-editor` 组件已引入，但旧 JSX 仍大量保留
- 当前代码 **不能通过 TypeScript 编译**

## 当前阻塞

2026-03-13 本地执行：

```bash
./node_modules/.bin/tsc --noEmit
```

结果失败，主要错误如下：

```text
app/components/EditNotePage.tsx(25,10): error TS2440: Import declaration conflicts with local declaration of 'styles'.
app/components/EditNotePage.tsx(678,20): error TS2552: Cannot find name 'Image'. Did you mean 'images'?
app/components/EditNotePage.tsx(917,24): error TS2304: Cannot find name 'ActivityIndicator'.
app/components/EditNotePage.tsx(1009,16): error TS2304: Cannot find name 'ActivityIndicator'.
app/components/EditNotePage.tsx(1050,16): error TS2304: Cannot find name 'ActivityIndicator'.
app/components/EditNotePage.tsx(1112,16): error TS2304: Cannot find name 'StyleSheet'.
src/features/note-editor/ui/EditNoteContent.tsx(79,11): error TS2769: No overload matches this call.
src/features/note-editor/ui/EditNoteContent.tsx(161,13): error TS2769: No overload matches this call.
```

## 根因判断

### 1. `EditNotePage.tsx` 半迁移

- 顶部已引入：
  - `EditNoteContent`
  - `EditNoteToolbar`
  - `EditNoteAuxiliaryModals`
  - `src/features/note-editor/ui/styles`
- 但旧的以下代码块还在：
  - 老的 `renderContent()`
  - 老的 toolbar JSX
  - 老的图片/AI/保存状态模态框 JSX
  - 老的 `StyleSheet.create(...)`
- 顶部已移除了 `Image`、`ActivityIndicator`、`StyleSheet` import，但旧 JSX 仍在引用它们
- 新导入的 `styles` 与文件底部旧的本地 `styles` 命名冲突

### 2. `EditNoteContent.tsx` 类型收口不完整

- `createTextInputStyle()` 返回的样式对象中：
  - `fontWeight`
  - `fontStyle`
- 目前被推断成普通 `string`
- `TextInput` 需要更严格的 `TextStyle` 联合字面量类型，导致 `TS2769`

## 建议继续顺序

1. 先收口 `app/components/EditNotePage.tsx`
2. 再修 `src/features/note-editor/ui/EditNoteContent.tsx` 的样式类型
3. 跑 `./node_modules/.bin/tsc --noEmit`
4. 通过后再决定是否继续把编辑器状态拆成 hooks

## 具体待办

### P0

- [ ] 用 `EditNoteContent` 替换 `EditNotePage.tsx` 里的旧内容渲染区
- [ ] 用 `EditNoteToolbar` 替换旧 toolbar JSX
- [ ] 用 `EditNoteAuxiliaryModals` 替换旧图片/AI/保存提示模态框
- [ ] 删除 `EditNotePage.tsx` 底部旧 `StyleSheet.create(...)`
- [ ] 解决 `styles` 命名冲突
- [ ] 修复 `EditNoteContent.tsx` 中 `TextInput` 的 style 类型报错
- [ ] 重新执行 `./node_modules/.bin/tsc --noEmit`

### P1

- [ ] 继续把编辑器状态拆出 `useNoteMedia`
- [ ] 继续把录音逻辑拆出 `useNoteRecording`
- [ ] 继续把文字格式逻辑拆出 `useNoteFormatting`

## 关闭条件

- `./node_modules/.bin/tsc --noEmit` 通过
- `EditNotePage.tsx` 只保留容器和状态编排，不再包含大段重复 JSX
- `src/features/note-editor/ui/**` 成为实际渲染入口，而不是只完成 import
- 工作区无额外脏改动，除 `.serena/` 外可正常提交

## 备注

- `.serena/` 当前是未跟踪目录，不要提交
- `gh auth status` 当前显示默认账号 token 已失效，所以本机未能直接创建线上 Issue
- 如果要正式创建 GitHub Issue，可在新的电脑上重新登录 `gh` 后执行：

```bash
gh issue create \
  --title "收口 note-editor 拆分并恢复编译" \
  --body-file docs/issues/2026-03-13-note-editor-refactor-follow-up.md
```
