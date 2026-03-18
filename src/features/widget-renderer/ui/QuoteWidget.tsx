import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

const resolveQuoteContent = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const QuoteWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const content = resolveQuoteContent(widget.props?.content);

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
      <Text style={[styles.content, {color: theme.textDark}]}>{content}</Text>
      {widget.description ? (
        <Text style={[styles.source, {color: theme.text}]}>
          {widget.description}
        </Text>
      ) : null}
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
  content: {
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
