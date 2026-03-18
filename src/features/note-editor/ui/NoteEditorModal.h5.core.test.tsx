import ReactTestRenderer from 'react-test-renderer';
import {
  buildMirrorDocument,
  findTextButton,
  flushNoteEditorModalEffects,
  mockH5EditorProps,
  mockParseDocument,
  mockRenderHtml,
  resetNoteEditorModalTestState,
} from './NoteEditorModal.testUtils';
import {
  openH5Mode,
  openPreviewMode,
  renderNoteEditorModal,
} from './NoteEditorModal.renderTestUtils';

beforeEach(() => {
  resetNoteEditorModalTestState();
});

afterEach(async () => {
  await flushNoteEditorModalEffects();
});

test('renders note editor modal from feature entry', async () => {
  await renderNoteEditorModal({
    noteOverrides: {
      title: '',
      content: '',
    },
    visible: false,
  });
});

test('switches to h5 preview mode and renders current content through editor provider', async () => {
  mockRenderHtml.mockResolvedValue('<p>预览内容</p>');

  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '预览内容',
    },
  });

  await openPreviewMode(renderer);

  expect(mockParseDocument).not.toHaveBeenCalled();
  expect(mockRenderHtml).toHaveBeenCalledWith({
    version: '1.0',
    blocks: [{id: 'block-1', type: 'paragraph', text: '预览内容'}],
  });
  expect(
    renderer.root.findByProps({testID: 'mock-webview'}).props.children,
  ).toContain('<p>预览内容</p>');
});

test('switches to h5 edit mode and syncs webview text back into note state', async () => {
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

  await openH5Mode(renderer);

  expect(mockH5EditorProps.current?.content).toBe('原文');
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {
      text: '原文',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
  ]);

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onChangeState({
      content: 'H5正文',
      textSegments: [
        {text: 'H5', fontSize: 18, isItalic: true, color: '#123456'},
        {text: '正文', fontSize: 18, isBold: true},
      ],
    });
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(callbacks.onChangeContent).toHaveBeenCalledWith('H5正文');
  expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
    buildMirrorDocument('H5正文'),
  );
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: 'H5',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
    {
      text: '正文',
      fontSize: 18,
      isBold: true,
    },
  ]);
});

test('passes an empty widget document into h5 mode for plain notes', async () => {
  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
    },
  });

  await openH5Mode(renderer);

  expect(mockH5EditorProps.current?.document).toEqual({
    version: '1.0',
    blocks: [],
  });
});

test('allows h5 edit mode when note contains media markers', async () => {
  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '[图片0]',
      images: ['file:///image-0.jpg'],
    },
  });

  const h5Button = findTextButton(renderer, 'H5');

  expect(h5Button.props.disabled).toBeFalsy();

  await openH5Mode(renderer);

  expect(mockH5EditorProps.current?.content).toBe('[图片0]');
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {text: '[图片0]', fontSize: 16, isBold: false},
  ]);
});

test('preserves media markers when h5 editor syncs content back', async () => {
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '前文[图片0]后文',
      images: ['file:///image-0.jpg'],
      fontSize: 16,
      textSegments: [
        {
          text: '前文[图片0]后文',
          fontSize: 18,
          isBold: true,
        },
      ],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onChangeState({
      content: '前文[图片0]更新后文',
      textSegments: [
        {text: '前文[图片0]', fontSize: 18, isBold: true},
        {text: '更新后文', fontSize: 18, isItalic: true},
      ],
    });
  });

  expect(callbacks.onChangeContent).toHaveBeenCalledWith('前文[图片0]更新后文');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: '前文[图片0]',
      fontSize: 18,
      isBold: true,
    },
    {
      text: '更新后文',
      fontSize: 18,
      isItalic: true,
    },
  ]);
});

test('bridges bold toolbar command into h5 editor', async () => {
  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
      fontSize: 16,
      textSegments: [{text: '原文', fontSize: 16, isBold: false}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    findTextButton(renderer, '𝐁').props.onPress();
  });

  expect(mockH5EditorProps.current?.formatCommand).toEqual({
    id: 1,
    type: 'bold',
  });
});

test('bridges italic toolbar command into h5 editor', async () => {
  const {renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
      fontSize: 16,
      textSegments: [{text: '原文', fontSize: 16, isItalic: false}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    findTextButton(renderer, '𝐼').props.onPress();
  });

  expect(mockH5EditorProps.current?.formatCommand).toEqual({
    id: 1,
    type: 'italic',
  });
});

test('syncs increased font size into h5 editor through shared formatting state', async () => {
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '原文',
      fontSize: 16,
      textSegments: [
        {text: '原', fontSize: 14, isItalic: true},
        {text: '文', fontSize: 20, isBold: true},
      ],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    findTextButton(renderer, '𝐀+').props.onPress();
  });

  expect(callbacks.onChangeFontSize).toHaveBeenCalledWith(18);
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
  expect(mockH5EditorProps.current?.fontSize).toBe(18);
  expect(mockH5EditorProps.current?.textSegments).toEqual([
    {text: '原', fontSize: 18, isItalic: true},
    {text: '文', fontSize: 18, isBold: true},
  ]);
});
