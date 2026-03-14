import {
  insertMarkerIntoTextSegments,
  removeAudioMarker,
  removeAudioMarkerFromTextSegments,
  removeImageMarker,
  removeImageMarkerFromTextSegments,
  syncImageMarkersInTextSegments,
  syncImageMarkers,
} from './noteEditorMediaUtils';

describe('noteEditorMediaUtils', () => {
  test('reindexes image markers after deleting a middle image', () => {
    expect(removeImageMarker('a[图片0]b[图片1]c[图片2]', 1, 3)).toBe(
      'a[图片0]bc[图片1]',
    );
  });

  test('reindexes audio markers after deleting the first audio', () => {
    expect(removeAudioMarker('a[音频0]b[音频1]c', 0, 2)).toBe('ab[音频0]c');
  });

  test('appends missing image markers when new images are added', () => {
    expect(
      syncImageMarkers({
        content: '正文[图片0]',
        imageCount: 3,
        isUserDelete: false,
      }),
    ).toBe('正文[图片0]\n[图片1]\n[图片2]');
  });

  test('does not append markers during a user delete operation', () => {
    expect(
      syncImageMarkers({
        content: '正文[图片0]',
        imageCount: 2,
        isUserDelete: true,
      }),
    ).toBe('正文[图片0]');
  });

  test('appends missing image markers into the last formatted segment', () => {
    expect(
      syncImageMarkersInTextSegments({
        content: '正文',
        fontSize: 16,
        imageCount: 1,
        isUserDelete: false,
        textSegments: [{text: '正文', fontSize: 18, isBold: true}],
      }),
    ).toEqual([{text: '正文\n[图片0]', fontSize: 18, isBold: true}]);
  });

  test('normalizes text segments before appending a repaired image marker', () => {
    expect(
      syncImageMarkersInTextSegments({
        content: '\n[图片1]\n正文\n',
        fontSize: 16,
        imageCount: 1,
        isUserDelete: false,
        textSegments: [
          {text: '\n[图片1]\n', fontSize: 18, isBold: true},
          {text: '正文\n', fontSize: 14, isItalic: true},
        ],
      }),
    ).toEqual([{text: '正文\n[图片0]', fontSize: 14, isItalic: true}]);
  });

  test('inserts a media marker into text segments without losing styles', () => {
    expect(
      insertMarkerIntoTextSegments({
        content: 'abcd',
        cursorPosition: 2,
        fontSize: 16,
        marker: '[图片0]',
        textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
      }),
    ).toEqual([{text: 'ab[图片0]cd', fontSize: 18, isBold: true}]);
  });

  test('removes image markers from text segments while preserving remaining styles', () => {
    expect(
      removeImageMarkerFromTextSegments({
        content: 'ab[图片0]cd[图片1]e',
        fontSize: 16,
        imageIndex: 0,
        textSegments: [
          {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
          {text: '[图片1]e', fontSize: 14, isItalic: true},
        ],
        totalImages: 2,
      }),
    ).toEqual([
      {text: 'abcd', fontSize: 18, isBold: true},
      {text: '[图片0]e', fontSize: 14, isItalic: true},
    ]);
  });

  test('trims surrounding blank lines in text segments after deleting the only image marker', () => {
    const nextContent = removeImageMarker('\n[图片0]\n正文\n', 0, 1);
    const nextTextSegments = removeImageMarkerFromTextSegments({
      content: '\n[图片0]\n正文\n',
      fontSize: 16,
      imageIndex: 0,
      textSegments: [
        {text: '\n[图片0]\n', fontSize: 18, isBold: true},
        {text: '正文\n', fontSize: 14, isItalic: true},
      ],
      totalImages: 1,
    });

    expect(nextContent).toBe('正文');
    expect(nextTextSegments).toEqual([
      {text: '正文', fontSize: 14, isItalic: true},
    ]);
    expect(nextTextSegments.map(segment => segment.text).join('')).toBe(
      nextContent,
    );
  });

  test('removes audio markers from text segments while preserving remaining styles', () => {
    expect(
      removeAudioMarkerFromTextSegments({
        content: 'a[音频0]bc',
        audioIndex: 0,
        fontSize: 16,
        textSegments: [{text: 'a[音频0]bc', fontSize: 20, color: '#123456'}],
        totalAudios: 1,
      }),
    ).toEqual([{text: 'abc', fontSize: 20, color: '#123456'}]);
  });

  test('collapses cross-segment blank lines after deleting an audio marker', () => {
    const nextContent = removeAudioMarker('开头\n[音频0]\n\n结尾', 0, 1);
    const nextTextSegments = removeAudioMarkerFromTextSegments({
      audioIndex: 0,
      content: '开头\n[音频0]\n\n结尾',
      fontSize: 16,
      textSegments: [
        {text: '开头\n[音频0]\n', fontSize: 18, color: '#123456'},
        {text: '\n结尾', fontSize: 20, isItalic: true},
      ],
      totalAudios: 1,
    });

    expect(nextContent).toBe('开头\n结尾');
    expect(nextTextSegments).toEqual([
      {text: '开头\n', fontSize: 18, color: '#123456'},
      {text: '结尾', fontSize: 20, isItalic: true},
    ]);
    expect(nextTextSegments.map(segment => segment.text).join('')).toBe(
      nextContent,
    );
  });

  test('preserves spaces after a collapsed blank line when removing audio markers', () => {
    const nextContent = removeAudioMarker('开头\n[音频0]\n\n 结尾', 0, 1);
    const nextTextSegments = removeAudioMarkerFromTextSegments({
      audioIndex: 0,
      content: '开头\n[音频0]\n\n 结尾',
      fontSize: 16,
      textSegments: [
        {text: '开头\n[音频0]\n', fontSize: 18, color: '#123456'},
        {text: '\n 结尾', fontSize: 20, isItalic: true},
      ],
      totalAudios: 1,
    });

    expect(nextContent).toBe('开头\n 结尾');
    expect(nextTextSegments).toEqual([
      {text: '开头\n', fontSize: 18, color: '#123456'},
      {text: ' 结尾', fontSize: 20, isItalic: true},
    ]);
    expect(nextTextSegments.map(segment => segment.text).join('')).toBe(
      nextContent,
    );
  });
});
