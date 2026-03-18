import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import type {NoteDraft} from '../../../entities/note/draft';
import type {TextSegment} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {findTextButton} from './NoteEditorModal.testUtils';
import NoteEditorModal from './NoteEditorModal';
import {styles} from './styles';

const theme = generateThemeColors('薄荷生巧', false);

type OnChangeAudiosMock = jest.Mock<void, [string[]]>;
type OnChangeContentMock = jest.Mock<void, [string]>;
type OnChangeDocumentMock = jest.Mock<void, [RichDocument]>;
type OnChangeFontSizeMock = jest.Mock<void, [number]>;
type OnChangeImagesMock = jest.Mock<void, [string[]]>;
type OnChangeTextSegmentsMock = jest.Mock<void, [TextSegment[]]>;

export type RenderNoteEditorCallbacks = {
  onChangeAudios: OnChangeAudiosMock;
  onChangeContent: OnChangeContentMock;
  onChangeDocument: OnChangeDocumentMock;
  onChangeFontSize: OnChangeFontSizeMock;
  onChangeImages: OnChangeImagesMock;
  onChangeTextSegments: OnChangeTextSegmentsMock;
};

const createCallbacks = (
  overrides: Partial<RenderNoteEditorCallbacks> = {},
): RenderNoteEditorCallbacks => {
  return {
    onChangeAudios:
      overrides.onChangeAudios ?? (jest.fn() as OnChangeAudiosMock),
    onChangeContent:
      overrides.onChangeContent ?? (jest.fn() as OnChangeContentMock),
    onChangeDocument:
      overrides.onChangeDocument ?? (jest.fn() as OnChangeDocumentMock),
    onChangeFontSize:
      overrides.onChangeFontSize ?? (jest.fn() as OnChangeFontSizeMock),
    onChangeImages:
      overrides.onChangeImages ?? (jest.fn() as OnChangeImagesMock),
    onChangeTextSegments:
      overrides.onChangeTextSegments ?? (jest.fn() as OnChangeTextSegmentsMock),
  };
};

export const renderNoteEditorModal = async ({
  noteOverrides = {},
  visible = true,
  callbackOverrides = {},
}: {
  noteOverrides?: Partial<NoteDraft>;
  visible?: boolean;
  callbackOverrides?: Partial<RenderNoteEditorCallbacks>;
} = {}) => {
  const callbacks = createCallbacks(callbackOverrides);
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const note: NoteDraft = {
    title: '标题',
    content: '',
    ...noteOverrides,
  };

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible={visible}
        isEditing={false}
        note={note}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={callbacks.onChangeContent}
        onChangeImages={callbacks.onChangeImages}
        onChangeAudios={callbacks.onChangeAudios}
        onChangeDocument={callbacks.onChangeDocument}
        onChangeFontSize={callbacks.onChangeFontSize}
        onChangeTextSegments={callbacks.onChangeTextSegments}
        theme={theme}
      />,
    );
  });

  return {
    callbacks,
    renderer: renderer!,
  };
};

export const findToolbarButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });
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

export const openPreviewMode = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
) => {
  await ReactTestRenderer.act(async () => {
    findTextButton(renderer, '预览').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });
};

export const findImageToolbarButton = (
  renderer: ReactTestRenderer.ReactTestRenderer,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    const styleList = Array.isArray(node.props.style)
      ? node.props.style
      : [node.props.style];

    return styleList.includes(styles.cameraButton);
  });
};
