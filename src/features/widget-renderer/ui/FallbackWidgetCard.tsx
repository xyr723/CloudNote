import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

export const FallbackWidgetCard: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const actions = widget.actions ?? [];
  const span = widget.layout?.span;
  const minHeight = widget.layout?.minHeight;

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
      <Text style={[styles.type, {color: theme.text}]}>{widget.type}</Text>
      {widget.description ? (
        <Text style={[styles.description, {color: theme.text}]}>
          {widget.description}
        </Text>
      ) : null}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map(action => (
            <Text key={action.id} style={[styles.actionLabel, {color: theme.primary}]}>
              {action.label}
            </Text>
          ))}
        </View>
      ) : null}
      {span || minHeight ? (
        <Text style={[styles.meta, {color: theme.textLight}]}>
          {`span: ${span ?? '-'} | minHeight: ${minHeight ?? '-'}`}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  meta: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  type: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'none',
  },
});
