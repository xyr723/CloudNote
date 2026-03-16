import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {TextSegment} from '../../../entities/note/types';
import {H5TextDocumentEditor} from './H5TextDocumentEditor';

const mockParseDocument = jest.fn();
const mockRenderHtml = jest.fn();
const mockInjectJavaScript = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getEditorProvider: () => ({
      parse: mockParseDocument,
      renderHtml: mockRenderHtml,
    }),
  },
}));

jest.mock('react-native-webview', () => {
  const MockReact = require('react');
  const {Text: MockText} = require('react-native');

  return {
    WebView: MockReact.forwardRef(
      (
        props: {
          onMessage?: (event: {nativeEvent: {data: string}}) => void;
          source: {html: string};
        },
        ref: {current: {injectJavaScript: (script: string) => void} | null},
      ) => {
        MockReact.useImperativeHandle(ref, () => ({
          injectJavaScript: mockInjectJavaScript,
        }));

        return MockReact.createElement(
          MockText,
          {
            testID: 'mock-h5-text-editor',
            onMessage: props.onMessage,
            source: props.source,
          },
          props.source.html,
        );
      },
    ),
  };
});

const theme = generateThemeColors('薄荷生巧', false);
const richTextSegments: TextSegment[] = [
  {text: '原', fontSize: 18, isItalic: true, color: '#123456'},
  {text: '文', fontSize: 18, isBold: true},
];

describe('H5TextDocumentEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseDocument.mockResolvedValue({
      version: '1.0',
      blocks: [{id: 'block-1', type: 'paragraph', text: '初始内容'}],
    });
    mockRenderHtml.mockResolvedValue('<p>初始内容</p>');
  });

  test('renders editable html from editor provider', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="初始内容"
          fontSize={16}
          onChangeContent={() => {}}
          theme={theme}
        />,
      );
    });

    expect(mockParseDocument).toHaveBeenCalledWith('初始内容');
    expect(mockRenderHtml).toHaveBeenCalledWith({
      version: '1.0',
      blocks: [{id: 'block-1', type: 'paragraph', text: '初始内容'}],
    });
    expect(
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.children,
    ).toContain('contenteditable="true"');
  });

  test('renders rich text segments with style metadata', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          textSegments={richTextSegments}
          theme={theme}
        />,
      );
    });

    const renderedHtml =
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.children;

    expect(renderedHtml).toContain('class="note-text-segment"');
    expect(renderedHtml).toContain('data-note-font-size="18"');
    expect(renderedHtml).toContain('data-note-is-italic="true"');
    expect(renderedHtml).toContain('data-note-is-bold="true"');
    expect(renderedHtml).toContain('data-note-color="#123456"');
  });

  test('syncs text back to react native through webview message', async () => {
    const onChangeContent = jest.fn();
    const onChangeState = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="初始内容"
          fontSize={16}
          onChangeContent={onChangeContent}
          onChangeState={onChangeState}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'content-change',
            content: '更新内容',
            textSegments: [
              {text: '更新', fontSize: 18, isItalic: true},
              {text: '内容', fontSize: 18, isBold: true},
            ],
          }),
        },
      });
    });

    expect(onChangeContent).toHaveBeenCalledWith('更新内容');
    expect(onChangeState).toHaveBeenCalledWith({
      content: '更新内容',
      textSegments: [
        {text: '更新', fontSize: 18, isItalic: true},
        {text: '内容', fontSize: 18, isBold: true},
      ],
    });
  });

  test('forwards media delete messages to react native', async () => {
    const onDeleteMedia = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="前文[图片0]后文"
          fontSize={16}
          onChangeContent={() => {}}
          onDeleteMedia={onDeleteMedia}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'media-delete',
            kind: 'image',
            index: 0,
          }),
        },
      });
    });

    expect(onDeleteMedia).toHaveBeenCalledWith({
      kind: 'image',
      index: 0,
    });
  });

  test('forwards selection change messages to react native', async () => {
    const onSelectionChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const editorProps: any = {
      content: '前后文',
      fontSize: 16,
      onChangeContent: () => {},
      onSelectionChange,
      theme,
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor {...editorProps} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'selection-change',
            start: 1,
            end: 3,
            cursorPosition: 1,
          }),
        },
      });
    });

    expect(onSelectionChange).toHaveBeenCalledWith({start: 1, end: 3}, 1);
  });

  test('renders media markers as non-editable placeholder chips', async () => {
    mockParseDocument.mockResolvedValue({
      version: '1.0',
      blocks: [
        {
          id: 'block-1',
          type: 'paragraph',
          text: '前文[图片0]后文[音频1]',
        },
      ],
    });
    mockRenderHtml.mockResolvedValue('<p>前文[图片0]后文[音频1]</p>');
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="前文[图片0]后文[音频1]"
          fontSize={16}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    const renderedHtml =
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props.children;

    expect(renderedHtml).toContain('data-note-marker="[图片0]"');
    expect(renderedHtml).toContain('data-note-marker="[音频1]"');
    expect(renderedHtml).toContain('contenteditable="false"');
  });

  test('injects updated html when external content changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="初始内容"
          fontSize={16}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    mockParseDocument.mockResolvedValue({
      version: '1.0',
      blocks: [{id: 'block-2', type: 'paragraph', text: '父级更新'}],
    });
    mockRenderHtml.mockResolvedValue('<p>父级更新[图片0]</p>');

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <H5TextDocumentEditor
          content="父级更新[图片0]"
          fontSize={16}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          textSegments={[
            {text: '父级', fontSize: 20, isItalic: true, color: '#123456'},
            {text: '更新[图片0]', fontSize: 20, isBold: true},
          ]}
          theme={theme}
        />,
      );
    });

    expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain('>父级</span>');
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain('>更新');
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain(
      'data-note-marker=\\"[图片0]\\"',
    );
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain(
      'data-note-font-size=\\"20\\"',
    );
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain(
      'data-note-is-bold=\\"true\\"',
    );
  });

  test('injects formatting command when toolbar command changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    mockInjectJavaScript.mockClear();

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
          formatCommand={{id: 1, type: 'bold'}}
          onChangeContent={() => {}}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain(
      'window.__cloudNoteH5ApplyFormat("bold")',
    );
  });
});
