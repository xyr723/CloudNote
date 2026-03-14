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
