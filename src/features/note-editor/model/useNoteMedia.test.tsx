import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ImagePicker from 'react-native-image-picker';
import {useNoteMedia} from './useNoteMedia';

const mockSaveAttachment = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAttachmentProvider: () => ({
      saveAttachment: mockSaveAttachment,
    }),
  },
}));

describe('useNoteMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('keeps image markers in selection order when inserting multiple images', async () => {
    mockSaveAttachment
      .mockResolvedValueOnce('file:///image-0.jpg')
      .mockResolvedValueOnce('file:///image-1.jpg');
    jest
      .spyOn(ImagePicker, 'launchImageLibrary')
      .mockImplementation((_options, callback) => {
        callback?.({
          assets: [{uri: 'file:///source-0.jpg'}, {uri: 'file:///source-1.jpg'}],
        });
        return Promise.resolve({});
      });

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
      latestMedia?.handleImagePicker();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChangeImages).toHaveBeenCalledWith([
      'file:///image-0.jpg',
      'file:///image-1.jpg',
    ]);
    expect(onChangeContent).toHaveBeenCalledWith('ab[图片0][图片1]cd');
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: 'ab[图片0][图片1]cd', fontSize: 18, isBold: true},
    ]);
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
});
