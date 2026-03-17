import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {WidgetTypePickerSheet} from './WidgetTypePickerSheet';

const theme = generateThemeColors('薄荷生巧', false);

const findButtonByText = (
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

describe('WidgetTypePickerSheet', () => {
  test('renders all 6 widget types', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetTypePickerSheet
          visible
          onClose={() => {}}
          onSelect={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '待办清单',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '动作卡片',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '表单',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '引用块',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '指标卡片',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '时间线',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('calls onSelect when a widget type is pressed', () => {
    const onSelect = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetTypePickerSheet
          visible
          onClose={() => {}}
          onSelect={onSelect}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByText(renderer!, '待办清单').props.onPress();
    });

    expect(onSelect).toHaveBeenCalledWith('todo-list');
  });

  test('calls onClose when cancel is pressed', () => {
    const onClose = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <WidgetTypePickerSheet
          visible
          onClose={onClose}
          onSelect={() => {}}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByText(renderer!, '取消').props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
