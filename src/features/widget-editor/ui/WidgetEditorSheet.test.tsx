import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
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
const metricWidget = {
  id: 'widget-2',
  type: 'metric' as const,
  title: '指标卡片',
  description: '展示一个关键指标',
  props: {
    value: '99%',
  },
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

  test('renders fallback editor for unsupported editor types', () => {
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
          widget={metricWidget}
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

    expect(onSave).toHaveBeenCalledWith(metricWidget);
  });
});
