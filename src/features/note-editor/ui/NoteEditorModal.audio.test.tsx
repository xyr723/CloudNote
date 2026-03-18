import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {
  flushNoteEditorModalEffects,
  mockSaveAttachment,
  mockUseAudioPlayback,
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

test('syncs text segments after recording inserts an audio marker', async () => {
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

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(callbacks.onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(callbacks.onChangeContent).toHaveBeenCalledWith('[音频0]abcd');
  expect(callbacks.onChangeTextSegments).toHaveBeenCalledWith([
    {text: '[音频0]abcd', fontSize: 18, isBold: true},
  ]);
});

test('keeps inserted audio marker when ai completion runs before parent note rerenders', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
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
      id: 'note-1',
      content: 'abcd',
      audios: [],
      fontSize: 16,
      textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
    },
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel(renderer, '🤖️').props.onPress();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '[音频0]abcd',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(callbacks.onChangeContent).toHaveBeenLastCalledWith('[音频0]abcd续写内容');
  expect(callbacks.onChangeTextSegments).toHaveBeenLastCalledWith([
    {text: '[音频0]abcd续写内容', fontSize: 18, isBold: true},
  ]);
});

test('wires audio playback through useAudioPlayback', async () => {
  await renderNoteEditorModal({
    noteOverrides: {
      content: '[音频0]',
      audios: ['file:///audio-0.mp3'],
    },
  });

  expect(mockUseAudioPlayback).toHaveBeenCalledWith({
    audios: ['file:///audio-0.mp3'],
  });
});
