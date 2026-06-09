import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {pickImagesFromLibrary} from '../../../shared/media/imagePicker';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import {useNoteMedia} from './useNoteMedia';

jest.mock('../../../shared/media/imagePicker', () => ({
  pickImagesFromLibrary: jest.fn(),
  captureImage: jest.fn(),
}));

jest.mock('../../../shared/media/noteAttachmentStore', () => ({
  saveNoteAttachment: jest.fn(),
}));

const mockPickImagesFromLibrary = pickImagesFromLibrary as jest.MockedFunction<
  typeof pickImagesFromLibrary
>;
const mockSaveNoteAttachment = saveNoteAttachment as jest.MockedFunction<
  typeof saveNoteAttachment
>;

describe('useNoteMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('keeps image markers in selection order when inserting multiple images', async () => {
    mockSaveNoteAttachment
      .mockResolvedValueOnce('file:///image-0.jpg')
      .mockResolvedValueOnce('file:///image-1.jpg');
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'file:///source-0.jpg'},
      {uri: 'file:///source-1.jpg'},
    ]);

    const onChangeContent = jest.fn();
    const onChangeImages = jest.fn();
    const onChangeTextSegments = jest.fn();
    const note = {
      title: '标题',
      content: 'abcd',
      fontSize: 16,
      images: [],
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    let latestMedia: ReturnType<typeof useNoteMedia> | null = null;

    const Probe = () => {
      latestMedia = useNoteMedia({
        content: note.content,
        cursorPosition: 2,
        fontSize: 16,
        note,
        onChangeContent,
        onChangeImages,
        onChangeTextSegments,
        tempNoteId: 'temp-note-id',
        textSegments: note.textSegments,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestMedia?.handleImagePicker();
    });

    expect(onChangeImages).toHaveBeenCalledWith([
      'file:///image-0.jpg',
      'file:///image-1.jpg',
    ]);
    expect(onChangeContent).toHaveBeenCalledWith('ab[图片0][图片1]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0][图片1]cd', fontSize: 18, isBold: true},
    ]);
    expect(mockSaveNoteAttachment).toHaveBeenNthCalledWith(1, {
      index: 0,
      kind: 'image',
      noteId: undefined,
      tempNoteId: 'temp-note-id',
      uri: 'file:///source-0.jpg',
    });
  });

  test('syncs auto-added image markers back to parent content and segments', async () => {
    const onChangeContent = jest.fn();
    const onChangeTextSegments = jest.fn();
    const note = {
      title: '标题',
      content: '正文',
      fontSize: 16,
      images: ['file:///image-0.jpg'],
      textSegments: [{text: '正文', fontSize: 18, isBold: true}],
    };

    const Probe = () => {
      useNoteMedia({
        content: note.content,
        cursorPosition: 0,
        fontSize: 16,
        note,
        onChangeContent,
        onChangeTextSegments,
        tempNoteId: 'temp-note-id',
        textSegments: note.textSegments,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    expect(onChangeContent).toHaveBeenCalledWith('正文\n[图片0]');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: '正文\n[图片0]', fontSize: 18, isBold: true},
    ]);
  });

  test('emits a unified state patch when inserting images', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///image-0.jpg');
    mockPickImagesFromLibrary.mockResolvedValue([
      {uri: 'file:///source-0.jpg'},
    ]);

    const onChangeState = jest.fn();
    const note = {
      title: '标题',
      content: 'abcd',
      fontSize: 16,
      images: [],
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    };
    let latestMedia: ReturnType<typeof useNoteMedia> | null = null;

    const Probe = () => {
      latestMedia = useNoteMedia({
        content: note.content,
        cursorPosition: 2,
        fontSize: 16,
        note,
        onChangeState,
        tempNoteId: 'temp-note-id',
        textSegments: note.textSegments,
      } as any);

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestMedia?.handleImagePicker();
    });

    expect(onChangeState).toHaveBeenLastCalledWith({
      content: 'ab[图片0]cd',
      images: ['file:///image-0.jpg'],
      textSegments: [{text: 'ab[图片0]cd', fontSize: 18, isBold: true}],
    });
  });
});
