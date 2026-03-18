import React, {useState} from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import type {RichDocument} from '../../../entities/document/types';
import {
  appendWidgetSchemasToDocument,
  mergeTextDocumentWithWidgets,
} from '../../../entities/note/document';
import type {WidgetSchema} from '../../../entities/widget/types';
import {
  captureImage,
  pickImagesFromLibrary,
} from '../../../shared/media/imagePicker';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import {completeNoteEditorTextWithAi} from './noteEditorAi';
import {createNoteTextMirrorDocument} from './noteEditorDocument';
import {useNoteDocumentMirror} from './useNoteDocumentMirror';
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

const mockCaptureImage = captureImage as jest.MockedFunction<typeof captureImage>;
const mockCompleteNoteEditorTextWithAi =
  completeNoteEditorTextWithAi as jest.MockedFunction<
    typeof completeNoteEditorTextWithAi
  >;
const mockPickImagesFromLibrary =
  pickImagesFromLibrary as jest.MockedFunction<
    typeof pickImagesFromLibrary
  >;
const mockSaveNoteAttachment = saveNoteAttachment as jest.MockedFunction<
  typeof saveNoteAttachment
>;

const buildWidget = (id: string): WidgetSchema => ({
  id,
  type: 'todo-list',
  title: `待办 ${id}`,
  props: {
    items: ['一', '二'],
  },
});

const createPassThroughMirrorHandlers = (
  overrides: Partial<{
    handleAppendWidgets: (widgets: WidgetSchema[]) => void;
    syncTextMirror: (content: string) => void;
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
    handleMirrorTextSegmentsChange: (
      nextSegments: Array<{
        text: string;
        fontSize: number;
        isBold?: boolean;
        isItalic?: boolean;
        color?: string;
      }>,
      applyTextSegmentsChange?: (
        segments: Array<{
          text: string;
          fontSize: number;
          isBold?: boolean;
          isItalic?: boolean;
          color?: string;
        }>,
      ) => void,
    ) => {
      applyTextSegmentsChange?.(nextSegments);
    },
    syncTextMirror: overrides.syncTextMirror ?? (() => {}),
  };
};

