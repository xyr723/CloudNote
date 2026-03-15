import React from 'react';
import {StyleSheet, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  buildContentTokens,
  type TextToken,
} from '../model/noteEditorContentTokens';
import {EditNoteTextTokenInput} from './EditNoteTextTokenInput';
import type {EditableTextSegment} from './types';

const getTextTokenContext = (segments: EditableTextSegment[]) => {
  const tokens = buildContentTokens({
    defaultFontSize: 16,
    defaultIsBold: false,
    defaultIsItalic: false,
    defaultTextColor: '#000000',
    segments,
  });
  const tokenIndex = tokens.findIndex(token => token.type === 'text');
  if (tokenIndex === -1) {
    throw new Error('Expected a text token in test context');
  }

  const token = tokens[tokenIndex];
  if (token.type !== 'text') {
    throw new Error('Expected token to be text');
  }

  return {
    resolvedTextSegments: segments,
    token: token as TextToken,
    tokenIndex,
    tokens,
  };
};

describe('EditNoteTextTokenInput', () => {
  test('renders token style from text token', async () => {
    const context = getTextTokenContext([
      {
        text: '保留样式',
        fontSize: 18,
        isBold: true,
        isItalic: true,
        color: '#123456',
      },
    ]);
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteTextTokenInput
          onContentChange={() => {}}
          onSelectionChange={() => {}}
          resolvedTextSegments={context.resolvedTextSegments}
          token={context.token}
          tokenIndex={context.tokenIndex}
          tokens={context.tokens}
        />,
      );
    });

    const style = StyleSheet.flatten(
      renderer!.root.findByType(TextInput).props.style,
    );

    expect(style.fontSize).toBe(18);
    expect(style.fontWeight).toBe('bold');
    expect(style.fontStyle).toBe('italic');
    expect(style.color).toBe('#123456');
  });

  test('updates content and text segments when text changes', async () => {
    const context = getTextTokenContext([
      {
        text: '[图片0]ab',
        fontSize: 16,
        isBold: false,
      },
    ]);
    const onContentChange = jest.fn();
    const onTextSegmentsChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteTextTokenInput
          onContentChange={onContentChange}
          onSelectionChange={() => {}}
          onTextSegmentsChange={onTextSegmentsChange}
          resolvedTextSegments={context.resolvedTextSegments}
          token={context.token}
          tokenIndex={context.tokenIndex}
          tokens={context.tokens}
        />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByType(TextInput).props.onChangeText('xy');
    });

    expect(onContentChange).toHaveBeenCalledWith('[图片0]xy');
    expect(onTextSegmentsChange).toHaveBeenCalledWith([
      {
        text: '[图片0]xy',
        fontSize: 16,
        isBold: false,
      },
    ]);
  });

  test('converts relative selection to absolute cursor position', async () => {
    const context = getTextTokenContext([
      {
        text: '[图片0]ab',
        fontSize: 16,
        isBold: false,
      },
    ]);
    const onSelectionChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteTextTokenInput
          onContentChange={() => {}}
          onSelectionChange={onSelectionChange}
          resolvedTextSegments={context.resolvedTextSegments}
          token={context.token}
          tokenIndex={context.tokenIndex}
          tokens={context.tokens}
        />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByType(TextInput).props.onSelectionChange({
        nativeEvent: {selection: {start: 1, end: 1}},
      });
    });

    expect(onSelectionChange).toHaveBeenCalledWith({start: 1, end: 1}, 6);
  });
});
