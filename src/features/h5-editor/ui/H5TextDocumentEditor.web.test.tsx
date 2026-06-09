import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument} from '../../../entities/document/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {H5TextDocumentEditor} from './H5TextDocumentEditor.web';

const theme = generateThemeColors('薄荷生巧', false);

describe('H5TextDocumentEditor.web', () => {
  const originalWindow = (globalThis as {window?: unknown}).window;

  let iframeWindow: {postMessage: jest.Mock};
  let messageHandler: ((event: {data?: unknown; source?: unknown}) => void) | null;

  beforeEach(() => {
    iframeWindow = {
      postMessage: jest.fn(),
    };
    messageHandler = null;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        addEventListener: jest.fn(
          (
            type: string,
            listener: (event: {data?: unknown; source?: unknown}) => void,
          ) => {
            if (type === 'message') {
              messageHandler = listener;
            }
          },
        ),
        removeEventListener: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
      writable: true,
    });
  });

  test('renders shared bridge html into iframe and syncs updates through host commands', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5TextDocumentEditor
          content="原文"
          fontSize={16}
          theme={theme}
        />,
        {
          createNodeMock: element => {
            if (element.type === 'iframe') {
              return {
                contentWindow: iframeWindow,
              };
            }

            return null;
          },
        },
      );
    });

    const iframe = renderer!.root.findByType('iframe');

    expect(iframe.props.srcDoc).toContain('contenteditable="true"');
    expect(iframe.props.srcDoc).toContain('note-media-actions');

    await ReactTestRenderer.act(async () => {
      iframe.props.onLoad?.();
      renderer!.update(
        <H5TextDocumentEditor
          content="更新内容"
          fontSize={18}
          theme={theme}
        />,
      );
    });

    expect(iframeWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'cloudnote-h5-host',
        script: expect.stringContaining('更新内容'),
      }),
      '*',
    );
  });

  test('reconstructs richer document state from iframe bridge messages', async () => {
    const onChangeState = jest.fn();
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
    let renderer: ReactTestRenderer.ReactTestRenderer;

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
        {
          createNodeMock: element => {
            if (element.type === 'iframe') {
              return {
                contentWindow: iframeWindow,
              };
            }

            return null;
          },
        },
      );
    });

    const iframe = renderer!.root.findByType('iframe');

    await ReactTestRenderer.act(async () => {
      iframe.props.onLoad?.();
      messageHandler?.({
        data: {
          source: 'cloudnote-h5-editor',
          payload: JSON.stringify({
            type: 'content-change',
            content: '新标题\n\n事项一\n事项二',
            textSegments: [{text: '新标题\n\n事项一\n事项二', fontSize: 16}],
            textBlocks: [
              {id: 'heading-1', text: '新标题'},
              {id: 'list-1', text: '事项一\n事项二'},
            ],
          }),
        },
        source: iframeWindow,
      });
    });

    expect(onChangeState).toHaveBeenCalledWith({
      content: '新标题\n\n事项一\n事项二',
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
      textSegments: [{text: '新标题\n\n事项一\n事项二', fontSize: 16}],
    });
  });
});
