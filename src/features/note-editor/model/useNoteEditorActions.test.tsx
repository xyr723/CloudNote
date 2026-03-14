import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {completeNoteEditorTextWithAi} from './noteEditorAi';
import {useNoteEditorActions} from './useNoteEditorActions';

jest.mock('./noteEditorAi', () => ({
  completeNoteEditorTextWithAi: jest.fn(),
}));

describe('useNoteEditorActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('appends ai completion result', async () => {
    const completeNoteEditorTextWithAiMock =
      completeNoteEditorTextWithAi as jest.MockedFunction<
        typeof completeNoteEditorTextWithAi
      >;
    completeNoteEditorTextWithAiMock.mockResolvedValue('续写内容');
    const onAppendText = jest.fn();
    let latestActions: ReturnType<typeof useNoteEditorActions> | null = null;

    const Probe = () => {
      latestActions = useNoteEditorActions({
        audiosCount: 0,
        content: '原文',
        imagesCount: 0,
        onAppendText,
        onSave: async () => {},
        title: '标题',
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestActions?.handleAiComplete();
    });

    const actions = latestActions!;

    expect(completeNoteEditorTextWithAiMock).toHaveBeenCalledWith(
      '原文',
      '请帮我讲述一下这个命题中一些有趣的故事，不少于500字',
    );
    expect(onAppendText).toHaveBeenCalledWith('续写内容');
    expect(actions.isAiThinking).toBe(false);
    expect(actions.showAiThinkingModal).toBe(false);
  });

  test('shows validation modal when title is empty', async () => {
    const onSave = jest.fn();
    let latestActions: ReturnType<typeof useNoteEditorActions> | null = null;

    const Probe = () => {
      latestActions = useNoteEditorActions({
        audiosCount: 0,
        content: '正文',
        imagesCount: 0,
        onAppendText: () => {},
        onSave,
        title: '   ',
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestActions?.handleSaveWithValidation();
    });

    const actions = latestActions!;

    expect(onSave).not.toHaveBeenCalled();
    expect(actions.showValidationModal).toBe(true);
    expect(actions.validationMessage).toBe('标题不能为空');
  });

  test('does not auto-close after a successful save', async () => {
    jest.useFakeTimers();
    const onSave = jest.fn().mockResolvedValue(undefined);
    let latestActions: ReturnType<typeof useNoteEditorActions> | null = null;

    const Probe = () => {
      latestActions = useNoteEditorActions({
        audiosCount: 0,
        content: '正文',
        imagesCount: 0,
        onAppendText: () => {},
        onSave,
        title: '标题',
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await latestActions?.handleSaveWithValidation();
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onSave).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });
});
