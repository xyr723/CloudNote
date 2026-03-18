import {useCallback, useEffect, useState} from 'react';
import {
  findWidgetBlock,
  insertWidgetBlock,
  moveWidgetBlock,
  removeWidgetBlock,
  replaceWidgetBlock,
} from '../../../entities/note/document';
import type {RichDocument} from '../../../entities/document/types';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import type {H5WidgetBridgeEvent} from '../../h5-editor/model/h5TextEditorBridge';
import {createWidgetDraft} from '../../widget-editor/model/widgetDraftFactory';

type ActiveWidgetEditorState = {
  mode: 'create' | 'edit';
  widget: WidgetSchema;
  blockId?: string;
  afterBlockId?: string | null;
} | null;

type PendingWidgetInsertState = {
  afterBlockId?: string | null;
} | null;

type UseNoteWidgetEditingInput = {
  applyDocumentChange: (document: RichDocument) => void;
  getCurrentDocument: () => RichDocument;
  visible: boolean;
};

export const useNoteWidgetEditing = ({
  applyDocumentChange,
  getCurrentDocument,
  visible,
}: UseNoteWidgetEditingInput) => {
  const [activeWidgetEditor, setActiveWidgetEditor] =
    useState<ActiveWidgetEditorState>(null);
  const [pendingWidgetInsert, setPendingWidgetInsert] =
    useState<PendingWidgetInsertState>(null);

  useEffect(() => {
    if (!visible) {
      setActiveWidgetEditor(null);
      setPendingWidgetInsert(null);
    }
  }, [visible]);

  const handleCloseWidgetEditor = useCallback(() => {
    setActiveWidgetEditor(null);
  }, []);

  const handleCloseWidgetTypePicker = useCallback(() => {
    setPendingWidgetInsert(null);
  }, []);

  const handleSelectWidgetType = useCallback(
    (type: WidgetType) => {
      setActiveWidgetEditor({
        mode: 'create',
        widget: createWidgetDraft(type),
        afterBlockId: pendingWidgetInsert?.afterBlockId,
      });
      setPendingWidgetInsert(null);
    },
    [pendingWidgetInsert],
  );

  const handleSaveWidget = useCallback(
    (nextWidget: WidgetSchema) => {
      if (!activeWidgetEditor) {
        setActiveWidgetEditor(null);
        return;
      }

      if (activeWidgetEditor.mode === 'create') {
        applyDocumentChange(
          insertWidgetBlock(
            getCurrentDocument(),
            nextWidget,
            activeWidgetEditor.afterBlockId,
          ),
        );
        setActiveWidgetEditor(null);
        return;
      }

      const currentDocument = getCurrentDocument();

      if (!activeWidgetEditor.blockId) {
        setActiveWidgetEditor(null);
        return;
      }

      const currentBlock = findWidgetBlock(
        currentDocument,
        activeWidgetEditor.blockId,
      );

      if (
        !currentBlock ||
        currentBlock.widget.id !== activeWidgetEditor.widget.id
      ) {
        setActiveWidgetEditor(null);
        return;
      }

      applyDocumentChange(
        replaceWidgetBlock(
          currentDocument,
          activeWidgetEditor.blockId,
          nextWidget,
        ),
      );
      setActiveWidgetEditor(null);
    },
    [activeWidgetEditor, applyDocumentChange, getCurrentDocument],
  );

  const handleDeleteActiveWidget = useCallback(() => {
    const currentDocument = getCurrentDocument();

    if (
      !activeWidgetEditor ||
      activeWidgetEditor.mode !== 'edit' ||
      !activeWidgetEditor.blockId
    ) {
      setActiveWidgetEditor(null);
      return;
    }

    applyDocumentChange(
      removeWidgetBlock(currentDocument, activeWidgetEditor.blockId),
    );
    setActiveWidgetEditor(null);
  }, [activeWidgetEditor, applyDocumentChange, getCurrentDocument]);

  const handleH5WidgetEvent = useCallback(
    (event: H5WidgetBridgeEvent) => {
      const currentDocument = getCurrentDocument();

      if (event.type === 'widget-edit-request') {
        const targetBlock = findWidgetBlock(currentDocument, event.blockId);

        if (!targetBlock || targetBlock.widget.id !== event.widgetId) {
          return;
        }

        setActiveWidgetEditor({
          mode: 'edit',
          blockId: targetBlock.id,
          widget: targetBlock.widget,
        });
        return;
      }

      if (event.type === 'widget-delete') {
        const targetBlock = findWidgetBlock(currentDocument, event.blockId);

        if (!targetBlock || targetBlock.widget.id !== event.widgetId) {
          return;
        }

        applyDocumentChange(removeWidgetBlock(currentDocument, event.blockId));
        setActiveWidgetEditor(currentEditor => {
          return currentEditor?.blockId === event.blockId ? null : currentEditor;
        });
        return;
      }

      if (event.type === 'widget-move') {
        const targetBlock = findWidgetBlock(currentDocument, event.blockId);

        if (!targetBlock || targetBlock.widget.id !== event.widgetId) {
          return;
        }

        const nextDocument = moveWidgetBlock(
          currentDocument,
          event.blockId,
          event.direction,
        );

        if (nextDocument !== currentDocument) {
          applyDocumentChange(nextDocument);
        }

        return;
      }

      setPendingWidgetInsert({
        afterBlockId: event.afterBlockId,
      });
    },
    [applyDocumentChange, getCurrentDocument],
  );

  return {
    activeWidgetEditor,
    handleCloseWidgetEditor,
    handleCloseWidgetTypePicker,
    handleDeleteActiveWidget,
    handleH5WidgetEvent,
    handleSaveWidget,
    handleSelectWidgetType,
    pendingWidgetInsert,
  };
};
