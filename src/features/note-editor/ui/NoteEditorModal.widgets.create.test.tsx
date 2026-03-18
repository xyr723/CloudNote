import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import type {WidgetBlock} from '../../../entities/document/types';
import {
  flushNoteEditorModalEffects,
  mockH5EditorProps,
  resetNoteEditorModalTestState,
} from './NoteEditorModal.testUtils';
import {
  buildParagraphBlock,
  buildWidgetDocument,
  dispatchWidgetEvent,
  findLastButtonByText,
  openH5Mode,
  renderWidgetModal,
} from './NoteEditorModal.widgetTestUtils';

beforeEach(() => {
  resetNoteEditorModalTestState();
});

afterEach(async () => {
  await flushNoteEditorModalEffects();
});

const buildTodoWidgetBlock = (): WidgetBlock => {
  return {
    id: 'widget-draft-todo-list',
    type: 'widget',
    widget: {
      id: 'draft-todo-list',
      type: 'todo-list',
      title: '新的待办',
      props: {
        items: ['待办事项'],
      },
    },
  };
};

const widgetInsertCases: Array<{
  buttonLabel: string;
  name: string;
  widgetBlock: WidgetBlock;
}> = [
  {
    buttonLabel: '指标卡片',
    name: 'metric',
    widgetBlock: {
      id: 'widget-draft-metric',
      type: 'widget',
      widget: {
        id: 'draft-metric',
        type: 'metric',
        title: '关键指标',
        description: '补充说明',
        props: {
          value: '0',
          unit: '%',
        },
      },
    },
  },
  {
    buttonLabel: '引用块',
    name: 'quote',
    widgetBlock: {
      id: 'widget-draft-quote',
      type: 'widget',
      widget: {
        id: 'draft-quote',
        type: 'quote',
        title: '引用',
        description: '来源',
        props: {
          content: '在这里写下引用内容',
        },
      },
    },
  },
  {
    buttonLabel: '动作卡片',
    name: 'action-card',
    widgetBlock: {
      id: 'widget-draft-action-card',
      type: 'widget',
      widget: {
        id: 'draft-action-card',
        type: 'action-card',
        title: '动作卡片',
        description: '补充说明',
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
        props: {},
      },
    },
  },
  {
    buttonLabel: '时间线',
    name: 'timeline',
    widgetBlock: {
      id: 'widget-draft-timeline',
      type: 'widget',
      widget: {
        id: 'draft-timeline',
        type: 'timeline',
        title: '时间线',
        props: {
          items: [
            {time: '09:00', content: '开始整理需求'},
            {time: '11:00', content: '完成第一版方案'},
          ],
        },
      },
    },
  },
  {
    buttonLabel: '表单',
    name: 'form',
    widgetBlock: {
      id: 'widget-draft-form',
      type: 'widget',
      widget: {
        id: 'draft-form',
        type: 'form',
        title: '表单',
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
      },
    },
  },
];

test('opens widget type picker before appending todo widget in h5 mode', async () => {
  const initialDocument = buildWidgetDocument([buildParagraphBlock()]);
  const todoWidgetBlock = buildTodoWidgetBlock();
  const expectedDocument = buildWidgetDocument([
    initialDocument.blocks[0],
    todoWidgetBlock,
  ]);
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-insert-request',
    afterBlockId: null,
  });

  expect(onChangeDocument).not.toHaveBeenCalled();
  expect(
    renderer.root.findAll(
      node => node.type === Text && node.props.children === '选择组件类型',
    ).length,
  ).toBeGreaterThan(0);

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '待办清单').props.onPress();
  });

  expect(onChangeDocument).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '保存').props.onPress();
  });

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  expect(mockH5EditorProps.current?.document).toEqual({
    version: '1.0',
    blocks: [todoWidgetBlock],
  });
});

test.each(widgetInsertCases)(
  'saves $name widget after selecting $buttonLabel type in h5 mode',
  async ({buttonLabel, widgetBlock}) => {
    const initialDocument = buildWidgetDocument([buildParagraphBlock()]);
    const expectedDocument = buildWidgetDocument([
      initialDocument.blocks[0],
      widgetBlock,
    ]);
    const {onChangeDocument, renderer} = await renderWidgetModal({
      noteDocument: initialDocument,
    });

    await openH5Mode(renderer);
    await dispatchWidgetEvent({
      type: 'widget-insert-request',
      afterBlockId: null,
    });

    expect(onChangeDocument).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      findLastButtonByText(renderer, buttonLabel).props.onPress();
    });

    expect(onChangeDocument).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      findLastButtonByText(renderer, '保存').props.onPress();
    });

    expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  },
);
