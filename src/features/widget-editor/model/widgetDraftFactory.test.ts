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

  test('returns a minimal action-card schema for action-card widgets', () => {
    expect(createWidgetDraft('action-card')).toEqual({
      id: 'draft-action-card',
      type: 'action-card',
      title: '动作卡片',
      description: '补充说明',
      actions: [
        {
          id: 'action-1',
          label: '立即查看',
          type: 'open-url',
          payload: {
            url: 'https://example.com',
          },
        },
      ],
      props: {},
    });
  });

  test('returns a minimal quote schema for quote widgets', () => {
    expect(createWidgetDraft('quote')).toEqual({
      id: 'draft-quote',
      type: 'quote',
      title: '引用',
      description: '来源',
      props: {
        content: '在这里写下引用内容',
      },
    });
  });

  test('returns a minimal timeline schema for timeline widgets', () => {
    expect(createWidgetDraft('timeline')).toEqual({
      id: 'draft-timeline',
      type: 'timeline',
      title: '时间线',
      props: {
        items: [
          {time: '09:00', content: '开始整理需求'},
          {time: '11:00', content: '完成第一版方案'},
        ],
      },
    });
  });

  test('returns a minimal form schema for form widgets', () => {
    expect(createWidgetDraft('form')).toEqual({
      id: 'draft-form',
      type: 'form',
      title: '表单',
      props: {
        fields: [
          {
            id: 'field-1',
            label: '姓名',
            type: 'text',
            placeholder: '请输入姓名',
          },
          {
            id: 'field-2',
            label: '补充说明',
            type: 'textarea',
            placeholder: '写点备注',
          },
        ],
      },
    });
  });

  test('returns a minimal fallback schema for unsupported editor types', () => {
    expect(createWidgetDraft('unknown-widget' as never)).toEqual({
      id: 'draft-unknown-widget',
      type: 'unknown-widget',
      title: 'unknown-widget',
      description: '暂不支持直接编辑此类型组件',
      props: {},
    });
  });
});
