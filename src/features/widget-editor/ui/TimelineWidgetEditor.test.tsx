import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {TimelineWidgetEditor} from './TimelineWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const timelineWidget = {
  id: 'widget-1',
  type: 'timeline' as const,
  title: '发布计划',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
};

const findButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
  index: number = 0,
) => {
  return renderer.root.findAll(node => {
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

describe('TimelineWidgetEditor', () => {
  test('updates title item time and item content through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TimelineWidgetEditor
          widget={timelineWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '上线计划',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...timelineWidget,
      title: '上线计划',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '时间 1'}).props.onChangeText(
        '10:30',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...timelineWidget,
      props: {
        items: [
          {time: '10:30', content: '开始整理需求'},
          {time: '11:00', content: '完成第一版方案'},
        ],
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '内容 1'}).props.onChangeText(
        '确认上线范围',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...timelineWidget,
      props: {
        items: [
          {time: '09:00', content: '确认上线范围'},
          {time: '11:00', content: '完成第一版方案'},
        ],
      },
    });
  });

  test('adds and removes timeline items', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TimelineWidgetEditor
          widget={timelineWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '新增节点').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...timelineWidget,
      props: {
        items: [
          {time: '09:00', content: '开始整理需求'},
          {time: '11:00', content: '完成第一版方案'},
          {time: '', content: ''},
        ],
      },
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '删除节点').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...timelineWidget,
      props: {
        items: [{time: '11:00', content: '完成第一版方案'}],
      },
    });
  });

  test('creates first item when items are missing', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TimelineWidgetEditor
          widget={{
            id: 'widget-2',
            type: 'timeline',
            title: '空时间线',
            props: {},
          }}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '新增节点').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      id: 'widget-2',
      type: 'timeline',
      title: '空时间线',
      props: {
        items: [{time: '', content: ''}],
      },
    });
  });
});
