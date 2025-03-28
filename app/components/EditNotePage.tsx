import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';

interface EditNotePageProps {
  visible: boolean;
  isEditing: boolean;
  note: {
    id?: string;
    title: string;
    content: string;
  };
  onSave: () => void;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const EditNotePage: React.FC<EditNotePageProps> = ({
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  visible,
  theme,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={[styles.closeButtonText, { color: theme.surface }]}>取消</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.surface }]}>
                {isEditing ? '编辑笔记' : '新建笔记'}
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={[styles.saveButtonText, { color: theme.surface }]}>保存</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <TextInput
                style={[styles.titleInput, { 
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface
                }]}
                placeholder="标题"
                placeholderTextColor={theme.textLight}
                value={note.title}
                onChangeText={onChangeTitle}
              />
              <TextInput
                style={[styles.contentInput, { 
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface
                }]}
                placeholder="开始输入内容..."
                placeholderTextColor={theme.textLight}
                value={note.content}
                onChangeText={onChangeContent}
                multiline
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    textAlignVertical: 'top',
  },
});

export default EditNotePage; 