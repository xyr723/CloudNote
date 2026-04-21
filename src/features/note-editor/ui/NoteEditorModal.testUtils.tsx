import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import {captureImage, pickImagesFromLibrary} from '../../../shared/media/imagePicker';
import {useAudioPlayback} from '../model/useAudioPlayback';

export const mockSaveAttachment = jest.fn();
export const mockParseDocument = jest.fn();
export const mockRenderHtml = jest.fn();
export const mockH5EditorProps: {
  current: null | {
    content: string;
    document?: RichDocument;
    formatCommand?: {
      id: number;
      type: 'bold' | 'italic';
    };
    fontSize: number;
    onDeleteMedia?: (media: {kind: 'image' | 'audio'; index: number}) => void;
    onMediaInsertRequest?: (event: {
      type: 'media-insert-request';
      action:
        | 'pick-image'
        | 'capture-image'
        | 'record-audio'
        | 'insert-image-assets';
      assets?: Array<{
        uri: string;
      }>;
    }) => void;
    onSelectionChange?: (
      selection: {start: number; end: number},
      cursorPosition: number,
    ) => void;
    onWidgetEvent?: (event: {
      type:
        | 'widget-edit-request'
        | 'widget-delete'
        | 'widget-move'
        | 'widget-insert-request'
        | 'widget-reorder-request';
      blockId?: string;
      widgetId?: string;
      widgetType?: string;
      afterBlockId?: string | null;
      direction?: 'up' | 'down';
    }) => void;
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
type MockH5EditorProps = NonNullable<(typeof mockH5EditorProps)['current']>;

const normalizeMirrorContent = (content: string): string => {
  if (!content.trim()) {
    return '';
  }

  return content
    .replace(/\[图片(\d+)\]/g, (_, index: string) => {
      return `\n\n图片占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\[音频(\d+)\]/g, (_, index: string) => {
      return `\n\n音频占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const buildMirrorTextBlocks = (plainText: string) => {
  return plainText
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map((text, index) => ({
      id: `block-${index + 1}`,
      type: 'paragraph' as const,
      text,
    }));
};

export const buildMirrorDocument = (
  content: string,
  widgetBlocks: RichDocument['blocks'] = [],
) => {
  const plainText = normalizeMirrorContent(content);

  return {
    version: '1.0' as const,
    blocks: [...buildMirrorTextBlocks(plainText), ...widgetBlocks],
    plainText,
  };
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
      H5TextDocumentEditor: (props: MockH5EditorProps) => {
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

export const mockUseAudioPlayback = useAudioPlayback as jest.MockedFunction<
  typeof useAudioPlayback
>;
export const mockPickImagesFromLibrary =
  pickImagesFromLibrary as jest.MockedFunction<
    typeof pickImagesFromLibrary
  >;
export const mockCaptureImage =
  captureImage as jest.MockedFunction<typeof captureImage>;

export const resetNoteEditorModalTestState = () => {
  jest.clearAllMocks();
  mockH5EditorProps.current = null;
  mockParseDocument.mockImplementation(async (input: string) => {
    return {
      version: '1.0',
      blocks: buildMirrorTextBlocks(input),
      plainText: input,
    };
  });
  mockRenderHtml.mockResolvedValue('<p></p>');
  mockUseAudioPlayback.mockReturnValue({
    currentAudioIndex: -1,
    handlePlayAudio: jest.fn(),
    isPlaying: false,
  });
};

export const flushNoteEditorModalEffects = async () => {
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

export const findTextButton = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
  options?: {
    useLastMatch?: boolean;
  },
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

  return options?.useLastMatch ? matches[matches.length - 1] : matches[0];
};
