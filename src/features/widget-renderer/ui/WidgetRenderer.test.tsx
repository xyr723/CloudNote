import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {WidgetRenderer} from './WidgetRenderer';

const theme = generateThemeColors('薄荷生巧', false);
const readAllTextChildren = (
  renderer: ReactTestRenderer.ReactTestRenderer,
): Array<string | number> => {
  return renderer.root
    .findAll(node => node.type === Text)
    .flatMap(node =>
      Array.isArray(node.props.children)
        ? node.props.children
        : [node.props.children],
    )
    .filter(
      (value): value is string | number =>
        typeof value === 'string' || typeof value === 'number',
    );
};

describe('WidgetRenderer', () => {
  test('renders todo-list widgets with their string items', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-1',
            type: 'todo-list',
            title: '建议下一步',
            props: {
              items: ['梳理需求', '补测试', '跑回归'],
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['建议下一步', '梳理需求', '补测试', '跑回归']),
    );
  });

  test('renders metric widgets with value unit and description', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-2',
            type: 'metric',
            title: '关键指标',
            description: '本周完成率',
            props: {
              value: '85',
              unit: '%',
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['关键指标', '85', '%', '本周完成率']),
    );
  });

  test('hides metric unit and description when optional fields are missing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-3',
            type: 'metric',
            title: '留存率',
            props: {
              value: '67',
            },
          }}
        />,
      );
    });

    const textChildren = readAllTextChildren(renderer!);

    expect(textChildren).toEqual(expect.arrayContaining(['留存率', '67']));
    expect(textChildren).not.toContain('%');
    expect(textChildren).not.toContain('本周完成率');
  });

  test('renders unsupported widget types through fallback card', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-4',
            type: 'timeline',
            title: '项目里程碑',
            description: '本周推进节点',
            actions: [{id: 'action-1', label: '查看详情', type: 'open-url'}],
            layout: {
              span: 2,
              minHeight: 180,
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['项目里程碑', '本周推进节点', '查看详情', 'timeline']),
    );
  });
});
