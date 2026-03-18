import React from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {H5DocumentPreview} from '../../h5-editor/ui/H5DocumentPreview';
import type {NoteEditorTheme} from './types';

type NoteEditorPreviewPaneProps = {
  document: RichDocument;
  theme: NoteEditorTheme;
};

export const NoteEditorPreviewPane: React.FC<NoteEditorPreviewPaneProps> = ({
  document,
  theme,
}) => {
  return <H5DocumentPreview document={document} theme={theme} />;
};
