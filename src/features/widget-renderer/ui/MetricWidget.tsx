import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

const resolveMetricText = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const MetricWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const value = resolveMetricText(widget.props?.value);
  const unit = resolveMetricText(widget.props?.unit);

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
      <View style={styles.valueRow}>
        <Text style={[styles.value, {color: theme.primaryDark}]}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.unit, {color: theme.text}]}>
            {unit}
          </Text>
        ) : null}
      </View>
      {widget.description ? (
        <Text style={[styles.description, {color: theme.text}]}>
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
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
});
