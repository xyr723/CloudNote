import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {RichDocument} from '../../../entities/document/types';
import type {TextSegment} from '../../../entities/note/types';
import {H5TextDocumentEditor} from './H5TextDocumentEditor';

const mockInjectJavaScript = jest.fn();
const mockGetEditorProvider = jest.fn(() => {
  throw new Error('provider should not be used in H5TextDocumentEditor');
});

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getEditorProvider: mockGetEditorProvider,
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
const widgetDocument: RichDocument = {
  version: '1.0',
  blocks: [
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: '正文',
    },
    {
      id: 'widget-block-1',
      type: 'widget',
      widget: {
        id: 'widget-1',
        type: 'todo-list',
        title: '待办组件',
        props: {
          items: ['一', '二'],
        },
      },
    },
  ],
  plainText: '正文',
};
const multiWidgetDocument: RichDocument = {
  version: '1.0',
  blocks: [
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: '正文',
    },
    {
      id: 'widget-block-1',
      type: 'widget',
      widget: {
        id: 'widget-1',
        type: 'todo-list',
        title: '待办组件',
        props: {
          items: ['一', '二'],
        },
      },
    },
    {
      id: 'widget-block-2',
      type: 'widget',
      widget: {
        id: 'widget-2',
        type: 'metric',
        title: '指标组件',
        props: {
          value: '85',
        },
      },
    },
  ],
  plainText: '正文',
};
const interleavedWidgetDocument: RichDocument = {
  version: '1.0',
  blocks: [
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: '首段',
    },
    {
      id: 'widget-block-1',
      type: 'widget',
      widget: {
        id: 'widget-1',
        type: 'todo-list',
        title: '待办组件',
        props: {
          items: ['一', '二'],
        },
      },
    },
    {
      id: 'paragraph-2',
      type: 'paragraph',
      text: '尾段',
    },
    {
      id: 'widget-block-2',
      type: 'widget',
      widget: {
        id: 'widget-2',
        type: 'metric',
        title: '指标组件',
        props: {
          value: '85',
        },
      },
    },
  ],
  plainText: '首段\n\n尾段',
};

