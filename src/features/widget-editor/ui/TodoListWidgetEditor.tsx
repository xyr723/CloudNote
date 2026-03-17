import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

const resolveTodoItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

export const TodoListWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const items = resolveTodoItems(widget.props?.items);

  const updateItems = (nextItems: string[]): void => {
    onChange({
      ...widget,
      props: {
        ...(widget.props ?? {}),
        items: nextItems,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: theme.textDark}]}>标题</Text>
      <TextInput
        placeholder="组件标题"
        placeholderTextColor={theme.textLight}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={widget.title ?? ''}
        onChangeText={title => {
          onChange({
            ...widget,
            title,
          });
        }}
      />

      <View style={styles.sectionHeader}>
        <Text style={[styles.label, {color: theme.textDark}]}>事项</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.primaryTransparent,
              borderColor: theme.border,
            },
          ]}
          onPress={() => updateItems([...items, ''])}>
          <Text style={[styles.addButtonText, {color: theme.primaryDark}]}>
            新增事项
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.items}>
        {items.map((item, index) => (
          <View key={`${widget.id}-item-${index}`} style={styles.itemRow}>
            <TextInput
              placeholder={`事项 ${index + 1}`}
              placeholderTextColor={theme.textLight}
              style={[
                styles.input,
                styles.itemInput,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={item}
              onChangeText={text => {
                updateItems(
                  items.map((currentItem, itemIndex) => {
                    return itemIndex === index ? text : currentItem;
                  }),
                );
              }}
            />
            <TouchableOpacity
              style={[
                styles.removeButton,
                {
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                updateItems(items.filter((_item, itemIndex) => itemIndex !== index));
              }}>
              <Text style={[styles.removeButtonText, {color: theme.error}]}>
                删除事项
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  container: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemInput: {
    flex: 1,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  items: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
