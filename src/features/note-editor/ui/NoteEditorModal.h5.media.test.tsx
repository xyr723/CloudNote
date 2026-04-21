import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {
  buildMirrorDocument,
  flushNoteEditorModalEffects,
  mockCaptureImage,
  mockH5EditorProps,
  mockPickImagesFromLibrary,
  mockSaveAttachment,
  resetNoteEditorModalTestState,
} from './NoteEditorModal.testUtils';
import {
  findImageToolbarButton,
  findLastButtonByText,
  openH5Mode,
  renderNoteEditorModal,
} from './NoteEditorModal.renderTestUtils';

beforeEach(() => {
  resetNoteEditorModalTestState();
});

afterEach(async () => {
  await flushNoteEditorModalEffects();
});

test('deletes image markers from h5 editor through native media pipeline', async () => {
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '前文[图片0]后文',
      images: ['file:///image-0.jpg'],
      fontSize: 16,
      textSegments: [{text: '前文[图片0]后文', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onDeleteMedia?.({
      kind: 'image',
      index: 0,
    });
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 200);
    });
  });

  expect(callbacks.onChangeContent).toHaveBeenCalledWith('前文后文');
  expect(callbacks.onChangeImages).toHaveBeenCalledWith([]);
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: '前文后文', fontSize: 18, isBold: true},
  ]);
});

test('deletes audio markers from h5 editor through native media pipeline', async () => {
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: '前文[音频0]后文',
      audios: ['file:///audio-0.mp3'],
      fontSize: 16,
      textSegments: [{text: '前文[音频0]后文', fontSize: 18, isItalic: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onDeleteMedia?.({
      kind: 'audio',
      index: 0,
    });
    await Promise.resolve();
  });

  expect(callbacks.onChangeContent).toHaveBeenCalledWith('前文后文');
  expect(callbacks.onChangeAudios).toHaveBeenCalledWith([]);
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: '前文后文', fontSize: 18, isItalic: true},
  ]);
});

test('inserts image markers in h5 mode through native image entry flow', async () => {
  mockSaveAttachment.mockResolvedValue('file:///image-0.jpg');
  mockPickImagesFromLibrary.mockResolvedValue([{uri: 'file:///source-0.jpg'}]);

  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    findImageToolbarButton(renderer).props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    await findLastButtonByText(renderer, '从相册选择').props.onPress();
  });

  expect(mockPickImagesFromLibrary).toHaveBeenCalledTimes(1);
  expect(mockSaveAttachment).toHaveBeenCalledWith({
    index: 0,
    kind: 'image',
    noteId: expect.stringMatching(/^temp_/),
    preferredExtension: undefined,
    uri: 'file:///source-0.jpg',
  });
  expect(callbacks.onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
  ]);
});

test('inserts audio markers in h5 mode through native recording flow', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      id: 'note-1',
      content: 'abcd',
      audios: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    findLastButtonByText(renderer, '🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findLastButtonByText(renderer, '停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(callbacks.onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
  ]);
});

test('inserts image markers in h5 mode through internal media pick request', async () => {
  mockSaveAttachment.mockResolvedValue('file:///image-0.jpg');
  mockPickImagesFromLibrary.mockResolvedValue([{uri: 'file:///source-0.jpg'}]);

  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onMediaInsertRequest?.({
      type: 'media-insert-request',
      action: 'pick-image',
    });
    await Promise.resolve();
  });

  expect(mockPickImagesFromLibrary).toHaveBeenCalledTimes(1);
  expect(callbacks.onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
  ]);
});

test('inserts image markers in h5 mode through inline image asset requests', async () => {
  mockSaveAttachment.mockResolvedValue('file:///image-inline-0.jpg');

  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onMediaInsertRequest?.({
      type: 'media-insert-request',
      action: 'insert-image-assets',
      assets: [{uri: 'data:image/png;base64,abc'}],
    } as any);
    await Promise.resolve();
  });

  expect(mockPickImagesFromLibrary).not.toHaveBeenCalled();
  expect(mockSaveAttachment).toHaveBeenCalledWith({
    index: 0,
    kind: 'image',
    noteId: expect.stringMatching(/^temp_/),
    preferredExtension: undefined,
    uri: 'data:image/png;base64,abc',
  });
  expect(callbacks.onChangeImages).toHaveBeenCalledWith([
    'file:///image-inline-0.jpg',
  ]);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
  expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
    buildMirrorDocument('ab[图片0]cd'),
  );
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
  ]);
});

test('inserts image markers in h5 mode through internal camera request', async () => {
  mockSaveAttachment.mockResolvedValue('file:///image-0.jpg');
  mockCaptureImage.mockResolvedValue({uri: 'file:///camera-0.jpg'});

  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 1, end: 1}, 1);
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onMediaInsertRequest?.({
      type: 'media-insert-request',
      action: 'capture-image',
    });
    await Promise.resolve();
  });

  expect(mockCaptureImage).toHaveBeenCalledTimes(1);
  expect(callbacks.onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('a[图片0]bcd');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'a[图片0]bcd', fontSize: 18, isBold: true},
  ]);
});

test('inserts audio markers in h5 mode through internal media record request', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);

  const {callbacks, renderer} = await renderNoteEditorModal({
    noteOverrides: {
      id: 'note-1',
      content: 'abcd',
      audios: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await openH5Mode(renderer);

  await ReactTestRenderer.act(() => {
    mockH5EditorProps.current?.onSelectionChange?.({start: 2, end: 2}, 2);
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onMediaInsertRequest?.({
      type: 'media-insert-request',
      action: 'record-audio',
    });
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    mockH5EditorProps.current?.onMediaInsertRequest?.({
      type: 'media-insert-request',
      action: 'record-audio',
    });
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(callbacks.onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
  expect(callbacks.onChangeDocument).toHaveBeenLastCalledWith(
    buildMirrorDocument('ab[音频0]cd'),
  );
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
  ]);
});
