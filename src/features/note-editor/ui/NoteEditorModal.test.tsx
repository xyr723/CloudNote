import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RNFetchBlob from 'react-native-blob-util';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import NoteEditorModal from './NoteEditorModal';
import {completeNoteEditorTextWithAi} from '../model/noteEditorAi';
import {useAudioPlayback} from '../model/useAudioPlayback';

const mockSaveAttachment = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAttachmentProvider: () => ({
      saveAttachment: mockSaveAttachment,
    }),
  },
}));

jest.mock('../model/noteEditorAi', () => ({
  completeNoteEditorTextWithAi: jest.fn(),
}));

jest.mock('../model/useAudioPlayback', () => ({
  useAudioPlayback: jest.fn(),
}));

const mockUseAudioPlayback = useAudioPlayback as jest.MockedFunction<
  typeof useAudioPlayback
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAudioPlayback.mockReturnValue({
    currentAudioIndex: -1,
    handlePlayAudio: jest.fn(),
    isPlaying: false,
  });
});

test('renders note editor modal from feature entry', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <NoteEditorModal
        visible={false}
        isEditing={false}
        note={{title: '', content: ''}}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });
});

test('syncs text segments after ai completion appends content', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
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
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const aiButton = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === '🤖️',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(async () => {
    aiButton.props.onPress();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '原文',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(onChangeContent).toHaveBeenCalledWith('原文续写内容');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
    {
      text: '原文续写内容',
      fontSize: 18,
      isItalic: true,
      color: '#123456',
    },
  ]);
});

test('renders appended ai content before parent note rerenders', async () => {
  const completeNoteEditorTextWithAiMock =
    completeNoteEditorTextWithAi as jest.MockedFunction<
      typeof completeNoteEditorTextWithAi
    >;
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
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
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const aiButton = renderer!.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === '🤖️',
      ).length > 0
    );
  });

  await ReactTestRenderer.act(async () => {
    aiButton.props.onPress();
    await Promise.resolve();
  });

  expect(
    renderer!.root.findAll(
      node => node.type === TextInput && node.props.value === '原文续写内容',
    ).length,
  ).toBeGreaterThan(0);
});

test('syncs text segments after recording inserts an audio marker', async () => {
  mockSaveAttachment.mockResolvedValue('file:///audio-0.mp3');
  const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
    typeof RNFetchBlob.fs.exists
  >;
  existsMock.mockResolvedValue(true);
  const onChangeAudios = jest.fn();
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          id: 'note-1',
          title: '标题',
          content: 'abcd',
          audios: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={onChangeAudios}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
      if (node.type !== TouchableOpacity || node.props.disabled) {
        return false;
      }

      return (
        node.findAll(
          child => child.type === Text && child.props.children === label,
        ).length > 0
      );
    });
  };

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(onChangeAudios).toHaveBeenCalledWith(['file:///audio-0.mp3']);
  expect(onChangeContent).toHaveBeenCalledWith('[音频0]abcd');
  expect(onChangeTextSegments).toHaveBeenCalledWith([
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
  completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');
  const onChangeContent = jest.fn();
  const onChangeTextSegments = jest.fn();

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          id: 'note-1',
          title: '标题',
          content: 'abcd',
          audios: [],
          fontSize: 16,
          textSegments: [{text: 'abcd', fontSize: 18, isBold: true}],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={onChangeContent}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={onChangeTextSegments}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  const findToolbarButtonByLabel = (label: string) => {
    return renderer!.root.find(node => {
      if (node.type !== TouchableOpacity || node.props.disabled) {
        return false;
      }

      return (
        node.findAll(
          child => child.type === Text && child.props.children === label,
        ).length > 0
      );
    });
  };

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🎙️').props.onPress();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('停止').props.onPress();
    await Promise.resolve();
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    findToolbarButtonByLabel('🤖️').props.onPress();
    await Promise.resolve();
  });

  expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
    '[音频0]abcd',
    '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
  );
  expect(onChangeContent).toHaveBeenLastCalledWith('[音频0]abcd续写内容');
  expect(onChangeTextSegments).toHaveBeenLastCalledWith([
    {text: '[音频0]abcd续写内容', fontSize: 18, isBold: true},
  ]);
});

test('wires audio playback through useAudioPlayback', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <NoteEditorModal
        visible
        isEditing={false}
        note={{
          title: '标题',
          content: '[音频0]',
          audios: ['file:///audio-0.mp3'],
        }}
        onSave={async () => {}}
        onClose={() => {}}
        onChangeTitle={() => {}}
        onChangeContent={() => {}}
        onChangeImages={() => {}}
        onChangeAudios={() => {}}
        onChangeFontSize={() => {}}
        onChangeTextSegments={() => {}}
        theme={generateThemeColors('薄荷生巧', false)}
      />,
    );
  });

  expect(mockUseAudioPlayback).toHaveBeenCalledWith({
    audios: ['file:///audio-0.mp3'],
  });
});
