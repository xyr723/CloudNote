import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {
  appendWidgetSchemasToDocument,
  mergeTextDocumentWithWidgets,
} from '../../../entities/note/document';
import type {TextSegment} from '../../../entities/note/types';
import type {WidgetSchema} from '../../../entities/widget/types';
import {
  createNoteTextMirrorDocument,
  createWidgetOnlyDocument,
} from './noteEditorDocument';

const EMPTY_WIDGET_DOCUMENT: RichDocument = {
  version: '1.0',
  blocks: [],
};

type UseNoteDocumentMirrorInput = {
  noteDocument?: RichDocument;
  onChangeDocument?: (document: RichDocument) => void;
  visible: boolean;
};

export const useNoteDocumentMirror = ({
  noteDocument,
  onChangeDocument,
  visible,
}: UseNoteDocumentMirrorInput) => {
  const [draftDocument, setDraftDocument] = useState<RichDocument | undefined>(
    noteDocument,
  );
  const draftDocumentRef = useRef<RichDocument | undefined>(noteDocument);
  const textMirrorDirtyRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      textMirrorDirtyRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    draftDocumentRef.current = noteDocument;
    textMirrorDirtyRef.current = false;
    setDraftDocument(noteDocument);
  }, [noteDocument]);

  const widgetDocument = useMemo(() => {
    return createWidgetOnlyDocument(draftDocument) ?? EMPTY_WIDGET_DOCUMENT;
  }, [draftDocument]);

  const markTextMirrorDirty = useCallback(() => {
    textMirrorDirtyRef.current = true;
  }, []);

  const getCurrentDocument = useCallback(() => {
    return draftDocumentRef.current;
  }, []);

  const handleApplyDocumentChange = useCallback(
    (nextDocument: RichDocument) => {
      draftDocumentRef.current = nextDocument;
      setDraftDocument(nextDocument);
      onChangeDocument?.(nextDocument);
    },
    [onChangeDocument],
  );

  const handleAppendWidgets = useCallback(
    (widgets: WidgetSchema[]) => {
      const nextDocument = appendWidgetSchemasToDocument(
        draftDocumentRef.current,
        widgets,
      );

      draftDocumentRef.current = nextDocument;
      setDraftDocument(nextDocument);

      if (textMirrorDirtyRef.current) {
        return;
      }

      onChangeDocument?.(nextDocument);
    },
    [onChangeDocument],
  );

  const handleMirrorContentChange = useCallback(
    (nextContent: string, applyContentChange: (content: string) => void) => {
      markTextMirrorDirty();
      applyContentChange(nextContent);
    },
    [markTextMirrorDirty],
  );

  const handleMirrorTextSegmentsChange = useCallback(
    (
      nextSegments: TextSegment[],
      applyTextSegmentsChange?: (segments: TextSegment[]) => void,
    ) => {
      markTextMirrorDirty();
      applyTextSegmentsChange?.(nextSegments);
    },
    [markTextMirrorDirty],
  );

  const syncTextMirror = useCallback(
    (content: string) => {
      if (!visible || !textMirrorDirtyRef.current) {
        return;
      }

      const nextDocument = mergeTextDocumentWithWidgets(
        createNoteTextMirrorDocument(content),
        draftDocumentRef.current,
      );
      const currentDocumentSignature = JSON.stringify(
        draftDocumentRef.current ?? null,
      );
      const nextDocumentSignature = JSON.stringify(nextDocument);

      if (currentDocumentSignature === nextDocumentSignature) {
        textMirrorDirtyRef.current = false;
        return;
      }

      draftDocumentRef.current = nextDocument;
      setDraftDocument(nextDocument);
      onChangeDocument?.(nextDocument);
      textMirrorDirtyRef.current = false;
    },
    [onChangeDocument, visible],
  );

  return {
    draftDocument,
    getCurrentDocument,
    handleAppendWidgets,
    handleApplyDocumentChange,
    handleMirrorContentChange,
    handleMirrorTextSegmentsChange,
    markTextMirrorDirty,
    syncTextMirror,
    widgetDocument,
  };
};
