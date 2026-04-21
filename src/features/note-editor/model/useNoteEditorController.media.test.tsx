import ReactTestRenderer from 'react-test-renderer';
import {
  createPassThroughMirrorHandlers,
  mockCaptureImage,
  mockPickImagesFromLibrary,
  mockSaveNoteAttachment,
  renderUseNoteEditorController,
  resetUseNoteEditorControllerTestState,
} from './useNoteEditorController.testUtils';

describe('useNoteEditorController media bridge', () => {
  beforeEach(() => {
    resetUseNoteEditorControllerTestState();
  });

  test('routes h5 image pick requests into the native media pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-0.jpg');
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'file:///source-0.jpg'},
    ]);
    const note = {
      title: '标题',
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const {controllerRef} = await renderUseNoteEditorController({
      mirrorHandlers: createPassThroughMirrorHandlers(),
      note,
      onChangeContent,
      onChangeImages,
      onChangeFontSize: () => {},
      onChangeTextSegments,
    });

    await ReactTestRenderer.act(() => {
      controllerRef.current?.formatting.handleEditorSelectionChange(
        {start: 2, end: 2},
        2,
      );
    });

    await ReactTestRenderer.act(async () => {
      controllerRef.current?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'pick-image',
      });
      await Promise.resolve();
    });

    expect(mockPickImagesFromLibrary).toHaveBeenCalledTimes(1);
    expect(onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
    expect(onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 inline image asset requests into the native media pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-inline-0.jpg');
    const note = {
      title: '标题',
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const {controllerRef} = await renderUseNoteEditorController({
      mirrorHandlers: createPassThroughMirrorHandlers(),
      note,
      onChangeContent,
      onChangeImages,
      onChangeFontSize: () => {},
      onChangeTextSegments,
    });

    await ReactTestRenderer.act(() => {
      controllerRef.current?.formatting.handleEditorSelectionChange(
        {start: 2, end: 2},
        2,
      );
    });

    await ReactTestRenderer.act(async () => {
      controllerRef.current?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'insert-image-assets',
        assets: [{uri: 'data:image/png;base64,abc'}],
      } as any);
      await Promise.resolve();
    });

    expect(mockPickImagesFromLibrary).not.toHaveBeenCalled();
    expect(mockCaptureImage).not.toHaveBeenCalled();
    expect(mockSaveNoteAttachment).toHaveBeenCalledWith({
      index: 0,
      kind: 'image',
      noteId: undefined,
      preferredExtension: undefined,
      tempNoteId: expect.stringMatching(/^temp_/),
      uri: 'data:image/png;base64,abc',
    });
    expect(onChangeImages).toHaveBeenCalledWith([
      'file:///image-inline-0.jpg',
    ]);
    expect(onChangeContent).toHaveBeenCalledWith('ab[图片0]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 camera requests into the native media pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-0.jpg');
    mockCaptureImage.mockResolvedValue({uri: 'file:///camera-0.jpg'});
    const note = {
      title: '标题',
      content: 'abcd',
      images: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const {controllerRef} = await renderUseNoteEditorController({
      mirrorHandlers: createPassThroughMirrorHandlers(),
      note,
      onChangeContent,
      onChangeImages,
      onChangeFontSize: () => {},
      onChangeTextSegments,
    });

    await ReactTestRenderer.act(() => {
      controllerRef.current?.formatting.handleEditorSelectionChange(
        {start: 1, end: 1},
        1,
      );
    });

    await ReactTestRenderer.act(async () => {
      controllerRef.current?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'capture-image',
      });
      await Promise.resolve();
    });

    expect(mockCaptureImage).toHaveBeenCalledTimes(1);
    expect(onChangeImages).toHaveBeenCalledWith(['file:///image-0.jpg']);
    expect(onChangeContent).toHaveBeenCalledWith('a[图片0]bcd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'a[图片0]bcd', fontSize: 18, isBold: true},
    ]);
  });

  test('routes h5 record requests into the native recording pipeline', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///audio-0.mp3');
    const note = {
      id: 'note-1',
      title: '标题',
      content: 'abcd',
      audios: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    const onChangeAudios = jest.fn();
    const onChangeContent = jest.fn();
    const onChangeTextSegments = jest.fn();
    const {controllerRef} = await renderUseNoteEditorController({
      mirrorHandlers: createPassThroughMirrorHandlers(),
      note,
      onChangeAudios,
      onChangeContent,
      onChangeFontSize: () => {},
      onChangeTextSegments,
    });

    await ReactTestRenderer.act(() => {
      controllerRef.current?.formatting.handleEditorSelectionChange(
        {start: 2, end: 2},
        2,
      );
    });

    await ReactTestRenderer.act(async () => {
      controllerRef.current?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'record-audio',
      });
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      controllerRef.current?.handleH5MediaInsertRequest({
        type: 'media-insert-request',
        action: 'record-audio',
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
    expect(onChangeContent).toHaveBeenCalledWith('ab[音频0]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
    ]);
  });
});
