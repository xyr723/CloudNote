import {StyleSheet, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {renderEditNoteContent} from './EditNoteContent.testUtils';

test('renders split text segments as separate inputs', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      content: 'abcd',
      textSegments: [
        {text: 'a', fontSize: 16, isBold: false},
        {text: 'bc', fontSize: 16, isBold: true},
        {text: 'd', fontSize: 16, isBold: false},
      ],
    },
  });

  const textInputs = renderer.root.findAllByType(TextInput);

  expect(textInputs.map(node => node.props.value)).toEqual(['a', 'bc', 'd']);
  expect(StyleSheet.flatten(textInputs[1].props.style).fontWeight).toBe('bold');
});

test('updates split text segments together with content', async () => {
  const onContentChange = jest.fn();
  const onTextSegmentsChange = jest.fn();
  const renderer = await renderEditNoteContent({
    props: {
      content: 'abcd',
      onContentChange,
      onTextSegmentsChange,
      textSegments: [
        {text: 'a', fontSize: 16, isBold: false},
        {text: 'bc', fontSize: 16, isBold: true},
        {text: 'd', fontSize: 16, isBold: false},
      ],
    },
  });

  const textInputs = renderer.root.findAllByType(TextInput);

  await ReactTestRenderer.act(() => {
    textInputs[1].props.onChangeText('bx');
  });

  expect(onContentChange).toHaveBeenCalledWith('abxd');
  expect(onTextSegmentsChange).toHaveBeenCalledWith([
    {text: 'a', fontSize: 16, isBold: false},
    {text: 'bx', fontSize: 16, isBold: true},
    {text: 'd', fontSize: 16, isBold: false},
  ]);
});

test('emits unified native editor state when text token content changes', async () => {
  const onChangeState = jest.fn();
  const renderer = await renderEditNoteContent({
    props: {
      content: 'abcd',
      onChangeState,
      textSegments: [
        {text: 'a', fontSize: 16, isBold: false},
        {text: 'bc', fontSize: 16, isBold: true},
        {text: 'd', fontSize: 16, isBold: false},
      ],
    } as any,
  });

  const textInputs = renderer.root.findAllByType(TextInput);

  await ReactTestRenderer.act(() => {
    textInputs[1].props.onChangeText('bx');
  });

  expect(onChangeState).toHaveBeenCalledWith({
    content: 'abxd',
    textSegments: [
      {text: 'a', fontSize: 16, isBold: false},
      {text: 'bx', fontSize: 16, isBold: true},
      {text: 'd', fontSize: 16, isBold: false},
    ],
  });
});

test('keeps absolute cursor position when selection changes after image token', async () => {
  const onSelectionChange = jest.fn();
  const renderer = await renderEditNoteContent({
    props: {
      content: '[图片0]ab',
      images: ['file:///image-0.jpg'],
      onSelectionChange,
      textSegments: [{text: '[图片0]ab', fontSize: 16, isBold: false}],
    },
  });

  const textInput = renderer.root.findAllByType(TextInput)[0];

  await ReactTestRenderer.act(() => {
    textInput.props.onSelectionChange({
      nativeEvent: {selection: {start: 1, end: 1}},
    });
  });

  expect(onSelectionChange).toHaveBeenCalledWith({start: 1, end: 1}, 6);
});

test('emits unified native editor state with default text segment from empty state input', async () => {
  const onChangeState = jest.fn();
  const renderer = await renderEditNoteContent({
    props: {
      onChangeState,
    } as any,
  });

  const textInput = renderer.root.findByType(TextInput);

  await ReactTestRenderer.act(() => {
    textInput.props.onChangeText('首行');
  });

  expect(onChangeState).toHaveBeenCalledWith({
    content: '首行',
    textSegments: [
      {
        text: '首行',
        fontSize: 16,
        isBold: false,
        isItalic: false,
        color: '#666666',
      },
    ],
  });
});
