import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {TrashList} from './TrashList';

const theme = generateThemeColors('薄荷生巧', false);

describe('TrashList', () => {
  test('prefers document plain text for note preview content', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <TrashList
          notes={[
            {
              id: 'trash-1',
              title: '已删除标题',
              content: '前文[图片0]后文',
              deletedAt: '2026-04-21T00:00:00.000Z',
              timestamp: new Date('2026-04-21T00:00:00.000Z'),
              document: {
                version: '1.0',
                blocks: [
                  {id: 'block-1', type: 'paragraph', text: '前文'},
                  {id: 'block-2', type: 'paragraph', text: '图片占位 1'},
                  {id: 'block-3', type: 'paragraph', text: '后文'},
                ],
                plainText: '前文\n\n图片占位 1\n\n后文',
              },
            },
          ]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={() => {}}
          onRestore={() => {}}
          onDelete={() => {}}
          theme={theme}
        />,
      );
    });

    const textValues = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .filter((value): value is string => typeof value === 'string');

    expect(textValues).toContain('前文\n\n图片占位 1\n\n后文');
    expect(textValues).not.toContain('前文[图片0]后文');
  });

  test('falls back to normalized mirror content when document is missing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <TrashList
          notes={[
            {
              id: 'trash-2',
              title: '旧笔记',
              content: '前文[音频0]后文',
              deletedAt: '2026-04-21T00:00:00.000Z',
              timestamp: new Date('2026-04-21T00:00:00.000Z'),
            },
          ]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={() => {}}
          onRestore={() => {}}
          onDelete={() => {}}
          theme={theme}
        />,
      );
    });

    const textValues = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .filter((value): value is string => typeof value === 'string');

    expect(textValues).toContain('前文\n\n音频占位 1\n\n后文');
  });
});
