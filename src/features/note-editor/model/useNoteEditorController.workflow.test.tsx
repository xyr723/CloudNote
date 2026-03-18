import React, {useState} from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {RichDocument} from '../../../entities/document/types';
import {
  appendWidgetSchemasToDocument,
  mergeTextDocumentWithWidgets,
} from '../../../entities/note/document';
import {
  buildWidget,
  createPassThroughMirrorHandlers,
  mockCompleteNoteEditorTextWithAi,
  renderUseNoteEditorController,
  resetUseNoteEditorControllerTestState,
} from './useNoteEditorController.testUtils';
import {createNoteTextMirrorDocument} from './noteEditorDocument';
import {useNoteDocumentMirror} from './useNoteDocumentMirror';
import {useNoteEditorController} from './useNoteEditorController';

describe('useNoteEditorController workflow', () => {
  beforeEach(() => {
    resetUseNoteEditorControllerTestState();
  });

  test('queues h5 format commands and keeps shared formatting state in sync', async () => {
    const note = {
      title: '标题',
      content: '原文',
      fontSize: 16,
      textSegments: [
        {text: '原', fontSize: 14, isItalic: true},
        {text: '文', fontSize: 20, isBold: true},
      ],
    };
    const onChangeFontSize = jest.fn();
    const onChangeTextSegments = jest.fn();
    const {controllerRef} = await renderUseNoteEditorController({
      mirrorHandlers: createPassThroughMirrorHandlers(),
      note,
      onChangeContent: () => {},
      onChangeFontSize,
      onChangeTextSegments,
    });

    await ReactTestRenderer.act(() => {
      controllerRef.current?.handleQueueH5FormatCommand('bold');
      controllerRef.current?.handleQueueH5FormatCommand('italic');
      controllerRef.current?.formatting.handleIncreaseFontSize();
    });

    const controller = controllerRef.current!;

    expect(controller.h5FormatCommand).toEqual({
      id: 2,
      type: 'italic',
    });
    expect(onChangeFontSize).toHaveBeenCalledWith(18);
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {text: '原', fontSize: 18, isItalic: true},
      {text: '文', fontSize: 18, isBold: true},
    ]);
    expect(controller.editorContent).toBe('原文');
    expect(controller.formatting.textSegments).toEqual([
      {text: '原', fontSize: 18, isItalic: true},
      {text: '文', fontSize: 18, isBold: true},
    ]);
  });

  test('appends ai text and widgets through the shared controller chain', async () => {
    const aiWidget = buildWidget('todo-1');
    const note = {
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
    };
    mockCompleteNoteEditorTextWithAi.mockResolvedValue({
      text: '续写内容',
      widgets: [aiWidget],
      metadata: {
        provider: 'mock',
        model: 'mock-model',
        usedFallback: false,
      },
    });
    const onChangeContent = jest.fn();
    const onChangeDocument = jest.fn();
    const onChangeTextSegments = jest.fn();
    let controllerRef: {
      current: ReturnType<typeof useNoteEditorController> | null;
    } = {
      current: null,
    };

    const Probe = () => {
      const [document, setDocument] = useState<RichDocument | undefined>(
        undefined,
      );
      const documentMirror = useNoteDocumentMirror({
        noteContent: note.content,
        noteDocument: document,
        onChangeDocument: nextDocument => {
          setDocument(nextDocument);
          onChangeDocument(nextDocument);
        },
        visible: true,
      });

      controllerRef.current = useNoteEditorController({
        visible: true,
        note,
        draftDocument: documentMirror.draftDocument,
        onSave: async () => {},
        onChangeContent,
        onChangeFontSize: () => {},
        onChangeTextSegments,
        handleAppendWidgets: documentMirror.handleAppendWidgets,
        handleMirrorContentChange: documentMirror.handleMirrorContentChange,
      });

      return null;
    };

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      await controllerRef.current?.actions.handleAiComplete();
      await Promise.resolve();
      await Promise.resolve();
    });

    const expectedDocument = mergeTextDocumentWithWidgets(
      createNoteTextMirrorDocument('原文续写内容'),
      appendWidgetSchemasToDocument(undefined, [aiWidget]),
    );

    expect(onChangeContent).toHaveBeenCalledWith('原文续写内容');
    expect(onChangeDocument).toHaveBeenLastCalledWith(expectedDocument);
    expect(onChangeTextSegments).toHaveBeenCalledWith([
      {
        text: '原文续写内容',
        fontSize: 18,
        isItalic: true,
        color: '#123456',
      },
    ]);
    expect(controllerRef.current!.editorContent).toBe('原文续写内容');
  });
});
