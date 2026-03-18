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
  expect(mockH5EditorProps.current?.document).toEqual({
    version: '1.0',
    blocks: [expectedDocument.blocks[1]],
  });
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
  expect(mockH5EditorProps.current?.document).toEqual({
    version: '1.0',
    blocks: [],
  });
});
