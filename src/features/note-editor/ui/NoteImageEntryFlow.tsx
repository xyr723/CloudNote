import React, {useCallback, useState} from 'react';
import {EditNoteImageOptionsModal} from './EditNoteImageOptionsModal';
import type {NoteEditorTheme} from './types';

type NoteImageEntryFlowProps = {
  children: (openImageOptions: () => void) => React.ReactNode;
  onCaptureImage: () => Promise<void> | void;
  onPickImage: () => Promise<void> | void;
  theme: NoteEditorTheme;
};

export const NoteImageEntryFlow: React.FC<NoteImageEntryFlowProps> = ({
  children,
  onCaptureImage,
  onPickImage,
  theme,
}) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const openImageOptions = useCallback(() => {
    setShowImageModal(true);
  }, []);

  const closeImageOptions = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const handleOpenImagePicker = useCallback(async () => {
    setShowImageModal(false);
    await onPickImage();
  }, [onPickImage]);

  const handleOpenCamera = useCallback(async () => {
    setShowImageModal(false);
    await onCaptureImage();
  }, [onCaptureImage]);

  return (
    <>
      {children(openImageOptions)}
      <EditNoteImageOptionsModal
        onClose={closeImageOptions}
        onOpenCamera={handleOpenCamera}
        onOpenImagePicker={handleOpenImagePicker}
        theme={theme}
        visible={showImageModal}
      />
    </>
  );
};
