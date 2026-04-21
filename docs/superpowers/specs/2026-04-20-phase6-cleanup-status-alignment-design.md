# Phase 6 清理与状态对齐设计

## 背景

主链重构的大部分结构性工作已经完成：

- 编辑器入口、回收站、认证、个人中心都已迁入 `src/features/**`
- provider registry、H5 预览、widget renderer / editor、live document mirror 已经落地
- `./node_modules/.bin/tsc --noEmit` 当前可以通过

但 `Phase 6：收口` 仍有几处低风险遗留项没有处理干净：

- 仓库里还保留了两个旧 `app/**` 兼容 shim
- `package.json` 里还留着明显无人引用的废弃依赖
- `README.md` 的部分“当前状态”描述仍停留在旧实现，不完全等于当前代码

这些问题不会立刻阻塞编译，但会持续制造误导，降低后续推进 Expo 迁移和 H5 主链收口时的判断质量。

## 目标

本轮只做一轮最小、可验证的主链收口：

1. 删除已无引用的旧兼容入口
2. 从依赖清单中移除明显废弃且无人使用的包
3. 更新 `README.md`，让“当前状态”反映现状
4. 增加最小回归测试，防止这些遗留物被重新引入

## 非目标

本轮明确不做以下事情：

- 不启动 Expo / Expo Router 迁移
- 不做 H5 编辑器内部文件选择器、拖拽上传、粘贴上传
- 不做 H5 widget 内联编辑、拖拽排序、正文任意位置插入
- 不重写认证存储协议或密码迁移逻辑
- 不借机做无关目录重构

## 方案比较

### 方案 A：只改 README

优点：

- 风险最低
- 修改最少

缺点：

- 死代码和废弃依赖继续留在仓库里
- Phase 6 的“删除旧目录与废弃依赖”依然没有实际进展

### 方案 B：低风险收口清理

做法：

- 删除无引用 shim
- 移除无引用依赖
- 更新 `README.md`
- 增加 repo-state 回归测试

优点：

- 真实推进 `Phase 6`
- 不碰主业务逻辑
- 可用测试和类型检查直接验证

缺点：

- 会引入一类“仓库状态型”测试，而不是纯业务测试

### 方案 C：继续推进更大的主链重构

做法：

- 直接开始 Expo 迁移，或继续做 H5 document-first / widget 内联编辑

优点：

- 功能推进更快

缺点：

- 范围过大
- 当前文档和仓库状态本身尚未对齐，继续往前推会放大误判

## 结论

采用 **方案 B：低风险收口清理**。

原因：

- 它是当前剩余主链问题里最确定、最小、最不容易回滚失败的一段
- 它能让后续更大的子项目（Expo / H5-only / widget inline editing）建立在更干净的仓库状态上
- 它不改变现有运行时行为，适合一口气完成

## 详细设计

### 1. 删除旧兼容 shim

目标文件：

- `app/utils/chatComplete.ts`
- `app/theme/colors.ts`

判断依据：

- 全仓库搜索没有任何引用
- 真实实现已分别落到 `src/providers/**` 与 `src/shared/theme/**`

处理原则：

- 直接删除，不再保留兼容出口
- 不新增新的转发层

### 2. 清理废弃依赖

目标依赖：

- `axios`
- `md5`
- `@types/md5`

判断依据：

- 当前源码中没有任何引用
- 其中 `md5` 与项目安全基线方向不一致，继续保留只会增加误导

处理原则：

- 只更新 `package.json`
- 本轮不主动手改 `yarn.lock`
- 后续真正执行安装或升级依赖时，再让 lock 自然收敛

### 3. 对齐 README 当前状态

需要修正两类信息：

1. 当前已完成项

- 明确旧 `app/**` shim 已清理
- 明确预览态当前直接消费 live `draft.document`

2. 后续建议

- 保留真正未完成的大项
- 避免继续描述已经落地或已经失真的中间态

处理原则：

- 只修正文档事实，不借机重写整份 README
- 以“当前代码实际行为”为准，不以旧计划文本为准

### 4. 增加最小回归测试

新增一个 repo-state 测试文件，覆盖：

- 旧 `app/**` shim 不存在
- `package.json` 不再包含本轮清理的废弃依赖
- `README.md` 已改成当前实现描述

测试价值：

- 这轮改动本身几乎都是“结构清理”，缺少自然的业务回归点
- 用最小仓库状态测试可以把这轮收口目标钉死，防止后续回退

## 影响范围

### 修改

- `README.md`
- `package.json`

### 删除

- `app/utils/chatComplete.ts`
- `app/theme/colors.ts`

### 新增

- `src/shared/config/refactorPhase6Cleanup.test.ts`

## 验证

本轮验证只做最小必要集：

1. `./node_modules/.bin/jest --runInBand src/shared/config/refactorPhase6Cleanup.test.ts`
2. `./node_modules/.bin/tsc --noEmit`

## 风险与控制

风险很低，主要在两点：

1. 误删仍有隐式引用的兼容 shim
2. README 表述更新不准确

控制方式：

- 删除前先做全仓库引用确认
- 用 repo-state 测试约束结果
- 最终再跑一次类型检查确认没有残留引用
