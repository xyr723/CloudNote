import {createNoteDocumentMirrorInput} from './noteEditorDocument';

describe('noteEditorDocument', () => {
  test('normalizes media markers into preview-friendly mirror text', () => {
    expect(
      createNoteDocumentMirrorInput('开头[图片0]中间[音频1]结尾'),
    ).toBe('开头\n\n图片占位 1\n\n中间\n\n音频占位 2\n\n结尾');
  });
});
