import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {ActionCardWidgetEditor} from './ActionCardWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const actionCardWidget = {
  id: 'widget-1',
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

describe('ActionCardWidgetEditor', () => {
  test('updates title description button label and payload through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ActionCardWidgetEditor
          widget={actionCardWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '今日入口',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      title: '今日入口',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '说明（可选）'}).props.onChangeText(
        '查看本周数据',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      description: '查看本周数据',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '按钮文案'}).props.onChangeText(
        '查看详情',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      actions: [
        {
          ...actionCardWidget.actions[0],
          label: '查看详情',
        },
      ],
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: 'URL'}).props.onChangeText(
        'https://cloudnote.app',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      actions: [
        {
          ...actionCardWidget.actions[0],
          payload: {
            url: 'https://cloudnote.app',
          },
        },
      ],
    });
  });

  test('switches action type from open-url to insert-text', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ActionCardWidgetEditor
          widget={actionCardWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '插入文本').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      actions: [
        {
          ...actionCardWidget.actions[0],
          type: 'insert-text',
          payload: {
            text: '插入内容',
          },
        },
      ],
    });
  });

  test('switches action type from insert-text to open-url', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ActionCardWidgetEditor
          widget={{
            ...actionCardWidget,
            actions: [
              {
                id: 'action-1',
                label: '插入模板',
                type: 'insert-text',
                payload: {
                  text: '今日复盘：',
                },
              },
            ],
          }}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '打开链接').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...actionCardWidget,
      actions: [
        {
          id: 'action-1',
          label: '插入模板',
          type: 'open-url',
          payload: {
            url: 'https://example.com',
          },
        },
      ],
    });
  });

  test('creates a default action when actions are missing', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ActionCardWidgetEditor
          widget={{
            id: 'widget-2',
            type: 'action-card',
            title: '无动作卡片',
            props: {},
          }}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: 'URL'}).props.onChangeText(
        'https://fallback.dev',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      id: 'widget-2',
      type: 'action-card',
      title: '无动作卡片',
      props: {},
      actions: [
        {
          id: 'action-1',
          label: '立即查看',
          type: 'open-url',
          payload: {
            url: 'https://fallback.dev',
          },
        },
      ],
    });
  });
});
