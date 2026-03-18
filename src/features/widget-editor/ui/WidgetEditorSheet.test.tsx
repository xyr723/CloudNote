import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import type {WidgetType} from '../../../entities/widget/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {WidgetEditorSheet} from './WidgetEditorSheet';

const theme = generateThemeColors('薄荷生巧', false);
const todoWidget = {
  id: 'widget-1',
  type: 'todo-list' as const,
  title: '原待办',
  props: {
    items: ['事项一'],
  },
};
const actionCardWidget = {
  id: 'widget-0',
  type: 'action-card' as const,
  title: '快捷入口',
  description: '查看今日数据',
  props: {},
  actions: [
    {
      id: 'action-1',
      label: '立即查看',
      type: 'open-url' as const,
      payload: {
        url: 'https://example.com',
      },
    },
  ],
};
const metricWidget = {
  id: 'widget-2',
  type: 'metric' as const,
  title: '指标卡片',
  description: '展示一个关键指标',
  props: {
    value: '99%',
  },
};
const quoteWidget = {
  id: 'widget-4',
  type: 'quote' as const,
  title: '摘录卡片',
  description: '乔布斯',
  props: {
    content: '保持饥饿，保持愚蠢',
  },
};
const timelineWidget = {
  id: 'widget-3',
  type: 'timeline' as const,
  title: '项目里程碑',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
};
const formWidget = {
  id: 'widget-5',
  type: 'form' as const,
  title: '表单卡片',
  props: {
    fields: [
      {
        id: 'field-1',
        label: '姓名',
        type: 'text' as const,
        placeholder: '请输入姓名',
      },
    ],
  },
};
const unsupportedWidget = {
  id: 'widget-6',
  type: 'unknown-widget' as WidgetType,
  title: '未知组件',
  description: '暂不支持直接编辑此类型组件',
  props: {},
};

const findButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });
};

describe('WidgetEditorSheet', () => {
  test('renders todo-list editor for todo-list widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={todoWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByType(TextInput).some(input => {
        return input.props.placeholder === '组件标题';
      }),
    ).toBe(true);
  });

  test('renders metric editor for metric widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={metricWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({placeholder: '指标值'}).length,
    ).toBeGreaterThan(0);
  });

  test('renders action-card editor for action-card widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={actionCardWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({placeholder: '按钮文案'}).length,
    ).toBeGreaterThan(0);
  });

  test('renders quote editor for quote widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={quoteWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({placeholder: '引用正文'}).length,
    ).toBeGreaterThan(0);
  });

  test('renders timeline editor for timeline widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={timelineWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({placeholder: '时间 1'}).length,
    ).toBeGreaterThan(0);
  });

  test('renders form editor for form widgets', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={formWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAllByProps({placeholder: '字段标题 1'}).length,
    ).toBeGreaterThan(0);
  });

  test('renders fallback editor for unsupported editor types', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={unsupportedWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node =>
          node.type === Text && node.props.children === '暂不支持编辑此类型组件',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('shows create mode title and hides delete action in create mode', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          mode="create"
          widget={todoWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '新建组件',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '删除组件',
      ).length,
    ).toBe(0);
  });

  test('triggers delete when delete button is pressed', () => {
    const onDelete = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={todoWidget}
          onClose={() => {}}
          onDelete={onDelete}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '删除组件').props.onPress();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('keeps delete action visible in edit mode', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          mode="edit"
          widget={todoWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '删除组件',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('does not submit changes when cancel button is pressed', () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={todoWidget}
          onClose={onClose}
          onDelete={() => {}}
          onSave={onSave}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '取消').props.onPress();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('saves the latest edited widget', () => {
    const onSave = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          widget={todoWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={onSave}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '编辑后的待办',
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '保存').props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith({
      ...todoWidget,
      title: '编辑后的待办',
    });
  });

  test('saves fallback widgets in create mode', () => {
    const onSave = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetEditorSheet
          visible
          mode="create"
          widget={formWidget}
          onClose={() => {}}
          onDelete={() => {}}
          onSave={onSave}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '保存').props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith(formWidget);
  });
});
