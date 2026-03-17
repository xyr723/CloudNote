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

  test('returns a minimal metric schema for metric widgets', () => {
    expect(createWidgetDraft('metric')).toEqual({
      id: 'draft-metric',
      type: 'metric',
      title: '关键指标',
      description: '补充说明',
      props: {
        value: '0',
        unit: '%',
      },
    });
  });

  test('returns a minimal fallback schema for unsupported editor types', () => {
    expect(createWidgetDraft('timeline')).toEqual({
      id: 'draft-timeline',
      type: 'timeline',
      title: 'timeline',
      description: '暂不支持直接编辑此类型组件',
      props: {},
    });
  });
});
