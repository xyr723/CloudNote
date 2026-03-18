import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {EditNoteContent} from './EditNoteContent';

const theme = generateThemeColors('薄荷生巧', false);

export const renderEditNoteContent = async ({
  props = {},
}: {
  props?: Partial<React.ComponentProps<typeof EditNoteContent>>;
} = {}) => {
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
        theme={theme}
        {...props}
      />,
    );
  });

  return renderer!;
};
