import {OpenAiCompatibleAiProvider} from './openAiCompatibleAiProvider';

const mockFetch = jest.fn();

const createJsonResponse = (content: string) => ({
  ok: true,
  json: async () => ({
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  }),
});

describe('OpenAiCompatibleAiProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  test('completeDocument returns text and widgets when both requests succeed', async () => {
    mockFetch
      .mockResolvedValueOnce(createJsonResponse('补全文本'))
      .mockResolvedValueOnce(
        createJsonResponse(
          JSON.stringify([
            {
              id: 'todo-1',
              type: 'todo-list',
              title: '待办',
              props: {
                items: ['一', '二'],
              },
            },
          ]),
        ),
      );

    const provider = new OpenAiCompatibleAiProvider({
      apiUrl: 'https://example.com',
      apiKey: 'test-key',
      model: 'test-model',
    });

    await expect(
      provider.completeDocument({
        existingContent: '原文',
        prompt: '继续补全',
      }),
    ).resolves.toEqual({
      text: '补全文本',
      widgets: [
        {
          id: 'todo-1',
          type: 'todo-list',
          title: '待办',
          props: {
            items: ['一', '二'],
          },
        },
      ],
      metadata: {
        provider: 'openai-compatible',
        model: 'test-model',
        usedFallback: false,
      },
    });
  });

  test('completeDocument returns text only when widget request fails', async () => {
    mockFetch
      .mockResolvedValueOnce(createJsonResponse('补全文本'))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    const provider = new OpenAiCompatibleAiProvider({
      apiUrl: 'https://example.com',
      apiKey: 'test-key',
      model: 'test-model',
    });

    await expect(
      provider.completeDocument({
        existingContent: '原文',
        prompt: '继续补全',
      }),
    ).resolves.toEqual({
      text: '补全文本',
      metadata: {
        provider: 'openai-compatible',
        model: 'test-model',
        usedFallback: false,
      },
    });
  });

  test('completeDocument rejects when text request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const provider = new OpenAiCompatibleAiProvider({
      apiUrl: 'https://example.com',
      apiKey: 'test-key',
      model: 'test-model',
    });

    await expect(
      provider.completeDocument({
        existingContent: '原文',
        prompt: '继续补全',
      }),
    ).rejects.toThrow('AI 请求失败: 500');
  });
});
