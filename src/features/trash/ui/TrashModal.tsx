import React from 'react';
import {SafeAreaView, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {useTrashNotes} from '../model/useTrashNotes';
import {TrashFeedbackModals} from './TrashFeedbackModals';
import {TrashList} from './TrashList';
import {trashStyles} from './trashStyles';

type TrashModalProps = {
  username: string;
  onClose: () => void;
  theme: ReturnType<typeof generateThemeColors>;
};

export const TrashModal: React.FC<TrashModalProps> = ({
  username,
  onClose,
  theme,
}) => {
  const trashNotes = useTrashNotes({username});

  return (
    <SafeAreaView
      style={[trashStyles.container, {backgroundColor: theme.background}]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[trashStyles.header, {backgroundColor: theme.primary}]}>
        <TouchableOpacity style={trashStyles.closeButton} onPress={onClose}>
          <Text style={[trashStyles.closeButtonText, {color: theme.surface}]}>
            ×
          </Text>
        </TouchableOpacity>
        <Text style={[trashStyles.headerTitle, {color: theme.surface}]}>
          回收站
        </Text>
        <View style={trashStyles.placeholder} />
      </View>

      <TrashList
        notes={trashNotes.notes}
        isLoading={trashNotes.isLoading}
        isRefreshing={trashNotes.isRefreshing}
        onRefresh={trashNotes.refresh}
        onRestore={trashNotes.requestRestore}
        onDelete={trashNotes.requestDelete}
        theme={theme}
      />

      <TrashFeedbackModals
        activeAction={trashNotes.activeAction}
        selectedNote={trashNotes.selectedNote}
        successFeedback={trashNotes.successFeedback}
        onCloseAction={trashNotes.closeActionModal}
        onCloseSuccessFeedback={trashNotes.closeSuccessFeedback}
        onConfirmAction={trashNotes.confirmAction}
        theme={theme}
      />
    </SafeAreaView>
  );
};
