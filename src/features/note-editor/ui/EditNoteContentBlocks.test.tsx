import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {buildContentTokens} from '../model/noteEditorContentTokens';
import {EditNoteAudioBlock} from './EditNoteAudioBlock';
import {EditNoteContentBlocks} from './EditNoteContentBlocks';
import {EditNoteImageBlock} from './EditNoteImageBlock';
import {EditNoteTextTokenInput} from './EditNoteTextTokenInput';
import type {EditableTextSegment} from './types';

const createBlocksContext = (segments: EditableTextSegment[]) => {
  const tokens = buildContentTokens({
    defaultFontSize: 16,
    defaultIsBold: false,
    defaultIsItalic: false,
    defaultTextColor: '#000000',
    segments,
  });

  return {
    resolvedTextSegments: segments,
    tokens,
  };
};

describe('EditNoteContentBlocks', () => {
  test('renders text, image and audio tokens with dedicated blocks', async () => {
    const context = createBlocksContext([
      {
        text: '[图片0][音频0]ab',
        fontSize: 16,
        isBold: false,
      },
    ]);
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteContentBlocks
          audios={['file:///audio-0.mp3']}
          currentAudioIndex={0}
          images={['file:///image-0.jpg']}
          isPlaying={true}
          onContentChange={() => {}}
          onDeleteAudio={() => {}}
          onDeleteImage={() => {}}
          onPlayAudio={() => {}}
          onSelectionChange={() => {}}
          resolvedTextSegments={context.resolvedTextSegments}
          theme={generateThemeColors('薄荷生巧', false)}
          tokens={context.tokens}
        />,
      );
    });

    expect(renderer!.root.findAllByType(EditNoteImageBlock)).toHaveLength(1);
    expect(renderer!.root.findAllByType(EditNoteAudioBlock)).toHaveLength(1);
    expect(renderer!.root.findAllByType(EditNoteTextTokenInput)).toHaveLength(1);
  });

  test('skips missing media tokens', async () => {
    const context = createBlocksContext([
      {
        text: '[图片0][音频0]ab',
        fontSize: 16,
        isBold: false,
      },
    ]);
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteContentBlocks
          audios={[]}
          currentAudioIndex={-1}
          images={[]}
          isPlaying={false}
          onContentChange={() => {}}
          onDeleteAudio={() => {}}
          onDeleteImage={() => {}}
          onPlayAudio={() => {}}
          onSelectionChange={() => {}}
          resolvedTextSegments={context.resolvedTextSegments}
          theme={generateThemeColors('薄荷生巧', false)}
          tokens={context.tokens}
        />,
      );
    });

    expect(renderer!.root.findAllByType(EditNoteImageBlock)).toHaveLength(0);
    expect(renderer!.root.findAllByType(EditNoteAudioBlock)).toHaveLength(0);
    expect(renderer!.root.findAllByType(EditNoteTextTokenInput)).toHaveLength(1);
  });
});
