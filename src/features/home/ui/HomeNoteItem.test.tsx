import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Image, Text} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {HomeNoteItem} from './HomeNoteItem';

const theme = generateThemeColors('薄荷生巧', false);

describe('HomeNoteItem', () => {
  test('renders document plain text preview instead of raw marker content', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HomeNoteItem
          note={{
            id: 'note-1',
            title: '标题',
            content: '前文[图片0][音频0]后文',
            images: ['file:///image.jpg'],
            timestamp: new Date('2026-04-21T00:00:00.000Z'),
            document: {
              version: '1.0',
              blocks: [
                {id: 'block-1', type: 'paragraph', text: '前文'},
                {id: 'block-2', type: 'paragraph', text: '图片占位 1'},
                {id: 'block-3', type: 'paragraph', text: '音频占位 1'},
                {id: 'block-4', type: 'paragraph', text: '后文'},
              ],
              plainText: '前文\n\n图片占位 1\n\n音频占位 1\n\n后文',
            },
          }}
          onLongPress={() => {}}
          onPress={() => {}}
          theme={theme}
        />,
      );
    });

    const textValues = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(textValues).toContain('前文\n\n图片占位 1\n\n音频占位 1\n\n后文');
    expect(textValues).not.toContain('前文[图片0][音频0]后文');
    expect(renderer!.root.findAllByType(Image)).toHaveLength(1);
  });
});
