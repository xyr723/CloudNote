import {
  getTextSegmentsContent,
  hasSyncedTextSegments,
} from './noteEditorTextSegments';

describe('noteEditorTextSegments', () => {
  test('joins text segments into editor content', () => {
    expect(
      getTextSegmentsContent([
        {text: '前半段', fontSize: 16, isBold: true},
        {text: '[图片0]', fontSize: 18},
        {text: '后半段', fontSize: 14, isItalic: true},
      ]),
    ).toBe('前半段[图片0]后半段');
  });

  test('checks whether text segments stay in sync with content', () => {
    expect(
      hasSyncedTextSegments(
        [{text: '正文[音频0]', fontSize: 16, isBold: true}],
        '正文[音频0]',
      ),
    ).toBe(true);

    expect(
      hasSyncedTextSegments(
        [{text: '旧正文', fontSize: 16, isBold: true}],
        '新正文',
      ),
    ).toBe(false);

    expect(hasSyncedTextSegments(undefined, '正文')).toBe(false);
  });
});
