import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import type {NoteDraft} from '../../../entities/note/draft';
import type {TextSegment} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {captureImage, pickImagesFromLibrary} from '../../../shared/media/imagePicker';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import {buildMirrorDocument} from './NoteEditorModal.testUtils';
import {styles} from './styles';
import NoteEditorModal from './NoteEditorModal.web';

jest.mock('../../../shared/media/imagePicker', () => ({
  captureImage: jest.fn(),
  pickImagesFromLibrary: jest.fn(),
}));

jest.mock('../../../shared/media/noteAttachmentStore', () => ({
  saveNoteAttachment: jest.fn(),
}));

jest.mock('../model/noteEditorAi', () => ({
  completeNoteEditorTextWithAi: jest.fn(),
}));

jest.mock('../model/useAudioPlayback', () => ({
  useAudioPlayback: () => ({
    currentAudioIndex: -1,
    handlePlayAudio: jest.fn(),
    isPlaying: false,
  }),
}));

jest.mock('../model/useAudioRecordingSession', () => {
  const React = require('react');

  return {
    useAudioRecordingSession: () => {
      const [isRecording, setIsRecording] = React.useState(false);
      const [currentAudioPath, setCurrentAudioPath] = React.useState(
        null as string | null,
      );

      return {
        currentAudioPath,
        handleStartRecording: async () => {
          setCurrentAudioPath('recording:web');
          setIsRecording(true);
        },
        handleStopRecording: async () => {
          setCurrentAudioPath(null);
          setIsRecording(false);
          return 'blob:captured-audio';
        },
        isRecording,
      };
    },
  };
});

const theme = generateThemeColors('薄荷生巧', false);

const mockCaptureImage = captureImage as jest.MockedFunction<typeof captureImage>;
const mockPickImagesFromLibrary =
  pickImagesFromLibrary as jest.MockedFunction<typeof pickImagesFromLibrary>;
const mockSaveNoteAttachment =
  saveNoteAttachment as jest.MockedFunction<typeof saveNoteAttachment>;

type RenderCallbacks = {
  onChangeAudios: jest.Mock<void, [string[]]>;
  onChangeContent: jest.Mock<void, [string]>;
  onChangeDocument: jest.Mock<void, [any]>;
  onChangeFontSize: jest.Mock<void, [number]>;
  onChangeImages: jest.Mock<void, [string[]]>;
  onChangeTextSegments: jest.Mock<void, [TextSegment[]]>;
};

const createCallbacks = (): RenderCallbacks => {
  return {
    onChangeAudios: jest.fn(),
    onChangeContent: jest.fn(),
    onChangeDocument: jest.fn(),
    onChangeFontSize: jest.fn(),
    onChangeImages: jest.fn(),
    onChangeTextSegments: jest.fn(),
  };
};

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  const matches = renderer.root.findAll(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });

  return matches[matches.length - 1];
};

const findImageToolbarButton = (
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

const renderWebModal = async ({
  noteOverrides = {},
}: {
  noteOverrides?: Partial<NoteDraft>;
} = {}) => {
  const callbacks = createCallbacks();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const note: NoteDraft = {
    title: '标题',
    content: '',
    ...noteOverrides,
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

describe('NoteEditorModal.web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureImage.mockResolvedValue(null);
  });

  test('inserts image markers through the web image entry flow', async () => {
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'data:image/png;base64,SOURCE'},
    ]);
    mockSaveNoteAttachment.mockResolvedValue('data:image/png;base64,STORED');
    const {callbacks, renderer} = await renderWebModal({
      noteOverrides: {
        content: 'abcd',
        fontSize: 16,
        images: [],
        textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
      },
    });

    await ReactTestRenderer.act(async () => {
      renderer.root
        .findByProps({placeholder: '请输入正文'})
        .props.onSelectionChange({
          nativeEvent: {
            selection: {
              end: 2,
              start: 2,
            },
          },
        });
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findImageToolbarButton(renderer).props.onPress();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '从相册选择').props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(callbacks.onChangeImages).toHaveBeenCalledWith([
      'data:image/png;base64,STORED',
    ]);
    expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
    expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('inserts audio markers through the web recording flow', async () => {
    mockSaveNoteAttachment.mockResolvedValue('blob:stored-audio');
    const {callbacks, renderer} = await renderWebModal({
      noteOverrides: {
        content: 'abcd',
        fontSize: 16,
        id: 'note-1',
        textSegments: [{text: 'abcd', fontSize: 18, isItalic: true}],
      },
    });

    await ReactTestRenderer.act(async () => {
      renderer.root
        .findByProps({placeholder: '请输入正文'})
        .props.onSelectionChange({
          nativeEvent: {
            selection: {
              end: 2,
              start: 2,
            },
          },
        });
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '🎙️').props.onPress();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '停止').props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(callbacks.onChangeAudios).toHaveBeenCalledWith(['blob:stored-audio']);
    expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
    expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[音频0]cd', fontSize: 18, isItalic: true},
    ]);
  });

  test('supports widget inline editing in web h5 mode', async () => {
    const initialDocument = {
      version: '1.0' as const,
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph' as const,
          text: '前文',
        },
        {
          id: 'widget-block-1',
          type: 'widget' as const,
          widget: {
            id: 'widget-1',
            type: 'todo-list' as const,
            title: '原待办',
            props: {
              items: ['事项一'],
            },
          },
        },
      ],
      plainText: '前文',
    };

    const expectedDocument = {
      ...initialDocument,
      blocks: [
        initialDocument.blocks[0],
        {
          id: 'widget-block-1',
          type: 'widget' as const,
          widget: {
            id: 'widget-1',
            type: 'todo-list' as const,
            title: '编辑后的待办',
            props: {
              items: ['事项一'],
            },
          },
        },
      ],
    };

    const {callbacks, renderer} = await renderWebModal({
      noteOverrides: {
        content: '前文',
        document: initialDocument,
        textSegments: [{text: '前文', fontSize: 16}],
      },
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, 'H5').props.onPress();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer.root
        .findByProps({testID: 'web-h5-widget-edit-widget-block-1'})
        .props.onPress();
      await Promise.resolve();
    });

    expect(
      renderer.root.findByProps({testID: 'note-h5-widget-inline-panel'}),
    ).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '编辑后的待办',
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '保存').props.onPress();
      await Promise.resolve();
    });

    expect(callbacks.onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  });

  test('supports internal media insert requests in web h5 mode', async () => {
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'data:image/png;base64,SOURCE'},
    ]);
    mockSaveNoteAttachment.mockResolvedValue('data:image/png;base64,STORED');

    const {callbacks, renderer} = await renderWebModal({
      noteOverrides: {
        content: 'abcd',
        fontSize: 16,
        images: [],
        textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
      },
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, 'H5').props.onPress();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer.root
        .findByProps({testID: 'web-h5-editor-input'})
        .props.onSelectionChange({
          nativeEvent: {
            selection: {
              end: 2,
              start: 2,
            },
          },
        });
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer.root
        .findByProps({testID: 'web-h5-media-pick-image'})
        .props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(callbacks.onChangeImages).toHaveBeenCalledWith([
      'data:image/png;base64,STORED',
    ]);
    expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
    expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
      buildMirrorDocument('ab[图片0]cd'),
    );
  });
});
