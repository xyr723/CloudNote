import {StyleSheet, TextInput} from 'react-native';
import {
  EditNoteAudioBlock,
} from './EditNoteAudioBlock';
import {EditNoteContentBlocks} from './EditNoteContentBlocks';
import {EditNoteEmptyStateInput} from './EditNoteEmptyStateInput';
import {EditNoteImageBlock} from './EditNoteImageBlock';
import {EditNoteTextTokenInput} from './EditNoteTextTokenInput';
import {renderEditNoteContent} from './EditNoteContent.testUtils';

test('renders empty state with EditNoteEmptyStateInput', async () => {
  const renderer = await renderEditNoteContent();

  expect(renderer.root.findAllByType(EditNoteEmptyStateInput)).toHaveLength(1);
});

test('renders italic and color from text segment styles', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      content: '保留段落样式',
      textSegments: [
        {
          text: '保留段落样式',
          fontSize: 18,
          isBold: false,
          isItalic: true,
          color: '#123456',
        },
      ],
    },
  });

  const textInput = renderer.root.findByType(TextInput);
  const style = StyleSheet.flatten(textInput.props.style);

  expect(style.fontStyle).toBe('italic');
  expect(style.color).toBe('#123456');
});

test('renders non-empty content with EditNoteContentBlocks', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      content: 'ab',
      textSegments: [{text: 'ab', fontSize: 16, isBold: false}],
    },
  });

  expect(renderer.root.findAllByType(EditNoteContentBlocks)).toHaveLength(1);
});

test('renders audio tokens with EditNoteAudioBlock', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      audios: ['file:///audio-0.mp3'],
      content: '[音频0]',
      currentAudioIndex: 0,
      isPlaying: true,
      textSegments: [{text: '[音频0]', fontSize: 16, isBold: false}],
    },
  });

  expect(renderer.root.findAllByType(EditNoteAudioBlock)).toHaveLength(1);
});

test('renders image tokens with EditNoteImageBlock', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      content: '[图片0]',
      images: ['file:///image-0.jpg'],
      textSegments: [{text: '[图片0]', fontSize: 16, isBold: false}],
    },
  });

  expect(renderer.root.findAllByType(EditNoteImageBlock)).toHaveLength(1);
});

test('renders text tokens with EditNoteTextTokenInput', async () => {
  const renderer = await renderEditNoteContent({
    props: {
      content: 'ab',
      textSegments: [{text: 'ab', fontSize: 16, isBold: false}],
    },
  });

  expect(renderer.root.findAllByType(EditNoteTextTokenInput)).toHaveLength(1);
});
