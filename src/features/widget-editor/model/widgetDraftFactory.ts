import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';

const createDefaultId = (type: WidgetType): string => {
  return `draft-${type}`;
};

export const createWidgetDraft = (type: WidgetType): WidgetSchema => {
  if (type === 'todo-list') {
    return {
      id: createDefaultId(type),
      type,
      title: '新的待办',
      props: {
        items: ['待办事项'],
      },
    };
  }

  if (type === 'metric') {
    return {
      id: createDefaultId(type),
      type,
      title: '关键指标',
      description: '补充说明',
      props: {
        value: '0',
        unit: '%',
      },
    };
  }

  if (type === 'action-card') {
    return {
      id: createDefaultId(type),
      type,
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
    };
  }

  if (type === 'quote') {
    return {
      id: createDefaultId(type),
      type,
      title: '引用',
      description: '来源',
      props: {
        content: '在这里写下引用内容',
      },
    };
  }

  if (type === 'timeline') {
    return {
      id: createDefaultId(type),
      type,
      title: '时间线',
      props: {
        items: [
          {time: '09:00', content: '开始整理需求'},
          {time: '11:00', content: '完成第一版方案'},
        ],
      },
    };
  }

  if (type === 'form') {
    return {
      id: createDefaultId(type),
      type,
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
    };
  }

  return {
    id: createDefaultId(type),
    type,
    title: type,
    description: '暂不支持直接编辑此类型组件',
    props: {},
  };
};
