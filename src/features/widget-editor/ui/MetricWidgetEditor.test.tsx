import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {MetricWidgetEditor} from './MetricWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const metricWidget = {
  id: 'widget-1',
  type: 'metric' as const,
  title: '转化率',
  description: '较上周提升',
  props: {
    value: '85',
    unit: '%',
  },
};

describe('MetricWidgetEditor', () => {
  test('updates title value unit and description through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MetricWidgetEditor
          widget={metricWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '完成率',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      title: '完成率',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '指标值'}).props.onChangeText(
        '92',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      props: {
        value: '92',
        unit: '%',
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '单位（可选）'}).props.onChangeText(
        '分',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      props: {
        value: '85',
        unit: '分',
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '说明（可选）'}).props.onChangeText(
        '本周累计',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      description: '本周累计',
      props: {
        value: '85',
        unit: '%',
      },
    });
  });

  test('normalizes empty unit and description to undefined', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MetricWidgetEditor
          widget={metricWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '单位（可选）'}).props.onChangeText(
        '',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      props: {
        value: '85',
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '说明（可选）'}).props.onChangeText(
        '',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...metricWidget,
      description: undefined,
      props: {
        value: '85',
        unit: '%',
      },
    });
  });
});
