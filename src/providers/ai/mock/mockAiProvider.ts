import type {
  AiCompletionResult,
  AiProvider,
  CompleteDocumentInput,
  GenerateWidgetsInput,
} from '../aiProvider';
import type {WidgetSchema} from '../../../entities/widget/types';

const buildFallbackText = (input: CompleteDocumentInput): string => {
  const existingPreview = input.existingContent.trim().slice(0, 80);
  const normalizedPrompt = input.prompt.trim() || '请继续扩写当前内容';

  return [
    `以下内容为本地降级生成，用于在未接入远端 AI Provider 时保持交互闭环。`,
    `你当前希望 AI 完成的任务是：“${normalizedPrompt}”。`,
    existingPreview
      ? `现有内容摘要：${existingPreview}。建议先抽取主题、补齐背景，再补充案例与结论。`
      : '当前文档内容较少，建议先补充背景、目标、关键步骤和可执行建议。',
    '当远端 AI Provider 接入后，这里会替换为真实模型返回的补全文本。',
  ].join('\n\n');
};

const buildFallbackWidgets = (input: GenerateWidgetsInput): WidgetSchema[] => {
  return [
    {
      id: 'mock-widget-todo',
      type: 'todo-list',
      title: '建议下一步',
      description: '本地 provider 生成的占位交互块',
      props: {
        items: [
          `梳理需求：${input.prompt}`,
          '确认数据结构与组件白名单',
          '接入真实 AI Provider 后替换 mock 实现',
        ],
      },
      layout: {
        span: 2,
        minHeight: 220,
      },
    },
  ];
};

export class MockAiProvider implements AiProvider {
  async completeDocument(
    input: CompleteDocumentInput,
  ): Promise<AiCompletionResult> {
    return {
      text: buildFallbackText(input),
      widgets: buildFallbackWidgets({
        prompt: input.prompt,
        existingContent: input.existingContent,
      }),
      metadata: {
        provider: 'mock',
        model: 'rule-based-fallback',
        usedFallback: true,
      },
    };
  }

  async generateWidgets(input: GenerateWidgetsInput): Promise<WidgetSchema[]> {
    return buildFallbackWidgets(input);
  }
}
