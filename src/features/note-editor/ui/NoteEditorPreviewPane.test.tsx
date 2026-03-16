import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {NoteEditorPreviewPane} from './NoteEditorPreviewPane';

const mockParseDocument = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getEditorProvider: () => ({
      parse: mockParseDocument,
    }),
  },
}));

jest.mock('../../h5-editor/ui/H5DocumentPreview', () => ({
  H5DocumentPreview: ({
    document,
  }: {
    document: {blocks: Array<{text?: string}>};
  }) => {
    const MockReact = require('react');
    const {Text: MockText} = require('react-native');

    return MockReact.createElement(
      MockText,
      {testID: 'preview-document'},
      document.blocks.map(block => block.text ?? '').join('|'),
    );
  },
}));

describe('NoteEditorPreviewPane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseDocument.mockResolvedValue({
      version: '1.0',
      blocks: [{id: 'block-1', type: 'paragraph', text: '预览内容'}],
    });
  });

  test('parses content markers into preview placeholders before rendering', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NoteEditorPreviewPane
          content={'开头[图片0]中间[音频1]结尾'}
          theme={generateThemeColors('薄荷生巧', false)}
        />,
      );
    });

    expect(mockParseDocument).toHaveBeenCalledWith(
      '开头\n\n图片占位 1\n\n中间\n\n音频占位 2\n\n结尾',
    );
    expect(
      renderer!.root.findByProps({testID: 'preview-document'}).props.children,
    ).toContain('预览内容');
  });
});
