import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {TodoListWidgetEditor} from './TodoListWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const todoWidget = {
  id: 'widget-1',
  type: 'todo-list' as const,
  title: '原待办',
  props: {
    items: ['事项一', '事项二'],
  },
};

describe('TodoListWidgetEditor', () => {
  test('updates title and item text through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TodoListWidgetEditor
          widget={todoWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '新的待办',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...todoWidget,
      title: '新的待办',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '事项 1'}).props.onChangeText(
        '新的事项',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...todoWidget,
      props: {
        items: ['新的事项', '事项二'],
      },
    });
  });

  test('adds and removes items through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TodoListWidgetEditor
          widget={todoWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    const findButtonByLabel = (label: string, index: number = 0) => {
      return renderer!.root.findAll(node => {
        if (node.type !== TouchableOpacity || node.props.disabled) {
          return false;
        }

        return (
          node.findAll(
            child => typeof child.props.children === 'string' && child.props.children === label,
          ).length > 0
        );
      })[index];
    };

    ReactTestRenderer.act(() => {
      findButtonByLabel('新增事项').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...todoWidget,
      props: {
        items: ['事项一', '事项二', ''],
      },
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel('删除事项').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...todoWidget,
      props: {
        items: ['事项二'],
      },
    });
  });
});
