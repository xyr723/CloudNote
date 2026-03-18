import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {NoteEditorPreviewPane} from './NoteEditorPreviewPane';

jest.mock('../../h5-editor/ui/H5DocumentPreview', () => ({
  H5DocumentPreview: ({
    document,
  }: {
    document: {
      blocks: Array<{
        text?: string;
        type?: string;
        widget?: {title?: string; type: string};
      }>;
    };
  }) => {
    const MockReact = require('react');
    const {Text: MockText} = require('react-native');

    return MockReact.createElement(
      MockText,
      {testID: 'preview-document'},
      document.blocks
        .map(block =>
          block.type === 'widget'
            ? `[widget:${block.widget?.title ?? block.widget?.type}]`
            : (block.text ?? ''),
        )
        .join('|'),
    );
  },
}));

describe('NoteEditorPreviewPane', () => {
  test('renders media placeholder blocks from the resolved live document directly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NoteEditorPreviewPane
          document={{
            version: '1.0',
            plainText: '开头\n\n图片占位 1\n\n中间\n\n音频占位 2\n\n结尾',
            blocks: [
              {
                id: 'block-1',
                type: 'paragraph',
                text: '开头',
              },
              {
                id: 'block-2',
                type: 'paragraph',
                text: '图片占位 1',
              },
              {
                id: 'block-3',
                type: 'paragraph',
                text: '中间',
              },
              {
                id: 'block-4',
                type: 'paragraph',
                text: '音频占位 2',
              },
              {
                id: 'block-5',
                type: 'paragraph',
                text: '结尾',
              },
            ],
          }}
          theme={generateThemeColors('薄荷生巧', false)}
        />,
      );
    });

    expect(
      renderer!.root.findByProps({testID: 'preview-document'}).props.children,
    ).toBe('开头|图片占位 1|中间|音频占位 2|结尾');
  });

  test('renders resolved text and widget blocks from the provided document', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NoteEditorPreviewPane
          document={{
            version: '1.0',
            plainText: '最新正文\n\n图片占位 1',
            blocks: [
              {
                id: 'block-1',
                type: 'paragraph',
                text: '最新正文',
              },
              {
                id: 'block-2',
                type: 'paragraph',
                text: '图片占位 1',
              },
              {
                id: 'widget-1',
                type: 'widget',
                widget: {
                  id: 'todo-1',
                  type: 'todo-list',
                  title: '待办',
                  props: {
                    items: ['一', '二'],
                  },
                },
              },
            ],
          }}
          theme={generateThemeColors('薄荷生巧', false)}
        />,
      );
    });

    expect(
      renderer!.root.findByProps({testID: 'preview-document'}).props.children,
    ).toBe('最新正文|图片占位 1|[widget:待办]');
  });

  test('renders the provided widget-only document as-is', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NoteEditorPreviewPane
          document={{
            version: '1.0',
            blocks: [
              {
                id: 'widget-1',
                type: 'widget',
                widget: {
                  id: 'todo-1',
                  type: 'todo-list',
                  title: '待办',
                  props: {
                    items: ['一', '二'],
                  },
                },
              },
            ],
          }}
          theme={generateThemeColors('薄荷生巧', false)}
        />,
      );
    });

    expect(
      renderer!.root.findByProps({testID: 'preview-document'}).props.children,
    ).toBe('[widget:待办]');
  });
});
