import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

type TimelineItem = {
  time: string;
  content: string;
};

const resolveTimelineItems = (value: unknown): TimelineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(item => {
    const candidate = item as {time?: unknown; content?: unknown};

    return {
      time: typeof candidate.time === 'string' ? candidate.time : '',
      content: typeof candidate.content === 'string' ? candidate.content : '',
    };
  });
};

export const TimelineWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const items = resolveTimelineItems(widget.props?.items);

  const updateItems = (nextItems: TimelineItem[]): void => {
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
        <Text style={[styles.label, {color: theme.textDark}]}>节点</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.primaryTransparent,
              borderColor: theme.border,
            },
          ]}
          onPress={() => updateItems([...items, {time: '', content: ''}])}>
          <Text style={[styles.addButtonText, {color: theme.primaryDark}]}>
            新增节点
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.items}>
        {items.map((item, index) => (
          <View key={`${widget.id}-timeline-item-${index}`} style={styles.itemCard}>
            <TextInput
              placeholder={`时间 ${index + 1}`}
              placeholderTextColor={theme.textLight}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={item.time}
              onChangeText={time => {
                updateItems(
                  items.map((currentItem, itemIndex) => {
                    return itemIndex === index
                      ? {...currentItem, time}
                      : currentItem;
                  }),
                );
              }}
            />
            <TextInput
              placeholder={`内容 ${index + 1}`}
              placeholderTextColor={theme.textLight}
              style={[
                styles.input,
                styles.multilineInput,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              multiline
              textAlignVertical="top"
              value={item.content}
              onChangeText={content => {
                updateItems(
                  items.map((currentItem, itemIndex) => {
                    return itemIndex === index
                      ? {...currentItem, content}
                      : currentItem;
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
                删除节点
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
  itemCard: {
    gap: 8,
  },
  items: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 88,
  },
  removeButton: {
    alignSelf: 'flex-start',
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
