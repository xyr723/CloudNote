import type {
  AiCompletionResult,
  AiProvider,
  CompleteDocumentInput,
  GenerateWidgetsInput,
} from '../aiProvider';
import type {
  WidgetLayout,
  WidgetSchema,
  WidgetType,
} from '../../../entities/widget/types';

type OpenAiCompatibleConfig = {
  apiUrl: string;
  apiKey: string;
  model: string;
};

type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const WIDGET_TYPES: WidgetType[] = [
  'todo-list',
  'action-card',
  'form',
  'quote',
  'metric',
  'timeline',
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isChatCompletionResponse = (
  value: unknown,
): value is ChatCompletionResponse => {
  return isObjectRecord(value) && Array.isArray(value.choices);
};

const parseWidgetSpan = (value: unknown): WidgetLayout['span'] => {
  return value === 1 || value === 2 || value === 3 || value === 4
    ? value
    : undefined;
};

const buildCompletionMessages = (
  input: CompleteDocumentInput,
): ChatMessage[] => {
  return [
    {
      role: 'system',
      content:
        '你是 CloudNote 的写作助手。请返回纯文本补全文本，不要输出 Markdown 代码块。',
    },
    {
      role: 'user',
      content: [
        `用户要求：${input.prompt}`,
        `现有内容：${input.existingContent || '当前内容为空'}`,
      ].join('\n\n'),
    },
  ];
};

const buildWidgetMessages = (input: GenerateWidgetsInput): ChatMessage[] => {
  const maxWidgets = input.maxWidgets ?? 3;

  return [
    {
      role: 'system',
      content: [
        '你是 CloudNote 的 Widget 生成助手。',
        '请输出 JSON 数组，不要输出 Markdown。',
        `组件类型只能从以下值中选择：${WIDGET_TYPES.join(', ')}`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `需求：${input.prompt}`,
        `现有内容：${input.existingContent || '无'}`,
        `最多生成 ${maxWidgets} 个组件`,
      ].join('\n\n'),
    },
  ];
};

const createFallbackWidget = (description: string): WidgetSchema => {
  return {
    id: 'openai-compatible-fallback-widget',
    type: 'action-card',
    title: 'AI 生成结果',
    description,
    props: {
      body: description,
    },
    layout: {
      span: 2,
      minHeight: 180,
    },
  };
};

const mapWidgetSchema = (
  value: Record<string, unknown>,
  index: number,
): WidgetSchema | null => {
  const type = value.type;

  if (typeof type !== 'string' || !WIDGET_TYPES.includes(type as WidgetType)) {
    return null;
  }

  const title = typeof value.title === 'string' ? value.title : undefined;
  const description =
    typeof value.description === 'string' ? value.description : undefined;
  const props = isObjectRecord(value.props) ? value.props : undefined;
  const layout = isObjectRecord(value.layout)
    ? {
        span: parseWidgetSpan(value.layout.span),
        minHeight:
          typeof value.layout.minHeight === 'number'
            ? value.layout.minHeight
            : undefined,
      }
    : undefined;

  return {
    id: typeof value.id === 'string' ? value.id : `widget-${index + 1}`,
    type: type as WidgetType,
    title,
    description,
    props,
    layout,
  };
};

const parseWidgetSchemas = (content: string): WidgetSchema[] | null => {
  try {
    const parsed: unknown = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const widgets = parsed
      .filter(isObjectRecord)
      .map(mapWidgetSchema)
      .filter((widget): widget is WidgetSchema => widget !== null);

    return widgets.length > 0 ? widgets : null;
  } catch (_error) {
    return null;
  }
};

const extractCompletionText = (value: unknown): string => {
  if (!isChatCompletionResponse(value)) {
    throw new Error('AI 响应格式不正确');
  }

  const content = value.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('AI 响应为空');
  }

  return content;
};

export class OpenAiCompatibleAiProvider implements AiProvider {
  constructor(private readonly config: OpenAiCompatibleConfig) {}

  private async request(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`);
    }

    const data: unknown = await response.json();
    return extractCompletionText(data);
  }

  async completeDocument(
    input: CompleteDocumentInput,
  ): Promise<AiCompletionResult> {
    const text = await this.request(buildCompletionMessages(input));

    return {
      text,
      metadata: {
        provider: 'openai-compatible',
        model: this.config.model,
        usedFallback: false,
      },
    };
  }

  async generateWidgets(input: GenerateWidgetsInput): Promise<WidgetSchema[]> {
    const content = await this.request(buildWidgetMessages(input));
    return parseWidgetSchemas(content) ?? [createFallbackWidget(content)];
  }
}
