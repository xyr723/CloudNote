# Note Editor H5 Toolbar Bridge 设计

## 背景

当前 `NoteEditorModal` 已经具备：

- H5 正文编辑模式
- `content + textSegments` 的本地双向同步
- 媒体 marker 占位协议

但 H5 编辑态仍有一个明显缺口：

- 原生工具栏的粗体 / 斜体按钮只在原生编辑态可用
- 进入 H5 模式后，用户无法继续对当前选中文本执行局部格式化

这意味着 H5 模式虽然已经能保留已有富文本片段，但还不能承担最基本的富文本编辑闭环。

## 目标

本轮只做最小的工具栏格式化桥接：

- 让 `NoteEditorModal` 在 H5 模式下继续显示现有工具栏
- 原生工具栏中的粗体 / 斜体按钮可以向 WebView 下发命令
- WebView 在当前选区执行格式化后，继续通过现有 `content + textSegments` 协议回写 RN
- 不引入新的 H5 内部工具栏 UI

## 非目标

本轮不做以下事项：

- 不桥接字号加减
- 不做 H5 选区到 RN 的实时同步
- 不支持图片 / 音频新增删除
- 不引入 `document.execCommand` 之外的新编辑器内核
- 不接 Widget Registry

## 方案对比

### 方案 A：H5 模式隐藏格式化能力

优点：

- 没有额外实现成本

缺点：

- H5 编辑能力不完整
- 用户切到 H5 后会失去最基础的局部格式化能力

### 方案 B：只桥接粗体 / 斜体

优点：

- 范围最小
- 能闭环当前最核心的局部富文本编辑
- 可复用现有 `content + textSegments` 回写协议

缺点：

- 字号仍然只在原生编辑态可用
- 工具栏高亮状态在 H5 模式下只能做弱一致，不做实时选区感知

### 方案 C：一次桥接粗体 / 斜体 / 字号 / 选区状态

优点：

- 更接近最终统一编辑体验

缺点：

- 会把本轮范围扩大到选区同步、命令状态同步和段落样式策略
- 回归面明显变大

## 推荐方案

采用方案 B：只桥接粗体 / 斜体。

原因：

- 它能在最小复杂度下补齐 H5 编辑闭环中的关键缺口
- 不需要在本轮引入实时选区同步
- 后续如果要接字号桥接，这套命令通路可以直接复用

## 结构调整

### H5 feature

- `src/features/h5-editor/model/h5TextEditorBridge.ts`
  - 增加 RN -> WebView 的最小格式化命令脚本生成
  - 支持 `bold` / `italic`
  - 执行命令后主动触发一次现有序列化回写

- `src/features/h5-editor/ui/H5TextDocumentEditor.tsx`
  - 接收一次性格式化命令输入
  - 命令变化时通过 `injectJavaScript` 下发给 WebView

### note-editor

- `src/features/note-editor/ui/NoteEditorModal.tsx`
  - H5 模式下继续渲染现有工具栏
  - 粗体 / 斜体按钮改为下发 H5 命令
  - 图片、录音、字号、AI 等按钮仍维持当前行为边界

## 数据流

1. 用户切到 H5 模式
2. 点击原生工具栏中的粗体或斜体按钮
3. RN 更新一次命令状态，并传给 `H5TextDocumentEditor`
4. `H5TextDocumentEditor` 向 WebView 注入对应格式化脚本
5. WebView 对当前选区执行格式化
6. WebView 复用现有序列化逻辑回写 `content + textSegments`
7. RN 用回写结果更新笔记状态

## 风险

- `document.execCommand` 在长期上不是理想方案，但当前对 `WebView` 内最小桥接足够可用
- 不做实时选区同步时，工具栏按钮高亮不能精准反映 H5 当前选区状态
- 浏览器执行粗体 / 斜体后可能产生额外嵌套节点，需要继续依赖已有序列化归并逻辑

## 完成标准

- H5 模式下点击粗体按钮后，当前选中文本能回写为 `isBold` segment
- H5 模式下点击斜体按钮后，当前选中文本能回写为 `isItalic` segment
- 命令执行后仍能保留媒体 marker 协议
- 新增测试通过，且相关回归通过
