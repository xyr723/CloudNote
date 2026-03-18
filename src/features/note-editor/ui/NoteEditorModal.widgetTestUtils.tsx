import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument, TextBlock} from '../../../entities/document/types';
import type {NoteDraft} from '../../../entities/note/draft';
import {generateThemeColors} from '../../../shared/theme/colors';
import {
  buildMirrorDocument,
  findTextButton,
  mockH5EditorProps,
} from './NoteEditorModal.testUtils';
import NoteEditorModal from './NoteEditorModal';

const theme = generateThemeColors('薄荷生巧', false);

type OnChangeDocumentMock = jest.Mock<void, [RichDocument]>;

type WidgetEvent = {
  type:
    | 'widget-edit-request'
    | 'widget-delete'
    | 'widget-insert-request'
    | 'widget-move';
  blockId?: string;
  widgetId?: string;
  widgetType?: string;
  afterBlockId?: string | null;
  direction?: 'up' | 'down';
};

export const buildParagraphBlock = (
  id: string = 'block-1',
  text: string = '正文',
): TextBlock => {
  return {
    id,
    type: 'paragraph',
    text,
  };
};

export const buildWidgetDocument = (
  blocks: RichDocument['blocks'],
  plainText: string = '正文',
): RichDocument => {
  const widgetBlocks = blocks.filter(block => block.type === 'widget');

  return buildMirrorDocument(plainText, widgetBlocks);
};

export const renderWidgetModal = async ({
  noteDocument,
  onChangeDocument = jest.fn() as OnChangeDocumentMock,
}: {
  noteDocument: RichDocument;
  onChangeDocument?: OnChangeDocumentMock;
}) => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const note: NoteDraft = {
    title: '标题',
    content: noteDocument.plainText ?? '正文',
    textSegments: [
      {
        text: noteDocument.plainText ?? '正文',
        fontSize: 16,
      },
    ],
    document: noteDocument,
  };

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={note}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeDocument={onChangeDocument}
        onChangeTextSegments={() => {}}
        theme={theme}
      />,
    );
  });

  return {
    onChangeDocument,
    renderer: renderer!,
  };
};

export const findLastButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return findTextButton(renderer, label, {useLastMatch: true});
};

export const openH5Mode = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
) => {
  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, 'H5').props.onPress();
  });
};

export const dispatchWidgetEvent = async (event: WidgetEvent) => {
  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onWidgetEvent?.(event);
  });
};
