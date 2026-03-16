import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import NoteEditorModal from './NoteEditorModal';
import {completeNoteEditorTextWithAi} from '../model/noteEditorAi';
import {useAudioPlayback} from '../model/useAudioPlayback';
import {pickImagesFromLibrary} from '../../../shared/media/imagePicker';
import {styles} from './styles';

const mockSaveAttachment = jest.fn();
const mockParseDocument = jest.fn();
const mockRenderHtml = jest.fn();
const mockH5EditorProps: {
  current: null | {
    content: string;
    formatCommand?: {
      id: number;
      type: 'bold' | 'italic';
    };
    fontSize: number;
    onDeleteMedia?: (media: {kind: 'image' | 'audio'; index: number}) => void;
    onSelectionChange?: (
      selection: {start: number; end: number},
      cursorPosition: number,
    ) => void;
    textSegments?: Array<{
      text: string;
      fontSize: number;
      isBold?: boolean;
      isItalic?: boolean;
      color?: string;
    }>;
    onChangeState: (state: {
      content: string;
      textSegments: Array<{
        text: string;
        fontSize: number;
        isBold?: boolean;
        isItalic?: boolean;
        color?: string;
      }>;
    }) => void;
  };
} = {
  current: null,
};

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAttachmentProvider: () => ({
      saveAttachment: mockSaveAttachment,
    }),
    getEditorProvider: () => ({
      parse: mockParseDocument,
      renderHtml: mockRenderHtml,
      serialize: jest.fn(),
    }),
  },
}));

jest.mock('../model/noteEditorAi', () => ({
  completeNoteEditorTextWithAi: jest.fn(),
}));

jest.mock('../model/useAudioPlayback', () => ({
  useAudioPlayback: jest.fn(),
}));

jest.mock('../../../shared/media/imagePicker', () => ({
  captureImage: jest.fn(),
  pickImagesFromLibrary: jest.fn(),
}));

jest.mock(
  '../../h5-editor/ui/H5TextDocumentEditor',
  () => {
    const MockReact = require('react');
    const {Text: MockText} = require('react-native');

    return {
      H5TextDocumentEditor: (props: {
        content: string;
        formatCommand?: {
          id: number;
          type: 'bold' | 'italic';
        };
        fontSize: number;
        onDeleteMedia?: (media: {kind: 'image' | 'audio'; index: number}) => void;
        onSelectionChange?: (
          selection: {start: number; end: number},
          cursorPosition: number,
        ) => void;
        textSegments?: Array<{
          text: string;
          fontSize: number;
          isBold?: boolean;
          isItalic?: boolean;
          color?: string;
        }>;
        onChangeState: (state: {
          content: string;
          textSegments: Array<{
            text: string;
            fontSize: number;
            isBold?: boolean;
            isItalic?: boolean;
            color?: string;
          }>;
        }) => void;
      }) => {
        mockH5EditorProps.current = props;

        return MockReact.createElement(
          MockText,
          {testID: 'mock-h5-editor'},
          props.content,
        );
      },
    };
  },
  {virtual: true},
);

jest.mock('react-native-webview', () => {
  const MockReact = require('react');
  const {Text: MockText} = require('react-native');

  return {
    WebView: ({source}: {source: {html: string}}) =>
      MockReact.createElement(MockText, {testID: 'mock-webview'}, source.html),
  };
});

const mockUseAudioPlayback = useAudioPlayback as jest.MockedFunction<
  typeof useAudioPlayback
>;
const mockPickImagesFromLibrary =
  pickImagesFromLibrary as jest.MockedFunction<
    typeof pickImagesFromLibrary
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockH5EditorProps.current = null;
  mockParseDocument.mockResolvedValue({
    version: '1.0',
    blocks: [],
  });
  mockRenderHtml.mockResolvedValue('<p></p>');
  mockUseAudioPlayback.mockReturnValue({
    currentAudioIndex: -1,
    handlePlayAudio: jest.fn(),
    isPlaying: false,
  });
});

test('renders note editor modal from feature entry', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <NoteEditorModal
        visible={false}
        isEditing={false}
        note={{title: '', content: ''}}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });
});