describe('useNoteEditorController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
      typeof RNFetchBlob.fs.exists
    >;
    existsMock.mockResolvedValue(true);
  });

  test('queues h5 format commands and keeps shared formatting state in sync', async () => {
    const note = {
      title: '标题',
      content: '原文',
      fontSize: 16,
      textSegments: [
        {text: '原', fontSize: 14, isItalic: true},
        {text: '文', fontSize: 20, isBold: true},
      ],
    };
    const onChangeFontSize = jest.fn();
    const onChangeTextSegments = jest.fn();
    const onSave = async () => {};
    const mirrorHandlers = createPassThroughMirrorHandlers();
    let latestController: ReturnType<typeof useNoteEditorController> | null =
      null;

    const Probe = () => {
      latestController = useNoteEditorController({
        visible: true,
        note,
        draftDocument: undefined,
        onSave,
        onChangeContent: () => {},
        onChangeFontSize,
        onChangeTextSegments,
        ...mirrorHandlers,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestController?.handleQueueH5FormatCommand('bold');
      latestController?.handleQueueH5FormatCommand('italic');
      latestController?.formatting.handleIncreaseFontSize();
    });

    const controller = latestController!;

    expect(controller.h5FormatCommand).toEqual({
      id: 2,
      type: 'italic',
    });
    expect(onChangeFontSize).toHaveBeenCalledWith(18);
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: '原', fontSize: 18, isItalic: true},
      {text: '文', fontSize: 18, isBold: true},
    ]);
    expect(controller.editorContent).toBe('原文');
    expect(controller.formatting.textSegments).toEqual([
      {text: '原', fontSize: 18, isItalic: true},
      {text: '文', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 image pick requests into the native media pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-0.jpg');
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'file:///source-0.jpg'},
    ]);
    const note = {
      title: '标题',
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const onSave = async () => {};
    const mirrorHandlers = createPassThroughMirrorHandlers();
    let latestController: ReturnType<typeof useNoteEditorController> | null =
      null;

    const Probe = () => {
      latestController = useNoteEditorController({
        visible: true,
        note,
        draftDocument: undefined,
        onSave,
        onChangeContent,
        onChangeImages,
        onChangeFontSize: () => {},
        onChangeTextSegments,
        ...mirrorHandlers,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestController?.formatting.handleEditorSelectionChange(
        {start: 2, end: 2},
        2,
      );
    });

    await ReactTestRenderer.act(async () => {
      latestController?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'pick-image',
      });
      await Promise.resolve();
    });

    expect(mockPickImagesFromLibrary).toHaveBeenCalledTimes(1);
    expect(onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
    expect(onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 camera requests into the native media pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-0.jpg');
    mockCaptureImage.mockResolvedValue({uri: 'file:///camera-0.jpg'});
    const note = {
      title: '标题',
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const onSave = async () => {};
    const mirrorHandlers = createPassThroughMirrorHandlers();
    let latestController: ReturnType<typeof useNoteEditorController> | null =
      null;

    const Probe = () => {
      latestController = useNoteEditorController({
        visible: true,
        note,
        draftDocument: undefined,
        onSave,
        onChangeContent,
        onChangeImages,
        onChangeFontSize: () => {},
        onChangeTextSegments,
        ...mirrorHandlers,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestController?.formatting.handleEditorSelectionChange(
        {start: 1, end: 1},
        1,
      );
    });

    await ReactTestRenderer.act(async () => {
      latestController?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'capture-image',
      });
      await Promise.resolve();
    });

    expect(mockCaptureImage).toHaveBeenCalledTimes(1);
    expect(onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
    expect(onChangeContent).toHaveBeenCalledWith('a[图片0]bcd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'a[图片0]bcd', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 record requests into the native recording pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///audio-0.mp3');
    const note = {
      id: 'note-1',
      title: '标题',
      content: 'abcd',
      audios: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeAudios = jest.fn();
    const onChangeContent = jest.fn();
    const onChangeTextSegments = jest.fn();
    const onSave = async () => {};
    const mirrorHandlers = createPassThroughMirrorHandlers();
    let latestController: ReturnType<typeof useNoteEditorController> | null =
      null;

    const Probe = () => {
      latestController = useNoteEditorController({
        visible: true,
        note,
        draftDocument: undefined,
        onSave,
        onChangeAudios,
        onChangeContent,
        onChangeFontSize: () => {},
        onChangeTextSegments,
        ...mirrorHandlers,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(() => {
      latestController?.formatting.handleEditorSelectionChange(
        {start: 2, end: 2},
        2,
      );
    });

    await ReactTestRenderer.act(async () => {
      latestController?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'record-audio',
      });
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      latestController?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'record-audio',
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
    expect(onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('appends ai text and widgets through the shared controller chain', async () => {
    const aiWidget = buildWidget('todo-1');
    const note = {
      title: '标题',
      content: '原文',
      fontSize: 16,
      textSegments: [
        {
          text: '原文',
          fontSize: 18,
          isItalic: true,
          color: '#123456',
        },
      ],
    };
    mockCompleteNoteEditorTextWithAi.mockResolvedValue({
      text: '续写内容',
      widgets: [aiWidget],
      metadata: {
        provider: 'mock',
        model: 'mock-model',
        usedFallback: false,
      },
    });
    const onChangeContent = jest.fn();
    const onChangeDocument = jest.fn();
    const onChangeTextSegments = jest.fn();
    const onSave = async () => {};
    let latestController: ReturnType<typeof useNoteEditorController> | null =
      null;

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument | undefined>(
        undefined,
      );
      const documentMirror = useNoteDocumentMirror({
        noteDocument: document,
        onChangeDocument: nextDocument => {
          setDocument(nextDocument);
          onChangeDocument(nextDocument);
        },
        visible: true,
      });

      latestController = useNoteEditorController({
        visible: true,
        note,
        draftDocument: documentMirror.draftDocument,
        onSave,
        onChangeContent,
        onChangeFontSize: () => {},
        onChangeTextSegments,
        handleAppendWidgets: documentMirror.handleAppendWidgets,
        handleMirrorContentChange: documentMirror.handleMirrorContentChange,
        handleMirrorTextSegmentsChange:
          documentMirror.handleMirrorTextSegmentsChange,
        syncTextMirror: documentMirror.syncTextMirror,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestController?.actions.handleAiComplete();
      await Promise.resolve();
      await Promise.resolve();
    });

    const expectedDocument = mergeTextDocumentWithWidgets(
      createNoteTextMirrorDocument('原文续写内容'),
      appendWidgetSchemasToDocument(undefined, [aiWidget]),
    );

    expect(onChangeContent).toHaveBeenCalledWith('原文续写内容');
    expect(onChangeDocument).toHaveBeenLastCalledWith(expectedDocument);
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {
        text: '原文续写内容',
        fontSize: 18,
        isItalic: true,
        color: '#123456',
      },
    ]);
    expect(latestController!.editorContent).toBe('原文续写内容');
  });
});
