import ReactTestRenderer from 'react-test-renderer';
import {TextInput} from 'react-native';
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

test('opens widget editor in h5 mode and saves edited todo widget back to document', async () => {
  const initialDocument = buildWidgetDocument([
    buildParagraphBlock(),
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
  ]);
  const expectedDocument = buildWidgetDocument([
    initialDocument.blocks[0],
    {
      id: 'widget-block-1',
      type: 'widget',
      widget: {
        id: 'widget-1',
        type: 'todo-list',
        title: '编辑后的待办',
        props: {
          items: ['事项一'],
        },
      },
    },
  ]);
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-edit-request',
    blockId: 'widget-block-1',
    widgetId: 'widget-1',
    widgetType: 'todo-list',
  });

  expect(
    renderer.root.findByProps({testID: 'note-h5-widget-inline-panel'}),
  ).toBeTruthy();

  expect(
    renderer.root.findAllByType(TextInput).some(input => {
      return input.props.placeholder === '组件标题';
    }),
  ).toBe(true);

  await ReactTestRenderer.act(() => {
    renderer.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
      '编辑后的待办',
    );
  });

  await ReactTestRenderer.act(() => {
    findLastButtonByText(renderer, '保存').props.onPress();
  });

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  expect(mockH5EditorProps.current?.document).toEqual(expectedDocument);
});

test('removes widget block from document when h5 widget delete event arrives', async () => {
  const initialDocument = buildWidgetDocument([
    buildParagraphBlock(),
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
  ]);
  const expectedDocument = buildWidgetDocument([initialDocument.blocks[0]]);
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-delete',
    blockId: 'widget-block-1',
    widgetId: 'widget-1',
    widgetType: 'todo-list',
  });

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  expect(mockH5EditorProps.current?.document).toEqual(expectedDocument);
});

test('reorders widget blocks when h5 widget move event arrives', async () => {
  const initialDocument = buildWidgetDocument([
    buildParagraphBlock(),
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
        props: {
          value: '85',
        },
      },
    },
  ]);
  const expectedDocument = buildWidgetDocument([
    initialDocument.blocks[0],
    initialDocument.blocks[2],
    initialDocument.blocks[1],
  ]);
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  await dispatchWidgetEvent({
    type: 'widget-move',
    blockId: 'widget-block-2',
    widgetId: 'widget-2',
    widgetType: 'metric',
    direction: 'up',
  });

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  expect(mockH5EditorProps.current?.document).toEqual(expectedDocument);
});

test('reorders widget blocks to the requested text block when h5 reorder event arrives', async () => {
  const initialDocument = buildWidgetDocument(
    [
      buildParagraphBlock('paragraph-1', '前段'),
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
      buildParagraphBlock('paragraph-2', '后段'),
      {
        id: 'widget-block-2',
        type: 'widget',
        widget: {
          id: 'widget-2',
          type: 'metric',
          title: '原指标',
          props: {
            value: '85',
          },
        },
      },
    ],
    '前段\n\n后段',
  );
  const expectedDocument = buildWidgetDocument(
    [
      initialDocument.blocks[0],
      initialDocument.blocks[2],
      initialDocument.blocks[1],
      initialDocument.blocks[3],
    ],
    '前段\n\n后段',
  );
  const {onChangeDocument, renderer} = await renderWidgetModal({
    noteDocument: initialDocument,
  });

  await openH5Mode(renderer);
  expect(mockH5EditorProps.current?.document).toEqual(initialDocument);
  await dispatchWidgetEvent({
    type: 'widget-reorder-request',
    blockId: 'widget-block-1',
    widgetId: 'widget-1',
    widgetType: 'todo-list',
    afterBlockId: 'paragraph-2',
  } as any);

  expect(onChangeDocument).toHaveBeenCalledWith(expectedDocument);
  expect(mockH5EditorProps.current?.document).toEqual(expectedDocument);
});