describe('H5TextDocumentEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders editable html from local markup without editor provider', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor content="初始内容" fontSize={16} theme={theme} />,
      );
    });

    expect(mockGetEditorProvider).not.toHaveBeenCalled();
    expect(
      renderer!.root.findByProps({testID: 'mock-h5-text-editor'}).props
        .children,
    ).toContain('contenteditable="true"');
  });

  test('renders rich text segments with style metadata', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
          onChangeState={() => {}}
          textSegments={richTextSegments}
          theme={theme}
        />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;

    expect(renderedHtml).toContain('class="note-text-segment"');
    expect(renderedHtml).toContain('data-note-font-size="18"');
    expect(renderedHtml).toContain('data-note-is-italic="true"');
    expect(renderedHtml).toContain('data-note-is-bold="true"');
    expect(renderedHtml).toContain('data-note-color="#123456"');
  });

  test('syncs text state back through onChangeState only', async () => {
    const onChangeContent = jest.fn();
    const onChangeState = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="初始内容"
          fontSize={16}
          onChangeState={onChangeState}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
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

    expect(onChangeState).toHaveBeenCalledWith({
      content: '更新内容',
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            text: '更新内容',
          },
        ],
        plainText: '更新内容',
      },
      textSegments: [
        {text: '更新', fontSize: 18, isItalic: true},
        {text: '内容', fontSize: 18, isBold: true},
      ],
    });
    expect(onChangeContent).not.toHaveBeenCalled();
  });

  test('reconstructs document-aware state from h5 text block snapshots', async () => {
    const onChangeState = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const structuredDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'heading-1',
          type: 'heading',
          level: 2,
          text: '旧标题',
        },
        {
          id: 'widget-block-1',
          type: 'widget',
          widget: {
            id: 'widget-1',
            type: 'todo-list',
            title: '待办组件',
            props: {
              items: ['一', '二'],
            },
          },
        },
        {
          id: 'list-1',
          type: 'list',
          items: ['旧事项'],
          ordered: true,
        },
      ],
      plainText: '旧标题\n\n旧事项',
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="旧标题\n\n旧事项"
          document={structuredDocument}
          fontSize={16}
          onChangeState={onChangeState}
          textSegments={[{text: '旧标题\n\n旧事项', fontSize: 16}]}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
          nativeEvent: {
            data: JSON.stringify({
              type: 'content-change',
              content: '新标题\n\n事项一\n事项二',
              textSegments: [{text: '新标题\n\n事项一\n事项二', fontSize: 16}],
              textBlocks: [
                {id: 'heading-1', text: '新标题'},
                {id: 'list-1', text: '事项一\n事项二'},
              ],
            }),
          },
        });
    });

    expect(onChangeState).toHaveBeenCalledWith({
      content: '新标题\n\n事项一\n事项二',
      textSegments: [{text: '新标题\n\n事项一\n事项二', fontSize: 16}],
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            level: 2,
            text: '新标题',
          },
          structuredDocument.blocks[1],
          {
            id: 'list-1',
            type: 'list',
            items: ['事项一', '事项二'],
            ordered: true,
          },
        ],
        plainText: '新标题\n\n事项一\n事项二',
      },
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
          onDeleteMedia={onDeleteMedia}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
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
      onSelectionChange,
      theme,
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor {...editorProps} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
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
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="前文[图片0]后文[音频1]"
          fontSize={16}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;

    expect(renderedHtml).toContain('data-note-marker="[图片0]"');
    expect(renderedHtml).toContain('data-note-marker="[音频1]"');
    expect(renderedHtml).toContain('contenteditable="false"');
  });

  test('renders inline media action buttons and hidden file picker inside the h5 editor shell', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="正文"
          fontSize={16}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;

    expect(renderedHtml).toContain(
      'data-note-media-insert-action="pick-image-file"',
    );
    expect(renderedHtml).toContain(
      'data-note-media-insert-action="pick-image"',
    );
    expect(renderedHtml).toContain(
      'data-note-media-insert-action="capture-image"',
    );
    expect(renderedHtml).toContain(
      'data-note-media-insert-action="record-audio"',
    );
    expect(renderedHtml).toContain('id="note-media-file-input"');
    expect(renderedHtml).toContain('type="file"');
    expect(renderedHtml).toContain('accept="image/*"');
    expect(renderedHtml).toContain('multiple');
    expect(renderedHtml).toContain('>上传图片<');
    expect(renderedHtml).toContain('>相册<');
    expect(renderedHtml).toContain('>拍照<');
    expect(renderedHtml).toContain('>录音<');
  });

  test('renders widget placeholder metadata when document contains widget blocks', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const editorProps: any = {
      content: '正文',
      document: widgetDocument,
      fontSize: 16,
      onChangeContent: () => {},
      onChangeState: () => {},
      theme,
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor {...editorProps} />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;

    expect(renderedHtml).toContain('data-widget-block-id="widget-block-1"');
    expect(renderedHtml).toContain('data-widget-id="widget-1"');
    expect(renderedHtml).toContain('data-widget-type="todo-list"');
    expect(renderedHtml).toContain('contenteditable="false"');
    expect(renderedHtml).toContain('待办组件');
    expect(renderedHtml).toContain('data-widget-action="edit"');
    expect(renderedHtml).toContain('data-widget-action="delete"');
  });

  test('renders insert buttons after text blocks and widget blocks', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content={interleavedWidgetDocument.plainText ?? '首段\n\n尾段'}
          document={interleavedWidgetDocument}
          fontSize={16}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;
    const insertButtonCount = (
      renderedHtml.match(/data-widget-insert-request="true"/g) ?? []
    ).length;

    expect(insertButtonCount).toBeGreaterThanOrEqual(3);
    expect(renderedHtml).toContain(
      'data-widget-insert-after-block-id="paragraph-1"',
    );
    expect(renderedHtml).toContain(
      'data-widget-insert-after-block-id="widget-block-1"',
    );
    expect(renderedHtml).toContain(
      'data-widget-insert-after-block-id="paragraph-2"',
    );
    expect(renderedHtml).toContain(
      'data-widget-insert-after-block-id="widget-block-2"',
    );
  });

  test('renders widget move actions with boundary disabled states and drag handles', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="正文"
          document={multiWidgetDocument}
          fontSize={16}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    const renderedHtml = renderer!.root.findByProps({
      testID: 'mock-h5-text-editor',
    }).props.children;

    expect(
      (renderedHtml.match(/data-widget-action="move-up"/g) ?? []).length,
    ).toBe(2);
    expect(
      (renderedHtml.match(/data-widget-action="move-down"/g) ?? []).length,
    ).toBe(2);
    expect(renderedHtml).toContain('data-widget-action="move-up" disabled');
    expect(renderedHtml).toContain('data-widget-action="move-down" disabled');
    expect(
      (renderedHtml.match(/data-widget-drag-handle="true"/g) ?? []).length,
    ).toBe(2);
    expect(renderedHtml).toContain('draggable="true"');
    expect(renderedHtml).toContain('>上移<');
    expect(renderedHtml).toContain('>下移<');
    expect(renderedHtml).toContain('>拖拽<');
  });

  test('ignores legacy widget-select messages', async () => {
    const onWidgetEvent = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const editorProps: any = {
      content: '正文',
      fontSize: 16,
      onWidgetEvent,
      theme,
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor {...editorProps} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
          nativeEvent: {
            data: JSON.stringify({
              type: 'widget-select',
              blockId: 'widget-block-1',
              widgetId: 'widget-1',
              widgetType: 'todo-list',
            }),
          },
        });
    });

    expect(onWidgetEvent).not.toHaveBeenCalled();
  });

  test('forwards widget action messages to react native', async () => {
    const onWidgetEvent = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const editorProps: any = {
      content: '正文',
      fontSize: 16,
      onChangeContent: () => {},
      onWidgetEvent,
      theme,
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor {...editorProps} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      const onMessage = renderer!.root.findByProps({
        testID: 'mock-h5-text-editor',
      }).props.onMessage;

      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'widget-edit-request',
            blockId: 'widget-block-1',
            widgetId: 'widget-1',
            widgetType: 'todo-list',
          }),
        },
      });
      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'widget-delete',
            blockId: 'widget-block-1',
            widgetId: 'widget-1',
            widgetType: 'todo-list',
          }),
        },
      });
      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'widget-insert-request',
            afterBlockId: 'widget-block-1',
          }),
        },
      });
      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'widget-move',
            blockId: 'widget-block-1',
            widgetId: 'widget-1',
            widgetType: 'todo-list',
            direction: 'up',
          }),
        },
      });
      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'widget-reorder-request',
            blockId: 'widget-block-2',
            widgetId: 'widget-2',
            widgetType: 'metric',
            afterBlockId: 'paragraph-1',
          }),
        },
      });
    });

    expect(onWidgetEvent).toHaveBeenNthCalledWith(1, {
      type: 'widget-edit-request',
      blockId: 'widget-block-1',
      widgetId: 'widget-1',
      widgetType: 'todo-list',
    });
    expect(onWidgetEvent).toHaveBeenNthCalledWith(2, {
      type: 'widget-delete',
      blockId: 'widget-block-1',
      widgetId: 'widget-1',
      widgetType: 'todo-list',
    });
    expect(onWidgetEvent).toHaveBeenNthCalledWith(3, {
      type: 'widget-insert-request',
      afterBlockId: 'widget-block-1',
    });
    expect(onWidgetEvent).toHaveBeenNthCalledWith(4, {
      type: 'widget-move',
      blockId: 'widget-block-1',
      widgetId: 'widget-1',
      widgetType: 'todo-list',
      direction: 'up',
    });
    expect(onWidgetEvent).toHaveBeenNthCalledWith(5, {
      type: 'widget-reorder-request',
      blockId: 'widget-block-2',
      widgetId: 'widget-2',
      widgetType: 'metric',
      afterBlockId: 'paragraph-1',
    });
  });

  test('forwards media insert request messages to react native', async () => {
    const onMediaInsertRequest = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="正文"
          fontSize={16}
          onMediaInsertRequest={onMediaInsertRequest}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
          nativeEvent: {
            data: JSON.stringify({
              type: 'media-insert-request',
              action: 'pick-image',
            }),
          },
        });
    });

    expect(onMediaInsertRequest).toHaveBeenCalledWith({
      type: 'media-insert-request',
      action: 'pick-image',
    });
  });

  test('forwards inline image asset insert messages to react native', async () => {
    const onMediaInsertRequest = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="正文"
          fontSize={16}
          onMediaInsertRequest={onMediaInsertRequest}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
          nativeEvent: {
            data: JSON.stringify({
              type: 'media-insert-request',
              action: 'insert-image-assets',
              assets: [{uri: 'data:image/png;base64,abc'}],
            }),
          },
        });
    });

    expect(onMediaInsertRequest).toHaveBeenCalledWith({
      type: 'media-insert-request',
      action: 'insert-image-assets',
      assets: [{uri: 'data:image/png;base64,abc'}],
    });
  });

  test('injects updated html when external content changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="初始内容"
          fontSize={16}
          onChangeState={() => {}}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <H5TextDocumentEditor
          content="父级更新[图片0]"
          fontSize={16}
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

  test('skips resync when parent echoes back mirrored text blocks with unchanged widgets', async () => {
    const onChangeState = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          document={widgetDocument}
          fontSize={16}
          onChangeState={onChangeState}
          textSegments={[{text: '原文', fontSize: 16}]}
          theme={theme}
        />,
      );
    });

    mockInjectJavaScript.mockClear();

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({testID: 'mock-h5-text-editor'})
        .props.onMessage({
          nativeEvent: {
            data: JSON.stringify({
              type: 'content-change',
              content: '更新正文',
              textSegments: [{text: '更新正文', fontSize: 16}],
            }),
          },
        });
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <H5TextDocumentEditor
          content="更新正文"
          document={{
            ...widgetDocument,
            blocks: [
              {
                id: 'paragraph-1',
                type: 'paragraph',
                text: '更新正文',
              },
              widgetDocument.blocks[1],
            ],
            plainText: '更新正文',
          }}
          fontSize={16}
          onChangeState={onChangeState}
          textSegments={[{text: '更新正文', fontSize: 16}]}
          theme={theme}
        />,
      );
    });

    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  test('injects formatting command when toolbar command changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
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
