import React, {useEffect, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {mergeTextDocumentWithWidgets} from '../../../entities/note/document';
import {providerRegistry} from '../../../providers/providerRegistry';
import {
  createNoteDocumentMirrorInput,
  hasSyncedNoteDocumentMirror,
} from '../model/noteEditorDocument';
import {H5DocumentPreview} from '../../h5-editor/ui/H5DocumentPreview';
import type {NoteEditorTheme} from './types';

type NoteEditorPreviewPaneProps = {
  content: string;
  document?: RichDocument;
  theme: NoteEditorTheme;
};

const EMPTY_DOCUMENT: RichDocument = {
  version: '1.0',
  blocks: [],
};

export const NoteEditorPreviewPane: React.FC<NoteEditorPreviewPaneProps> = ({
  content,
  document: persistedDocument,
  theme,
}) => {
  const [document, setDocument] = useState<RichDocument>(EMPTY_DOCUMENT);

  useEffect(() => {
    if (hasSyncedNoteDocumentMirror(persistedDocument, content)) {
      setDocument(persistedDocument);
      return;
    }

    let isActive = true;

    providerRegistry
      .getEditorProvider()
      .parse(createNoteDocumentMirrorInput(content))
      .then(parsedDocument => {
        if (!isActive) {
          return;
        }

        setDocument(
          mergeTextDocumentWithWidgets(parsedDocument, persistedDocument),
        );
      })
      .catch(error => {
        console.error('Failed to parse note editor preview document', error);

        if (!isActive) {
          return;
        }

        setDocument(EMPTY_DOCUMENT);
      });

    return () => {
      isActive = false;
    };
  }, [content, persistedDocument]);

  return <H5DocumentPreview document={document} theme={theme} />;
};
