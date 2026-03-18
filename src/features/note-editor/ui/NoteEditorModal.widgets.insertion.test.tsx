import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument, WidgetBlock} from '../../../entities/document/types';
import {
  flushNoteEditorModalEffects,
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

const buildExistingWidgetBlocks = (): WidgetBlock[] => {
  return [
    {
      id: 'widget-block-1',
      type: 'widget',
      widget: {
        id: 'widget-1',
        type: 'todo-list',
        title: '原待办',
        props: {
          items: ['事项一'],
        },
      },
    },
    {
      id: 'widget-block-2',
      type: 'widget',
      widget: {
        id: 'widget-2',
        type: 'metric',
        title: '原指标',
        description: '旧说明',
        props: {
          value: '10',
          unit: '%',
        },
      },
    },
  ];
};

const insertWidgetBlock = ({
  afterBlockId,
  blocks,
  widgetBlock,
}: {
  afterBlockId: string | null;
  blocks: RichDocument['blocks'];
  widgetBlock: WidgetBlock;
}): RichDocument['blocks'] => {
  if (afterBlockId === null) {
    const firstWidgetIndex = blocks.findIndex(block => block.type === 'widget');
    const insertIndex = firstWidgetIndex === -1 ? blocks.length : firstWidgetIndex;

    return [
      ...blocks.slice(0, insertIndex),
      widgetBlock,
      ...blocks.slice(insertIndex),
    ];
  }

  const targetIndex = blocks.findIndex(
    block => block.type === 'widget' && block.id === afterBlockId,
  );

  if (targetIndex === -1) {
    return [...blocks, widgetBlock];
  }

  return [
    ...blocks.slice(0, targetIndex + 1),
    widgetBlock,
    ...blocks.slice(targetIndex + 1),
  ];
};

const widgetInsertionCases: Array<{
  afterBlockId: string | null;
  buttonLabel: string;
  name: string;
  widgetBlock: WidgetBlock;
}> = [
  {
    afterBlockId: null,
    buttonLabel: '引用块',
    name: 'inserts new widget before the first existing widget when afterBlockId is null',
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
    afterBlockId: 'widget-block-1',
    buttonLabel: '表单',
    name: 'inserts new widget after the targeted widget block when afterBlockId is provided',
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
  {
    afterBlockId: 'missing-widget-block',
    buttonLabel: '指标卡片',
    name: 'falls back to appending the new widget when afterBlockId is stale',
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
];

test.each(widgetInsertionCases)('$name', async ({
  afterBlockId,
  buttonLabel,
  widgetBlock,
}) => {
  const initialDocument = buildWidgetDocument([
    buildParagraphBlock(),
    ...buildExistingWidgetBlocks(),
  ]);
  const expectedDocument = buildWidgetDocument(
    insertWidgetBlock({
      afterBlockId,
      blocks: initialDocument.blocks,
      widgetBlock,
    }),
  );
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-insert-request',
    afterBlockId,
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, buttonLabel).props.onPress();
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '保存').props.onPress();
  });

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
});

test('does not write document when widget type picker or create editor is cancelled', async () => {
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: buildWidgetDocument([buildParagraphBlock()]),
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-insert-request',
    afterBlockId: null,
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '取消').props.onPress();
  });

  expect(onChangeDocument).not.toHaveBeenCalled();

  await dispatchWidgetEvent({
    type: 'widget-insert-request',
    afterBlockId: null,
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '待办清单').props.onPress();
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '取消').props.onPress();
  });

  expect(onChangeDocument).not.toHaveBeenCalled();
});