test('switches to h5 preview mode and renders current content through editor provider', async () => {
  mockParseDocument.mockResolvedValue({
    version: '1.0',
    blocks: [{id: 'block-1', type: 'paragraph', text: '预览内容'}],
  });
  mockRenderHtml.mockResolvedValue('<p>预览内容</p>');

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '预览内容',
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const previewButton = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === '预览',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(async () => {
    previewButton.props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(mockParseDocument).toHaveBeenCalledWith('预览内容');
  expect(mockRenderHtml).toHaveBeenCalledWith({
    version: '1.0',
    blocks: [{id: 'block-1', type: 'paragraph', text: '预览内容'}],
  });
  expect(
    renderer!.root.findByProps({testID: 'mock-webview'}).props.children,
  ).toContain('<p>预览内容</p>');
});

test('switches to h5 edit mode and syncs webview text back into note state', async () => {
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
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
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  expect(mockH5EditorProps.current?.content).toBe('原文');
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {
      text: '原文',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
  ]);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onChangeState({
      content: 'H5正文',
      textSegments: [
        {text: 'H5', fontSize: 18, isItalic: true, color: '#123456'},
        {text: '正文', fontSize: 18, isBold: true},
      ],
    });
  });

  expect(onChangeContent).toHaveBeenCalledWith('H5正文');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: 'H5',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
    {
      text: '正文',
      fontSize: 18,
      isBold: true,
    },
  ]);
});

test('allows h5 edit mode when note contains media markers', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '[图片0]',
          images: ['file:///image-0.jpg'],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  expect(h5Button.props.disabled).toBeFalsy();

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  expect(mockH5EditorProps.current?.content).toBe('[图片0]');
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {text: '[图片0]', fontSize: 16, isBold: false},
  ]);
});

test('preserves media markers when h5 editor syncs content back', async () => {
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '前文[图片0]后文',
          images: ['file:///image-0.jpg'],
          fontSize: 16,
          textSegments: [
            {
              text: '前文[图片0]后文',
              fontSize: 18,
              isBold: true,
            },
          ],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onChangeState({
      content: '前文[图片0]更新后文',
      textSegments: [
        {text: '前文[图片0]', fontSize: 18, isBold: true},
        {text: '更新后文', fontSize: 18, isItalic: true},
      ],
    });
  });

  expect(onChangeContent).toHaveBeenCalledWith('前文[图片0]更新后文');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: '前文[图片0]',
      fontSize: 18,
      isBold: true,
    },
    {
      text: '更新后文',
      fontSize: 18,
      isItalic: true,
    },
  ]);
});

test('deletes image markers from h5 editor through native media pipeline', async () => {
  const onChangeImages = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '前文[图片0]后文',
          images: ['file:///image-0.jpg'],
          fontSize: 16,
          textSegments: [
            {text: '前文[图片0]后文', fontSize: 18, isBold: true},
          ],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={onChangeImages}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === 'H5',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

    await ReactTestRenderer.act(async () => {
      mockH5EditorProps.current?.onDeleteMedia?.({
        kind: 'image',
        index: 0,
      });
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 200);
      });
    });

  expect(onChangeContent).toHaveBeenCalledWith('前文后文');
  expect(onChangeImages).toHaveBeenCalledWith([]);
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: '前文后文', fontSize: 18, isBold: true},
  ]);
});

test('deletes audio markers from h5 editor through native media pipeline', async () => {
  const onChangeAudios = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '前文[音频0]后文',
          audios: ['file:///audio-0.mp3'],
          fontSize: 16,
          textSegments: [
            {text: '前文[音频0]后文', fontSize: 18, isItalic: true},
          ],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={onChangeAudios}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onDeleteMedia?.({
      kind: 'audio',
      index: 0,
    });
    await Promise.resolve();
  });

  expect(onChangeContent).toHaveBeenCalledWith('前文后文');
  expect(onChangeAudios).toHaveBeenCalledWith([]);
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: '前文后文', fontSize: 18, isItalic: true},
  ]);
});

test('bridges bold toolbar command into h5 editor', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '原文',
          fontSize: 16,
          textSegments: [{text: '原文', fontSize: 16, isBold: false}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
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

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    findToolbarButtonByLabel('𝐁').props.onPress();
  });

  expect(mockH5EditorProps.current?.formatCommand).toEqual({
    id: 1,
    type: 'bold',
  });
});

test('bridges italic toolbar command into h5 editor', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '原文',
          fontSize: 16,
          textSegments: [{text: '原文', fontSize: 16, isItalic: false}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
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

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    findToolbarButtonByLabel('𝐼').props.onPress();
  });

  expect(mockH5EditorProps.current?.formatCommand).toEqual({
    id: 1,
    type: 'italic',
  });
});

