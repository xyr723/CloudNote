import React, {useEffect, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {mergeTextDocumentWithWidgets} from '../../../entities/note/document';
import {providerRegistry} from '../../../providers/providerRegistry';
import {H5DocumentPreview} from '../../h5-editor/ui/H5DocumentPreview';
import type {NoteEditorTheme} from './types';

type NoteEditorPreviewPaneProps = {
  content: string;
  document?: RichDocument;
  theme: NoteEditorTheme;
};

const createPreviewInput = (content: string): string => {
  if (!content.trim()) {
    return '';
  }

  return content
    .replace(/\[图片(\d+)\]/g, (_, index: string) => {
      return `\n\n图片占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\[音频(\d+)\]/g, (_, index: string) => {
      return `\n\n音频占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    let isActive = true;

    providerRegistry
      .getEditorProvider()
      .parse(createPreviewInput(content))
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
