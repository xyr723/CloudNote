import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {AutoHeightHtmlPreviewBlock} from './AutoHeightHtmlPreviewBlock';

const mockRenderHtml = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getEditorProvider: () => ({
      renderHtml: mockRenderHtml,
    }),
  },
}));

jest.mock('react-native-webview', () => {
  const MockReact = require('react');
  const {Text: MockText} = require('react-native');

  return {
    WebView: (props: {
      onMessage?: (event: {nativeEvent: {data: string}}) => void;
      source: {html: string};
      style?: unknown;
    }) =>
      MockReact.createElement(MockText, {testID: 'mock-webview', ...props}, props.source.html),
  };
});

const theme = generateThemeColors('薄荷生巧', false);

describe('AutoHeightHtmlPreviewBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderHtml.mockResolvedValue('<p>预览片段</p>');
  });

  test('renders segment html through editor provider and updates height from webview messages', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    const blocks = [
      {id: 'block-1', type: 'paragraph' as const, text: '第一段'},
      {id: 'block-2', type: 'quote' as const, text: '引用内容'},
    ];

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AutoHeightHtmlPreviewBlock blocks={blocks} theme={theme} />,
      );
    });

    expect(mockRenderHtml).toHaveBeenCalledWith({
      version: '1.0',
      blocks,
    });
    expect(
      renderer!.root.findByProps({testID: 'mock-webview'}).props.children,
    ).toContain('<p>预览片段</p>');

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByProps({testID: 'mock-webview'}).props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'content-height',
            height: 240,
          }),
        },
      });
    });

    expect(
      renderer!.root.findByProps({testID: 'mock-webview'}).props.style,
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({height: 240})]),
    );
  });
});
