import {LocalHtmlEditorProvider} from './localHtmlEditorProvider';

describe('LocalHtmlEditorProvider', () => {
  test('parses plain text into paragraph document', async () => {
    const provider = new LocalHtmlEditorProvider();

    await expect(provider.parse('第一段\n\n第二段')).resolves.toEqual({
      version: '1.0',
      blocks: [
        {id: 'block-1', type: 'paragraph', text: '第一段'},
        {id: 'block-2', type: 'paragraph', text: '第二段'},
      ],
      plainText: '第一段\n\n第二段',
    });
  });

  test('serializes paragraph document back to plain text', async () => {
    const provider = new LocalHtmlEditorProvider();

    await expect(
      provider.serialize({
        version: '1.0',
        blocks: [
          {id: 'block-1', type: 'paragraph', text: '第一段'},
          {id: 'block-2', type: 'paragraph', text: '第二段'},
        ],
      }),
    ).resolves.toBe('第一段\n\n第二段');
  });

  test('renders paragraph, list and widget placeholder html', async () => {
    const provider = new LocalHtmlEditorProvider();

    const html = await provider.renderHtml({
      version: '1.0',
      blocks: [
        {id: 'block-1', type: 'paragraph', text: '段落内容'},
        {id: 'block-2', type: 'list', items: ['事项一', '事项二']},
        {
          id: 'block-3',
          type: 'widget',
          widget: {
            id: 'widget-1',
            type: 'todo-list',
            title: '待办组件',
            props: {items: 2},
          },
        },
      ],
    });

    expect(html).toContain('<p>段落内容</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>事项一</li>');
    expect(html).toContain('data-widget-id="widget-1"');
    expect(html).toContain('data-widget-type="todo-list"');
    expect(html).toContain('待办组件');
  });
});
