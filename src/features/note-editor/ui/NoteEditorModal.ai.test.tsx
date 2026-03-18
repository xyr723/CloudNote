import ReactTestRenderer from 'react-test-renderer';
import {TextInput} from 'react-native';
import {
  buildMirrorDocument,
  flushNoteEditorModalEffects,
  resetNoteEditorModalTestState,
} from './NoteEditorModal.testUtils';
import {
  findToolbarButtonByLabel,
  renderNoteEditorModal,
} from './NoteEditorModal.renderTestUtils';
import {completeNoteEditorTextWithAi} from '../model/noteEditorAi';

beforeEach(() => {
  resetNoteEditorModalTestState();
});

afterEach(async () => {
  await flushNoteEditorModalEffects();
});

test('syncs text segments after ai completion appends content', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue({
    text: '续写内容',
    metadata: {
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
      fontSize: 16,
      textSegments: [
        {
          text: '原文',
          fontSize: 18,
          isItalic: true,
          color: '#123456',
        },
      ],
    },
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🤖️').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '原文',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('原文续写内容');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: '原文续写内容',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
  ]);
  expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
    buildMirrorDocument('原文续写内容'),
  );
});

test('renders appended ai content before parent note rerenders', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue({
    text: '续写内容',
    metadata: {
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });
  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
      fontSize: 16,
      textSegments: [
        {
          text: '原文',
          fontSize: 18,
          isItalic: true,
          color: '#123456',
        },
      ],
    },
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🤖️').props.onPress();
    await Promise.resolve();
  });

  expect(
    renderer.root.findAll(
      node => node.type === TextInput && node.props.value === '原文续写内容',
    ).length,
  ).toBeGreaterThan(0);
});

test('appends ai widgets into draft document state', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue({
    text: '续写内容',
    widgets: [
      {
        id: 'todo-1',
        type: 'todo-list',
        title: '待办',
        props: {
          items: ['一', '二'],
        },
      },
    ],
    metadata: {
      provider: 'mock',
      model: 'mock-model',
      usedFallback: false,
    },
  });
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
    },
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🤖️').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
    buildMirrorDocument('原文续写内容', [
      {
        id: 'widget-todo-1',
        type: 'widget',
        widget: {
          id: 'todo-1',
          type: 'todo-list',
          title: '待办',
          props: {
            items: ['一', '二'],
          },
        },
      },
    ]),
  );
});
