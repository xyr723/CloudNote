import {useCallback, useEffect, useRef, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {
  appendWidgetSchemasToDocument,
  createLiveNoteDocument,
} from '../../../entities/note/document';
import type {WidgetSchema} from '../../../entities/widget/types';

type UseNoteDocumentMirrorInput = {
  noteContent: string;
  noteDocument?: RichDocument;
  onChangeDocument?: (document: RichDocument) => void;
  visible: boolean;
};

const createResolvedDraftDocument = ({
  content,
  document,
}: {
  content: string;
  document?: RichDocument;
}): RichDocument => {
  return createLiveNoteDocument({
    content,
    document,
  });
};

export const useNoteDocumentMirror = ({
  noteContent,
  noteDocument,
  onChangeDocument,
  visible,
}: UseNoteDocumentMirrorInput) => {
  const [draftDocument, setDraftDocument] = useState<RichDocument>(() => {
    return createResolvedDraftDocument({
      content: noteContent,
      document: noteDocument,
    });
  });
  const draftDocumentRef = useRef<RichDocument>(
    createResolvedDraftDocument({
      content: noteContent,
      document: noteDocument,
    }),
  );

  useEffect(() => {
    const nextDocument = createResolvedDraftDocument({
      content: noteContent,
      document: noteDocument,
    });

    draftDocumentRef.current = nextDocument;
    setDraftDocument(nextDocument);
  }, [noteContent, noteDocument]);

  const getCurrentDocument = useCallback(() => {
    return draftDocumentRef.current;
  }, []);

  const commitDocumentChange = useCallback(
    (nextDocument: RichDocument) => {
      draftDocumentRef.current = nextDocument;
      setDraftDocument(nextDocument);
      onChangeDocument?.(nextDocument);
    },
    [onChangeDocument],
  );
  const handleApplyDocumentChange = useCallback(
    (nextDocument: RichDocument) => {
      commitDocumentChange(nextDocument);
    },
    [commitDocumentChange],
  );

  const handleAppendWidgets = useCallback(
    (widgets: WidgetSchema[]) => {
      commitDocumentChange(
        appendWidgetSchemasToDocument(draftDocumentRef.current, widgets),
      );
    },
    [commitDocumentChange],
  );

  const handleMirrorContentChange = useCallback(
    (nextContent: string, applyContentChange: (content: string) => void) => {
      applyContentChange(nextContent);
      if (!visible) {
        return;
      }

      const nextDocument = createLiveNoteDocument({
        content: nextContent,
        document: draftDocumentRef.current,
      });
      const currentDocumentSignature = JSON.stringify(
        draftDocumentRef.current ?? null,
      );
      const nextDocumentSignature = JSON.stringify(nextDocument);

      if (currentDocumentSignature === nextDocumentSignature) {
        return;
      }

      commitDocumentChange(nextDocument);
    },
    [commitDocumentChange, visible],
  );

  return {
    draftDocument,
    getCurrentDocument,
    handleAppendWidgets,
    handleApplyDocumentChange,
    handleMirrorContentChange,
  };
};
