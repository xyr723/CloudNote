import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

const resolveTodoItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

export const TodoListWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const items = resolveTodoItems(widget.props?.items);
  const title = widget.title ?? widget.type;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.title, {color: theme.textDark}]}>{title}</Text>
      {widget.description ? (
        <Text style={[styles.description, {color: theme.text}]}>
          {widget.description}
        </Text>
      ) : null}
      <View style={styles.items}>
        {items.map(item => (
          <Text key={item} style={[styles.item, {color: theme.text}]}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
  },
  items: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
