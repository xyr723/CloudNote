import React from 'react';
import {StyleSheet, TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {EditNoteAudioBlock} from './EditNoteAudioBlock';
import {EditNoteContent} from './EditNoteContent';
import {EditNoteContentBlocks} from './EditNoteContentBlocks';
import {EditNoteEmptyStateInput} from './EditNoteEmptyStateInput';
import {EditNoteImageBlock} from './EditNoteImageBlock';
import {EditNoteTextTokenInput} from './EditNoteTextTokenInput';

test('renders empty state with EditNoteEmptyStateInput', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content=""
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(renderer!.root.findAllByType(EditNoteEmptyStateInput)).toHaveLength(1);
});

test('renders italic and color from text segment styles', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="保留段落样式"
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[
          {
            text: '保留段落样式',
            fontSize: 18,
            isBold: false,
            isItalic: true,
            color: '#123456',
          },
        ]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const textInput = renderer!.root.findByType(TextInput);
  const style = StyleSheet.flatten(textInput.props.style);

  expect(style.fontStyle).toBe('italic');
  expect(style.color).toBe('#123456');
});

test('renders non-empty content with EditNoteContentBlocks', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="ab"
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[{text: 'ab', fontSize: 16, isBold: false}]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(renderer!.root.findAllByType(EditNoteContentBlocks)).toHaveLength(1);
});

test('renders split text segments as separate inputs', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="abcd"
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[
          {text: 'a', fontSize: 16, isBold: false},
          {text: 'bc', fontSize: 16, isBold: true},
          {text: 'd', fontSize: 16, isBold: false},
        ]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const textInputs = renderer!.root.findAllByType(TextInput);

  expect(textInputs.map(node => node.props.value)).toEqual(['a', 'bc', 'd']);
  expect(StyleSheet.flatten(textInputs[1].props.style).fontWeight).toBe('bold');
});

test('updates split text segments together with content', async () => {
  const onContentChange = jest.fn();
  const onTextSegmentsChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="abcd"
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={onContentChange}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        onTextSegmentsChange={onTextSegmentsChange}
        textSegments={[
          {text: 'a', fontSize: 16, isBold: false},
          {text: 'bc', fontSize: 16, isBold: true},
          {text: 'd', fontSize: 16, isBold: false},
        ]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const textInputs = renderer!.root.findAllByType(TextInput);

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

test('renders audio tokens with EditNoteAudioBlock', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={['file:///audio-0.mp3']}
        content="[音频0]"
        currentAudioIndex={0}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={true}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[{text: '[音频0]', fontSize: 16, isBold: false}]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(renderer!.root.findAllByType(EditNoteAudioBlock)).toHaveLength(1);
});

test('renders image tokens with EditNoteImageBlock', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="[图片0]"
        currentAudioIndex={-1}
        fontSize={16}
        images={['file:///image-0.jpg']}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[{text: '[图片0]', fontSize: 16, isBold: false}]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(renderer!.root.findAllByType(EditNoteImageBlock)).toHaveLength(1);
});

test('renders text tokens with EditNoteTextTokenInput', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="ab"
        currentAudioIndex={-1}
        fontSize={16}
        images={[]}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={() => {}}
        textSegments={[{text: 'ab', fontSize: 16, isBold: false}]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(renderer!.root.findAllByType(EditNoteTextTokenInput)).toHaveLength(1);
});

test('keeps absolute cursor position when selection changes after image token', async () => {
  const onSelectionChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EditNoteContent
        audios={[]}
        content="[图片0]ab"
        currentAudioIndex={-1}
        fontSize={16}
        images={['file:///image-0.jpg']}
        isBold={false}
        isItalic={false}
        isPlaying={false}
        onContentChange={() => {}}
        onDeleteAudio={() => {}}
        onDeleteImage={() => {}}
        onPlayAudio={() => {}}
        onSelectionChange={onSelectionChange}
        textSegments={[{text: '[图片0]ab', fontSize: 16, isBold: false}]}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const textInput = renderer!.root.findAllByType(TextInput)[0];

  await ReactTestRenderer.act(() => {
    textInput.props.onSelectionChange({
      nativeEvent: {selection: {start: 1, end: 1}},
    });
  });

  expect(onSelectionChange).toHaveBeenCalledWith({start: 1, end: 1}, 6);
});
