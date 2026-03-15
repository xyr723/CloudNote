import React from 'react';
import {StyleSheet, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {EditNoteEmptyStateInput} from './EditNoteEmptyStateInput';

describe('EditNoteEmptyStateInput', () => {
  test('renders placeholder and style from props', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteEmptyStateInput
          fontSize={18}
          isBold={true}
          isItalic={true}
          onContentChange={() => {}}
          onSelectionChange={() => {}}
          placeholderTextColor="#abcdef"
          textColor="#123456"
        />,
      );
    });

    const textInput = renderer!.root.findByType(TextInput);
    const style = StyleSheet.flatten(textInput.props.style);

    expect(textInput.props.placeholder).toBe('点击此处开始编辑笔记...');
    expect(textInput.props.placeholderTextColor).toBe('#abcdef');
    expect(style.fontSize).toBe(18);
    expect(style.fontWeight).toBe('bold');
    expect(style.fontStyle).toBe('italic');
    expect(style.color).toBe('#123456');
  });

  test('updates content when text changes', async () => {
    const onContentChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteEmptyStateInput
          fontSize={16}
          isBold={false}
          isItalic={false}
          onContentChange={onContentChange}
          onSelectionChange={() => {}}
          placeholderTextColor="#abcdef"
          textColor="#123456"
        />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByType(TextInput).props.onChangeText('空态内容');
    });

    expect(onContentChange).toHaveBeenCalledWith('空态内容');
  });

  test('converts selection to absolute cursor position', async () => {
    const onSelectionChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteEmptyStateInput
          fontSize={16}
          isBold={false}
          isItalic={false}
          onContentChange={() => {}}
          onSelectionChange={onSelectionChange}
          placeholderTextColor="#abcdef"
          textColor="#123456"
        />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByType(TextInput).props.onSelectionChange({
        nativeEvent: {selection: {start: 2, end: 2}},
      });
    });

    expect(onSelectionChange).toHaveBeenCalledWith({start: 2, end: 2}, 2);
  });
});
