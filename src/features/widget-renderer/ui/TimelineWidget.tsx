import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

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

export const TimelineWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const items = resolveTimelineItems(widget.props?.items);

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
      <View style={styles.items}>
        {items.map((item, index) => (
          <View key={`${widget.id}-timeline-${index}`} style={styles.itemRow}>
            <Text style={[styles.time, {color: theme.textLight}]}>
              {item.time}
            </Text>
            <Text style={[styles.content, {color: theme.text}]}>
              {item.content}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  content: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  itemRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  items: {
    gap: 8,
  },
  time: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 44,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
