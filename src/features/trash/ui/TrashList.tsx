import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {Note} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {trashStyles} from './trashStyles';

type TrashListProps = {
  notes: Note[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onRestore: (note: Note) => void;
  onDelete: (note: Note) => void;
  theme: ReturnType<typeof generateThemeColors>;
};

export const TrashList: React.FC<TrashListProps> = ({
  notes,
  isLoading,
  isRefreshing,
  onRefresh,
  onRestore,
  onDelete,
  theme,
}) => {
  if (isLoading) {
    return (
      <View style={trashStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={trashStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
          title="下拉刷新"
          titleColor={theme.textLight}
        />
      }>
      {notes.length === 0 ? (
        <View style={trashStyles.emptyContainer}>
          <Text style={[trashStyles.emptyIcon, {color: theme.textLight}]}>
            🗑️
          </Text>
          <Text style={[trashStyles.emptyText, {color: theme.textLight}]}>
            暂无已删除的笔记
          </Text>
          <Text style={[trashStyles.emptySubText, {color: theme.textLight}]}>
            删除的笔记将在这里显示
          </Text>
        </View>
      ) : (
        notes.map(note => (
          <View
            key={note.id}
            style={[trashStyles.noteCard, {backgroundColor: theme.surface}]}>
            <Text style={[trashStyles.noteTitle, {color: theme.text}]}>
              {note.title}
            </Text>
            <Text
              style={[trashStyles.noteContent, {color: theme.textLight}]}
              numberOfLines={2}>
              {note.content}
            </Text>
            <Text style={[trashStyles.deletedAt, {color: theme.textLight}]}>
              删除于:{' '}
              {note.deletedAt
                ? new Date(note.deletedAt).toLocaleString()
                : '未知时间'}
            </Text>
            <View style={trashStyles.actionButtons}>
              <TouchableOpacity
                style={[trashStyles.actionButton, {backgroundColor: theme.primary}]}
                onPress={() => onRestore(note)}>
                <Text
                  style={[trashStyles.actionButtonText, {color: theme.surface}]}>
                  恢复
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[trashStyles.actionButton, {backgroundColor: theme.error}]}
                onPress={() => onDelete(note)}>
                <Text
                  style={[trashStyles.actionButtonText, {color: theme.surface}]}>
                  彻底删除
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};
