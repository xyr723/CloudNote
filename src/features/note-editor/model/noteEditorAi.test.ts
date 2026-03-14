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
    metadata: {
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });

  await expect(
    completeNoteEditorTextWithAi('已有内容', '继续写下去'),
  ).resolves.toBe('补全文本');

  expect(mockCompleteDocument).toHaveBeenCalledWith({
    existingContent: '已有内容',
    prompt: '继续写下去',
  });
});
