import {Text, TextInput} from 'react-native';
import {
  actionCardWidget,
  findButtonByLabel,
  formWidget,
  metricWidget,
  quoteWidget,
  renderWidgetEditorSheet,
  timelineWidget,
  todoWidget,
  unsupportedWidget,
} from './WidgetEditorSheet.testUtils';

const renderCases = [
  {
    name: 'todo-list',
    placeholder: '组件标题',
    widget: todoWidget,
  },
  {
    name: 'metric',
    placeholder: '指标值',
    widget: metricWidget,
  },
  {
    name: 'action-card',
    placeholder: '按钮文案',
    widget: actionCardWidget,
  },
  {
    name: 'quote',
    placeholder: '引用正文',
    widget: quoteWidget,
  },
  {
    name: 'timeline',
    placeholder: '时间 1',
    widget: timelineWidget,
  },
  {
    name: 'form',
    placeholder: '字段标题 1',
    widget: formWidget,
  },
];

test.each(renderCases)(
  'renders $name editor for matching widgets',
  ({placeholder, widget}) => {
    const renderer = renderWidgetEditorSheet({widget});

    expect(renderer.root.findAllByProps({placeholder}).length).toBeGreaterThan(0);
  },
);

test('renders fallback editor for unsupported editor types', () => {
  const renderer = renderWidgetEditorSheet({
    widget: unsupportedWidget,
  });

  expect(
    renderer.root.findAll(
      node =>
        node.type === Text && node.props.children === '暂不支持编辑此类型组件',
    ).length,
  ).toBeGreaterThan(0);
});

test('shows create mode title and hides delete action in create mode', () => {
  const renderer = renderWidgetEditorSheet({
    mode: 'create',
    widget: todoWidget,
  });

  expect(
    renderer.root.findAll(
      node => node.type === Text && node.props.children === '新建组件',
    ).length,
  ).toBeGreaterThan(0);
  expect(
    renderer.root.findAll(
      node => node.type === Text && node.props.children === '删除组件',
    ).length,
  ).toBe(0);
});

test('keeps delete action visible in edit mode', () => {
  const renderer = renderWidgetEditorSheet({
    mode: 'edit',
    widget: todoWidget,
  });

  expect(
    renderer.root.findAll(
      node => node.type === Text && node.props.children === '删除组件',
    ).length,
  ).toBeGreaterThan(0);
});

test('renders todo-list editor title input in edit mode', () => {
  const renderer = renderWidgetEditorSheet({
    widget: todoWidget,
  });

  expect(
    renderer.root.findAllByType(TextInput).some(input => {
      return input.props.placeholder === '组件标题';
    }),
  ).toBe(true);
  expect(findButtonByLabel(renderer, '保存')).toBeDefined();
});
