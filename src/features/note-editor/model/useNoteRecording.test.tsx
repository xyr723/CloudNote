import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {useNoteRecording} from './useNoteRecording';

const mockSaveAttachment = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAttachmentProvider: () => ({
      saveAttachment: mockSaveAttachment,
    }),
  },
}));

describe('useNoteRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
      typeof RNFetchBlob.fs.exists
    >;
    existsMock.mockResolvedValue(true);
  });

  test('inserts an audio marker into content and text segments after recording', async () => {
    mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
    const applyAudiosChange = jest.fn();
    const applyContentChange = jest.fn();
    const applyTextSegmentsChange = jest.fn();
    let latestRecording: ReturnType<typeof useNoteRecording> | null = null;

    const Probe = () => {
      latestRecording = useNoteRecording({
        applyAudiosChange,
        applyContentChange,
        applyTextSegmentsChange,
        audios: [],
        content: 'abcd',
        cursorPosition: 2,
        fontSize: 16,
        noteId: 'note-1',
        tempNoteId: 'temp-note-id',
        textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestRecording?.handleStartRecording();
    });

    await ReactTestRenderer.act(async () => {
      await latestRecording?.handleStopRecording();
    });

    expect(mockSaveAttachment).toHaveBeenCalledWith({
      uri: expect.any(String),
      noteId: 'note-1',
      kind: 'audio',
      index: 0,
      preferredExtension: 'mp3',
    });
    expect(applyAudiosChange).toHaveBeenCalledWith(['file:///audio-0.mp3']);
    expect(applyContentChange).toHaveBeenCalledWith('ab[音频0]cd');
    expect(applyTextSegmentsChange).toHaveBeenCalledWith([
      {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('uses temp note id when recording a new unsaved note', async () => {
    mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
    let latestRecording: ReturnType<typeof useNoteRecording> | null = null;

    const Probe = () => {
      latestRecording = useNoteRecording({
        applyAudiosChange: () => {},
        applyContentChange: () => {},
        audios: [],
        content: '',
        cursorPosition: 0,
        fontSize: 16,
        tempNoteId: 'temp-note-id',
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestRecording?.handleStartRecording();
    });

    await ReactTestRenderer.act(async () => {
      await latestRecording?.handleStopRecording();
    });

    expect(mockSaveAttachment).toHaveBeenCalledWith({
      uri: expect.any(String),
      noteId: 'temp-note-id',
      kind: 'audio',
      index: 0,
      preferredExtension: 'mp3',
    });
  });
});
