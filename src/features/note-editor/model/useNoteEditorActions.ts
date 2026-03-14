import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {completeNoteEditorTextWithAi} from './noteEditorAi';

type UseNoteEditorActionsInput = {
  audiosCount: number;
  content: string;
  imagesCount: number;
  onAppendText: (text: string) => void;
  onSave: () => Promise<void>;
  title: string;
};

export const useNoteEditorActions = ({
  audiosCount,
  content,
  imagesCount,
  onAppendText,
  onSave,
  title,
}: UseNoteEditorActionsInput) => {
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showAiThinkingModal, setShowAiThinkingModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAiComplete = useCallback(async () => {
    try {
      setIsAiThinking(true);
      setShowAiThinkingModal(true);

      const existingText =
        content || '不存在正整数x,y,z,n，当>3时，满足x^n+y^n=z^n';
      const userPrompt = '请帮我讲述一下这个命题中一些有趣的故事，不少于500字';
      const completedText = await completeNoteEditorTextWithAi(
        existingText,
        userPrompt,
      );

      onAppendText(completedText);
    } catch (error) {
      console.error('AI补全文本失败:', error);
      Alert.alert('错误', 'AI补全文本失败，请稍后再试');
    } finally {
      setIsAiThinking(false);
      setShowAiThinkingModal(false);
    }
  }, [content, onAppendText]);

  const handleSaveWithValidation = useCallback(async () => {
    if (!title.trim()) {
      setValidationMessage('标题不能为空');
      setShowValidationModal(true);
      return;
    }

    if (!content.trim() && imagesCount === 0 && audiosCount === 0) {
      setValidationMessage('内容不能为空');
      setShowValidationModal(true);
      return;
    }

    try {
      setIsSaving(true);
      await onSave();
    } catch (error) {
      console.error('保存笔记失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [audiosCount, content, imagesCount, onSave, title]);

  const handleCloseValidation = useCallback(() => {
    setShowValidationModal(false);
  }, []);

  return {
    handleAiComplete,
    handleCloseValidation,
    handleSaveWithValidation,
    isAiThinking,
    isSaving,
    showAiThinkingModal,
    showValidationModal,
    validationMessage,
  };
};