test('syncs increased font size into h5 editor through shared formatting state', async () => {
  const onChangeFontSize = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '原文',
          fontSize: 16,
          textSegments: [
            {text: '原', fontSize: 14, isItalic: true},
            {text: '文', fontSize: 20, isBold: true},
          ],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={onChangeFontSize}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
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

  const h5Button = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(child => child.type === Text && child.props.children === 'H5')
        .length > 0
    );
  });

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    findToolbarButtonByLabel('𝐀+').props.onPress();
  });

  expect(onChangeFontSize).toHaveBeenCalledWith(18);
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
  expect(mockH5EditorProps.current?.fontSize).toBe(18);
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
});

test('inserts image markers in h5 mode through native image entry flow', async () => {
  mockSaveAttachment.mockResolvedValue('file:///image-0.jpg');
  mockPickImagesFromLibrary.mockResolvedValue([
    {uri: 'file:///source-0.jpg'},
  ]);
  const onChangeImages = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: 'abcd',
          images: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={onChangeImages}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findButtonByText = (label: string) => {
    const matches = renderer!.root.findAll(node => {
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
  const findImageToolbarButton = () => {
    return renderer!.root.find(node => {
      if (node.type !== TouchableOpacity || node.props.disabled) {
        return false;
      }

      const styleList = Array.isArray(node.props.style)
        ? node.props.style
        : [node.props.style];

      return styleList.includes(styles.cameraButton);
    });
  };
  const h5Button = findButtonByText('H5');

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    findImageToolbarButton().props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    await findButtonByText('从相册选择').props.onPress();
  });

  expect(mockPickImagesFromLibrary).toHaveBeenCalledTimes(1);
  expect(mockSaveAttachment).toHaveBeenCalledWith({
    index: 0,
    kind: 'image',
    noteId: expect.stringMatching(/^temp_/),
    preferredExtension: undefined,
    uri: 'file:///source-0.jpg',
  });
  expect(onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
  expect(onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
  ]);
});

test('inserts audio markers in h5 mode through native recording flow', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
  const onChangeAudios = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          id: 'note-1',
          title: '标题',
          content: 'abcd',
          audios: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={onChangeAudios}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findButtonByText = (label: string) => {
    const matches = renderer!.root.findAll(node => {
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
  const h5Button = findButtonByText('H5');

  await ReactTestRenderer.act(() => {
    h5Button.props.onPress();
  });

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    findButtonByText('🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findButtonByText('停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
  ]);
});

test('syncs text segments after ai completion appends content', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
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
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const aiButton = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === '🤖️',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(async () => {
    aiButton.props.onPress();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '原文',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(onChangeContent).toHaveBeenCalledWith('原文续写内容');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: '原文续写内容',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
  ]);
});

test('renders appended ai content before parent note rerenders', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
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
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const aiButton = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === '🤖️',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(async () => {
    aiButton.props.onPress();
    await Promise.resolve();
  });

  expect(
    renderer!.root.findAll(
      node => node.type === TextInput && node.props.value === '原文续写内容',
    ).length,
  ).toBeGreaterThan(0);
});

test('syncs text segments after recording inserts an audio marker', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
  const onChangeAudios = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          id: 'note-1',
          title: '标题',
          content: 'abcd',
          audios: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={onChangeAudios}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
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

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(onChangeContent).toHaveBeenCalledWith('[音频0]abcd');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {text: '[音频0]abcd', fontSize: 18, isBold: true},
  ]);
});

test('keeps inserted audio marker when ai completion runs before parent note rerenders', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          id: 'note-1',
          title: '标题',
          content: 'abcd',
          audios: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
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

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🤖️').props.onPress();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '[音频0]abcd',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(onChangeContent).toHaveBeenLastCalledWith('[音频0]abcd续写内容');
  expect(onChangeTextSegments).toHaveBeenLastCalledWith([
    {text: '[音频0]abcd续写内容', fontSize: 18, isBold: true},
  ]);
});

test('wires audio playback through useAudioPlayback', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '[音频0]',
          audios: ['file:///audio-0.mp3'],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(mockUseAudioPlayback).toHaveBeenCalledWith({
    audios: ['file:///audio-0.mp3'],
  });
});
