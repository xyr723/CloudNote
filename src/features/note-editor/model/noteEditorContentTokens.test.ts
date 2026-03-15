import {
  buildContentTokens,
  getTokenLength,
  getTokenOffsetBeforeIndex,
} from './noteEditorContentTokens';

describe('noteEditorContentTokens', () => {
  test('builds mixed text, image, and audio tokens with text segment offsets', () => {
    const tokens = buildContentTokens({
      defaultFontSize: 16,
      defaultIsBold: false,
      defaultIsItalic: false,
      defaultTextColor: '#000000',
      segments: [
        {
          text: 'ab[图片0]cd',
          fontSize: 18,
          isBold: true,
        },
        {
          text: '[音频1]e',
          fontSize: 14,
          isItalic: true,
          color: '#123456',
        },
      ],
    });

    expect(tokens).toEqual([
      {
        type: 'text',
        segmentIndex: 0,
        segmentTextStart: 0,
        segmentTextEnd: 2,
        text: 'ab',
        fontSize: 18,
        isBold: true,
        isItalic: false,
        color: '#000000',
      },
      {
        type: 'image',
        imageIndex: 0,
        marker: '[图片0]',
      },
      {
        type: 'text',
        segmentIndex: 0,
        segmentTextStart: 7,
        segmentTextEnd: 9,
        text: 'cd',
        fontSize: 18,
        isBold: true,
        isItalic: false,
        color: '#000000',
      },
      {
        type: 'audio',
        audioIndex: 1,
        marker: '[音频1]',
      },
      {
        type: 'text',
        segmentIndex: 1,
        segmentTextStart: 5,
        segmentTextEnd: 6,
        text: 'e',
        fontSize: 14,
        isBold: false,
        isItalic: true,
        color: '#123456',
      },
    ]);
  });

  test('returns token lengths for text and marker tokens', () => {
    const tokens = buildContentTokens({
      defaultFontSize: 16,
      defaultIsBold: false,
      defaultIsItalic: false,
      defaultTextColor: '#000000',
      segments: [{text: 'a[图片0]bc', fontSize: 16, isBold: false}],
    });

    expect(getTokenLength(tokens[0])).toBe(1);
    expect(getTokenLength(tokens[1])).toBe(5);
    expect(getTokenLength(tokens[2])).toBe(2);
  });

  test('returns total token offset before a given token index', () => {
    const tokens = buildContentTokens({
      defaultFontSize: 16,
      defaultIsBold: false,
      defaultIsItalic: false,
      defaultTextColor: '#000000',
      segments: [{text: 'ab[图片0]cd[音频1]e', fontSize: 16, isBold: false}],
    });

    expect(getTokenOffsetBeforeIndex(tokens, 0)).toBe(0);
    expect(getTokenOffsetBeforeIndex(tokens, 2)).toBe(7);
    expect(getTokenOffsetBeforeIndex(tokens, 4)).toBe(14);
  });
});
