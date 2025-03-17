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

interface EditNotePageProps {
  isEditing: boolean;
  note: {
    title: string;
    content: string;
  };
  onSave: () => void;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  visible: boolean;
}

const EditNotePage: React.FC<EditNotePageProps> = ({
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  visible,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="#C5A3E6" barStyle="light-content" />
        <View style={styles.headerBackground} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {isEditing ? '编辑笔记' : '新建笔记'}
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <TextInput
                style={styles.titleInput}
                placeholder="标题"
                value={note.title}
                onChangeText={onChangeTitle}
                placeholderTextColor="#A98DB8"
              />
              <TextInput
                style={styles.contentInput}
                placeholder="开始写笔记..."
                multiline
                value={note.content}
                onChangeText={onChangeContent}
                placeholderTextColor="#A98DB8"
                textAlignVertical="top"
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
    backgroundColor: '#C5A3E6',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 120 : 0,
    backgroundColor: '#C5A3E6',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFAFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    backgroundColor: '#C5A3E6',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 60,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 60,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
  },
  titleInput: {
    fontSize: 20,
    color: '#666666',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6F7',
    paddingVertical: 12,
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    padding: 0,
    marginBottom: Platform.OS === 'android' ? 16 : 0,
  },
});

export default EditNotePage; 