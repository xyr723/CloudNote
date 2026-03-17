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

  return {
    id: createDefaultId(type),
    type,
    title: type,
    description: '暂不支持直接编辑此类型组件',
    props: {},
  };
};
