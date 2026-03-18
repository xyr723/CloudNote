import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import type {RichDocument} from '../../../entities/document/types';
import type {WidgetSchema} from '../../../entities/widget/types';
import {
  captureImage,
  pickImagesFromLibrary,
} from '../../../shared/media/imagePicker';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import {completeNoteEditorTextWithAi} from './noteEditorAi';
import {useNoteEditorController} from './useNoteEditorController';

jest.mock('../../../shared/media/imagePicker', () => ({
  captureImage: jest.fn(),
  pickImagesFromLibrary: jest.fn(),
}));

jest.mock('../../../shared/media/noteAttachmentStore', () => ({
  saveNoteAttachment: jest.fn(),
}));

jest.mock('./noteEditorAi', () => ({
  completeNoteEditorTextWithAi: jest.fn(),
}));

jest.mock('./useAudioPlayback', () => ({
  useAudioPlayback: () => ({
    currentAudioIndex: -1,
    handlePlayAudio: jest.fn(),
    isPlaying: false,
  }),
}));

export const mockCaptureImage =
  captureImage as jest.MockedFunction<typeof captureImage>;
export const mockCompleteNoteEditorTextWithAi =
  completeNoteEditorTextWithAi as jest.MockedFunction<
    typeof completeNoteEditorTextWithAi
  >;
export const mockPickImagesFromLibrary =
  pickImagesFromLibrary as jest.MockedFunction<
    typeof pickImagesFromLibrary
  >;
export const mockSaveNoteAttachment =
  saveNoteAttachment as jest.MockedFunction<typeof saveNoteAttachment>;

export const buildWidget = (id: string): WidgetSchema => ({
  id,
  type: 'todo-list',
  title: `待办 ${id}`,
  props: {
    items: ['一', '二'],
  },
});

export const createPassThroughMirrorHandlers = (
  overrides: Partial<{
    handleAppendWidgets: (widgets: WidgetSchema[]) => void;
  }> = {},
) => {
  return {
    handleAppendWidgets: overrides.handleAppendWidgets ?? (() => {}),
    handleMirrorContentChange: (
      nextContent: string,
      applyContentChange: (content: string) => void,
    ) => {
      applyContentChange(nextContent);
    },
  };
};

export const resetUseNoteEditorControllerTestState = () => {
  jest.clearAllMocks();
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
};

export const renderUseNoteEditorController = async ({
  draftDocument = {
    version: '1.0',
    blocks: [],
  },
  mirrorHandlers = createPassThroughMirrorHandlers(),
  note,
  onChangeAudios,
  onChangeContent,
  onChangeFontSize,
  onChangeImages,
  onChangeTextSegments,
  onSave = async () => {},
}: {
  draftDocument?: RichDocument;
  mirrorHandlers?: ReturnType<typeof createPassThroughMirrorHandlers>;
  note: {
    id?: string;
    title: string;
    content: string;
    audios?: string[];
    images?: string[];
    fontSize?: number;
    textSegments?: Array<{
      text: string;
      fontSize: number;
      isBold?: boolean;
      isItalic?: boolean;
      color?: string;
    }>;
  };
  onChangeAudios?: (audios: string[]) => void;
  onChangeContent: (content: string) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeTextSegments?: (
    segments: Array<{
      text: string;
      fontSize: number;
      isBold?: boolean;
      isItalic?: boolean;
      color?: string;
    }>,
  ) => void;
  onSave?: () => Promise<void>;
}) => {
  const controllerRef: {
    current: ReturnType<typeof useNoteEditorController> | null;
  } = {
    current: null,
  };

  const Probe = () => {
    controllerRef.current = useNoteEditorController({
      visible: true,
      note,
      draftDocument,
      onSave,
      onChangeAudios,
      onChangeContent,
      onChangeFontSize,
      onChangeImages,
      onChangeTextSegments,
      ...mirrorHandlers,
    });

    return null;
  };

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  return {
    controllerRef,
  };
};
