import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useNoteFormatting} from './useNoteFormatting';

test('persists italic formatting into text segments for selected text', async () => {
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  const note = {
    content: 'abcd',
    fontSize: 16,
    textSegments: [{text: 'abcd', fontSize: 16, isItalic: false}],
  };
  let latestFormatting: ReturnType<typeof useNoteFormatting> | null = null;

  const Probe = () => {
    latestFormatting = useNoteFormatting({
      note,
      onChangeContent,
      onChangeTextSegments,
    });

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleEditorSelectionChange({start: 1, end: 3}, 3);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleToggleItalic();
  });

  expect(latestFormatting).not.toBeNull();

  expect(onChangeContent).toHaveBeenCalledWith('abcd');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'a', fontSize: 16, isItalic: false},
    {text: 'bc', fontSize: 16, isItalic: true},
    {text: 'd', fontSize: 16, isItalic: false},
  ]);
  expect(latestFormatting!.textSegments).toEqual([
    {text: 'a', fontSize: 16, isItalic: false},
    {text: 'bc', fontSize: 16, isItalic: true},
    {text: 'd', fontSize: 16, isItalic: false},
  ]);
});

test('replaces full text content and collapses text segments for h5 sync', async () => {
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  const note = {
    content: '原文',
    fontSize: 16,
    textSegments: [
      {text: '原', fontSize: 18, isItalic: true, color: '#123456'},
      {text: '文', fontSize: 18, isBold: true},
    ],
  };
  let latestFormatting: ReturnType<typeof useNoteFormatting> | null = null;

  const Probe = () => {
    latestFormatting = useNoteFormatting({
      note,
      onChangeContent,
      onChangeTextSegments,
    });

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleReplaceTextContent('H5正文');
  });

  expect(onChangeContent).toHaveBeenCalledWith('H5正文');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: 'H5正文',
      fontSize: 16,
      isItalic: true,
      color: '#123456',
    },
  ]);
  expect(latestFormatting!.textSegments).toEqual([
    {
      text: 'H5正文',
      fontSize: 16,
      isItalic: true,
      color: '#123456',
    },
  ]);
});

test('replaces rich text content and preserves multiple text segments for h5 sync', async () => {
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  const note = {
    content: '原文',
    fontSize: 16,
    textSegments: [{text: '原文', fontSize: 18, isItalic: true}],
  };
  let latestFormatting: ReturnType<typeof useNoteFormatting> | null = null;

  const Probe = () => {
    latestFormatting = useNoteFormatting({
      note,
      onChangeContent,
      onChangeTextSegments,
    });

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleReplaceRichTextContent({
      content: 'H5正文',
      textSegments: [
        {text: 'H5', fontSize: 20, isItalic: true},
        {text: '正文', fontSize: 20, isBold: true},
      ],
    });
  });

  expect(onChangeContent).toHaveBeenCalledWith('H5正文');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'H5', fontSize: 20, isItalic: true},
    {text: '正文', fontSize: 20, isBold: true},
  ]);
  expect(latestFormatting!.textSegments).toEqual([
    {text: 'H5', fontSize: 20, isItalic: true},
    {text: '正文', fontSize: 20, isBold: true},
  ]);
});

test('increases global font size and syncs all text segments', async () => {
  const onChangeFontSize = jest.fn();
  const onChangeTextSegments = jest.fn();
  const note = {
    content: '原文',
    fontSize: 16,
    textSegments: [
      {text: '原', fontSize: 14, isItalic: true},
      {text: '文', fontSize: 20, isBold: true},
    ],
  };
  let latestFormatting: ReturnType<typeof useNoteFormatting> | null = null;

  const Probe = () => {
    latestFormatting = useNoteFormatting({
      note,
      onChangeContent: () => {},
      onChangeFontSize,
      onChangeTextSegments,
    });

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleIncreaseFontSize();
  });

  expect(onChangeFontSize).toHaveBeenCalledWith(18);
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
  expect(latestFormatting!.fontSize).toBe(18);
  expect(latestFormatting!.textSegments).toEqual([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
});

test('emits a unified state patch when formatting changes font size', async () => {
  const onChangeState = jest.fn();
  const note = {
    content: '原文',
    fontSize: 16,
    textSegments: [
      {text: '原', fontSize: 14, isItalic: true},
      {text: '文', fontSize: 20, isBold: true},
    ],
  };
  let latestFormatting: ReturnType<typeof useNoteFormatting> | null = null;

  const Probe = () => {
    latestFormatting = useNoteFormatting({
      note,
      onChangeState,
    } as any);

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  await ReactTestRenderer.act(() => {
    latestFormatting?.handleIncreaseFontSize();
  });

  expect(onChangeState).toHaveBeenCalledWith({
    content: '原文',
    fontSize: 18,
    textSegments: [
      {text: '原', fontSize: 18, isItalic: true},
      {text: '文', fontSize: 18, isBold: true},
    ],
  });
});
