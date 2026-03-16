import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {H5DocumentPreview} from './H5DocumentPreview';

jest.mock('./AutoHeightHtmlPreviewBlock', () => ({
  AutoHeightHtmlPreviewBlock: ({
    blocks,
  }: {
    blocks: Array<{id: string; type: string}>;
  }) => {
    const MockReact = require('react');
    const {Text: MockText} = require('react-native');

    return MockReact.createElement(
      MockText,
      {testID: 'mock-html-segment'},
      blocks.map(block => `${block.id}:${block.type}`).join('|'),
    );
  },
}));

jest.mock('../../widget-renderer/ui/WidgetRenderer', () => ({
  WidgetRenderer: ({
    widget,
  }: {
    widget: {id: string; title?: string; type: string};
  }) => {
    const MockReact = require('react');
    const {Text: MockText} = require('react-native');

    return MockReact.createElement(
      MockText,
      {testID: 'mock-widget'},
      `${widget.id}:${widget.title ?? widget.type}`,
    );
  },
}));

jest.mock('react-native-webview', () => {
  const MockReact = require('react');
  const {Text: MockText} = require('react-native');

  return {
    WebView: ({source}: {source: {html: string}}) =>
      MockReact.createElement(MockText, {testID: 'mock-webview'}, source.html),
  };
});

const theme = generateThemeColors('薄荷生巧', false);
const uniqueValues = (values: string[]): string[] => {
  return [...new Set(values)];
};

describe('H5DocumentPreview', () => {
  test('renders html segments and widget segments in document order', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5DocumentPreview
          document={{
            version: '1.0',
            blocks: [
              {id: 'block-1', type: 'paragraph', text: '预览内容'},
              {id: 'block-2', type: 'list', items: ['事项一']},
              {
                id: 'block-3',
                type: 'widget',
                widget: {
                  id: 'widget-1',
                  type: 'todo-list',
                  title: '待办组件',
                  props: {items: ['梳理需求']},
                },
              },
              {id: 'block-4', type: 'quote', text: '引用内容'},
            ],
          }}
          theme={theme}
        />,
      );
    });

    expect(
      uniqueValues(
        renderer!.root
          .findAllByProps({testID: 'mock-html-segment'})
          .map(node => node.props.children),
      ),
    ).toEqual(['block-1:paragraph|block-2:list', 'block-4:quote']);
    expect(
      uniqueValues(
        renderer!.root
          .findAllByProps({testID: 'mock-widget'})
          .map(node => node.props.children),
      ),
    ).toEqual(['widget-1:待办组件']);
  });

  test('re-renders mixed preview content when document changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <H5DocumentPreview
          document={{
            version: '1.0',
            blocks: [
              {id: 'block-1', type: 'paragraph', text: '初始内容'},
              {
                id: 'block-2',
                type: 'widget',
                widget: {
                  id: 'widget-1',
                  type: 'todo-list',
                  title: '初始组件',
                },
              },
            ],
          }}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <H5DocumentPreview
          document={{
            version: '1.0',
            blocks: [
              {id: 'block-3', type: 'heading', level: 2, text: '更新标题'},
              {
                id: 'block-4',
                type: 'widget',
                widget: {
                  id: 'widget-2',
                  type: 'metric',
                  title: '更新组件',
                },
              },
            ],
          }}
          theme={theme}
        />,
      );
    });

    const textValues = renderer!.root
      .findAll(node => node.type === Text)
      .map(node => node.props.children);

    expect(textValues).toEqual(
      expect.arrayContaining(['block-3:heading', 'widget-2:更新组件']),
    );
  });
});
