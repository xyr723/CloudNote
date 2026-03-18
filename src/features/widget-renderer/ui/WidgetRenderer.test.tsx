import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import type {WidgetType} from '../../../entities/widget/types';
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

  test('renders action-card widgets with open-url action details', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-4',
            type: 'action-card',
            title: '动作卡片',
            description: '补充说明',
            props: {},
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
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining([
        '动作卡片',
        '补充说明',
        '立即查看',
        'https://example.com',
      ]),
    );
  });

  test('renders action-card widgets with insert-text action details', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-7',
            type: 'action-card',
            title: '快速填充',
            description: '把模板文字插入正文',
            props: {},
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
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining([
        '快速填充',
        '把模板文字插入正文',
        '插入模板',
        '今日复盘：',
      ]),
    );
  });

  test('renders quote widgets with content and source', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-5',
            type: 'quote',
            title: '引用',
            description: '乔布斯',
            props: {
              content: '保持饥饿，保持愚蠢',
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['引用', '保持饥饿，保持愚蠢', '乔布斯']),
    );
  });

  test('hides quote source when source is missing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-6',
            type: 'quote',
            title: '今日摘录',
            props: {
              content: '真正重要的是提出正确的问题。',
            },
          }}
        />,
      );
    });

    const textChildren = readAllTextChildren(renderer!);

    expect(textChildren).toEqual(
      expect.arrayContaining(['今日摘录', '真正重要的是提出正确的问题。']),
    );
    expect(textChildren).not.toContain('乔布斯');
  });

  test('renders timeline widgets with multiple items', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-8',
            type: 'timeline',
            title: '项目里程碑',
            props: {
              items: [
                {time: '09:00', content: '开始整理需求'},
                {time: '11:00', content: '完成第一版方案'},
              ],
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining([
        '项目里程碑',
        '09:00',
        '开始整理需求',
        '11:00',
        '完成第一版方案',
      ]),
    );
  });

  test('renders timeline title when items are empty', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-9',
            type: 'timeline',
            title: '空时间线',
            props: {
              items: [],
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['空时间线']),
    );
  });

  test('renders form widgets with field labels and placeholders', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-10',
            type: 'form',
            title: '表单卡片',
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
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining([
        '表单卡片',
        '姓名',
        '请输入姓名',
        '补充说明',
        '写点备注',
      ]),
    );
  });

  test('renders form title when fields are empty', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-11',
            type: 'form',
            title: '空表单',
            props: {
              fields: [],
            },
          }}
        />,
      );
    });

    expect(readAllTextChildren(renderer!)).toEqual(
      expect.arrayContaining(['空表单']),
    );
  });

  test('renders unsupported widget types through fallback card', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WidgetRenderer
          theme={theme}
          widget={{
            id: 'widget-12',
            type: 'unknown-widget' as WidgetType,
            title: '未知组件',
            description: '暂不支持编辑此类型组件',
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
      expect.arrayContaining([
        '未知组件',
        '暂不支持编辑此类型组件',
        '查看详情',
        'unknown-widget',
      ]),
    );
  });
});
