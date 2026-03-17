import {createWidgetDraft} from './widgetDraftFactory';

describe('createWidgetDraft', () => {
  test('returns a minimal todo-list schema for todo-list widgets', () => {
    expect(createWidgetDraft('todo-list')).toEqual({
      id: 'draft-todo-list',
      type: 'todo-list',
      title: '新的待办',
      props: {
        items: ['待办事项'],
      },
    });
  });

  test('returns a minimal fallback schema for unsupported editor types', () => {
    expect(createWidgetDraft('metric')).toEqual({
      id: 'draft-metric',
      type: 'metric',
      title: 'metric',
      description: '暂不支持直接编辑此类型组件',
      props: {},
    });
  });
});
