import {
  createDefaultTextSegments,
  toggleBoldForSelection,
  toggleGlobalBold,
} from './noteEditorFormattingUtils';

describe('noteEditorFormattingUtils', () => {
  test('returns provided segments when note already has formatting data', () => {
    const existingSegments = [{text: '正文', fontSize: 18, isBold: true}];

    expect(
      createDefaultTextSegments({
        content: '正文',
        fontSize: 16,
        textSegments: existingSegments,
      }),
    ).toEqual(existingSegments);
  });

  test('falls back to current content when stored segments are out of sync', () => {
    expect(
      createDefaultTextSegments({
        content: '最新正文',
        fontSize: 16,
        textSegments: [{text: '旧正文', fontSize: 18, isBold: true}],
      }),
    ).toEqual([{text: '最新正文', fontSize: 16, isBold: false}]);
  });

  test('toggles all segments when no text is selected', () => {
    expect(
      toggleGlobalBold(
        [
          {text: 'a', fontSize: 16, isBold: false},
          {text: 'b', fontSize: 16},
        ],
        true,
      ),
    ).toEqual([
      {text: 'a', fontSize: 16, isBold: true},
      {text: 'b', fontSize: 16, isBold: true},
    ]);
  });

  test('splits a segment and toggles only the selected text', () => {
    expect(
      toggleBoldForSelection(
        [{text: 'abcd', fontSize: 16, isBold: false}],
        {start: 1, end: 3},
      ),
    ).toEqual({
      content: 'abcd',
      textSegments: [
        {text: 'a', fontSize: 16, isBold: false},
        {text: 'bc', fontSize: 16, isBold: true},
        {text: 'd', fontSize: 16, isBold: false},
      ],
    });
  });
});
