import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import {useNoteRecording} from './useNoteRecording';

jest.mock('../../../shared/media/noteAttachmentStore', () => ({
  saveNoteAttachment: jest.fn(),
}));

const mockSaveNoteAttachment = saveNoteAttachment as jest.MockedFunction<
  typeof saveNoteAttachment
>;

describe('useNoteRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
      typeof RNFetchBlob.fs.exists
    >;
    existsMock.mockResolvedValue(true);
  });

  test('inserts an audio marker into content and text segments after recording', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///audio-0.mp3');
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

    expect(mockSaveNoteAttachment).toHaveBeenCalledWith({
      uri: expect.any(String),
      noteId: 'note-1',
      kind: 'audio',
      index: 0,
      preferredExtension: 'mp3',
      tempNoteId: 'temp-note-id',
    });
    expect(applyAudiosChange).toHaveBeenCalledWith(['file:///audio-0.mp3']);
    expect(applyContentChange).toHaveBeenCalledWith('ab[音频0]cd');
    expect(applyTextSegmentsChange).toHaveBeenCalledWith([
      {text: 'ab[音频0]cd', fontSize: 18, isBold: true},
    ]);
  });

  test('uses temp note id when recording a new unsaved note', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///audio-0.mp3');
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

    expect(mockSaveNoteAttachment).toHaveBeenCalledWith({
      uri: expect.any(String),
      noteId: undefined,
      kind: 'audio',
      index: 0,
      preferredExtension: 'mp3',
      tempNoteId: 'temp-note-id',
    });
  });

  test('emits a unified state patch after recording inserts an audio marker', async () => {
    mockSaveNoteAttachment.mockResolvedValue('file:///audio-0.mp3');
    const onChangeState = jest.fn();
    let latestRecording: ReturnType<typeof useNoteRecording> | null = null;

    const Probe = () => {
      latestRecording = useNoteRecording({
        applyAudiosChange: () => {},
        applyContentChange: () => {},
        applyTextSegmentsChange: () => {},
        audios: [],
        content: 'abcd',
        cursorPosition: 2,
        fontSize: 16,
        noteId: 'note-1',
        onChangeState,
        tempNoteId: 'temp-note-id',
        textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
      } as any);

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

    expect(onChangeState).toHaveBeenCalledWith({
      audios: ['file:///audio-0.mp3'],
      content: 'ab[音频0]cd',
      textSegments: [{text: 'ab[音频0]cd', fontSize: 18, isBold: true}],
    });
  });
});
