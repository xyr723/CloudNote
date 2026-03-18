import React from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {H5WidgetBridgeEvent} from '../../h5-editor/model/h5TextEditorBridge';
import {H5TextDocumentEditor} from '../../h5-editor/ui/H5TextDocumentEditor';
import type {NoteEditorController} from '../model/useNoteEditorController';
import {EditNoteContent} from './EditNoteContent';
import {NoteEditorPreviewPane} from './NoteEditorPreviewPane';
import type {NoteEditorMode} from './NoteEditorModeSwitch';
import {ScrollView, View} from 'react-native';
import {styles} from './styles';

type NoteEditorContentPaneProps = {
  editorMode: NoteEditorMode;
  controller: NoteEditorController;
  draftDocument: RichDocument;
  h5WidgetDocument: RichDocument;
  onH5WidgetEvent: (event: H5WidgetBridgeEvent) => void;
  theme: ReturnType<typeof generateThemeColors>;
};

export const NoteEditorContentPane: React.FC<NoteEditorContentPaneProps> = ({
  editorMode,
  controller,
  draftDocument,
  h5WidgetDocument,
  onH5WidgetEvent,
  theme,
}) => {
  const {editorContent, formatting, h5FormatCommand, media, playback} =
    controller;

  if (editorMode === 'native') {
    return (
      <ScrollView style={styles.contentScroll}>
        <View
          style={[
            styles.contentContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <EditNoteContent
            audios={media.audios}
            content={editorContent}
            currentAudioIndex={playback.currentAudioIndex}
            fontSize={formatting.fontSize}
            images={media.images}
            isBold={formatting.isBold}
            isItalic={formatting.isItalic}
            isPlaying={playback.isPlaying}
            onContentChange={media.applyContentChange}
            onDeleteAudio={media.handleDeleteAudio}
            onDeleteImage={media.handleDeleteImage}
            onPlayAudio={playback.handlePlayAudio}
            onSelectionChange={formatting.handleEditorSelectionChange}
            onTextSegmentsChange={formatting.applyTextSegmentsChange}
            textSegments={formatting.textSegments}
            theme={theme}
          />
        </View>
      </ScrollView>
    );
  }

  if (editorMode === 'h5') {
    return (
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <H5TextDocumentEditor
          content={editorContent}
          document={h5WidgetDocument}
          formatCommand={h5FormatCommand ?? undefined}
          fontSize={formatting.fontSize}
          onChangeState={formatting.handleReplaceRichTextContent}
          onMediaInsertRequest={controller.handleH5MediaInsertRequest}
          onSelectionChange={formatting.handleEditorSelectionChange}
          onWidgetEvent={onH5WidgetEvent}
          onDeleteMedia={({kind, index}) => {
            if (kind === 'image') {
              media.handleDeleteImage(index);
              return;
            }

            media.handleDeleteAudio(index);
          }}
          textSegments={formatting.textSegments}
          theme={theme}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.contentContainer,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <NoteEditorPreviewPane
        document={draftDocument}
        theme={theme}
      />
    </View>
  );
};
