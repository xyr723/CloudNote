import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';

interface TrashPageProps {
  onClose: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const TrashPage: React.FC<TrashPageProps> = React.memo(({
  onClose,
  theme,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: theme.surface }]}>×</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.surface }]}>回收站</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.emptyText, { color: theme.textLight }]}>
            回收站为空
          </Text>
          <Text style={[styles.emptySubText, { color: theme.textLight }]}>
            删除的笔记将显示在这里
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
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
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  emptyContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TrashPage; 