const mockCompleteDocument = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAiProvider: () => ({
      completeDocument: mockCompleteDocument,
    }),
  },
}));

import {completeNoteEditorTextWithAi} from './noteEditorAi';

test('completes note editor text through ai provider', async () => {
  mockCompleteDocument.mockResolvedValue({
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
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });

  await expect(
    completeNoteEditorTextWithAi('已有内容', '继续写下去'),
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
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });

  expect(mockCompleteDocument).toHaveBeenCalledWith({
    existingContent: '已有内容',
    prompt: '继续写下去',
  });
});
