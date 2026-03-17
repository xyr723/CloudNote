import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

const resolveMetricValue = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const resolveMetricUnit = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const normalizeOptionalText = (value: string): string | undefined => {
  return value === '' ? undefined : value;
};

export const MetricWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const value = resolveMetricValue(widget.props?.value);
  const unit = resolveMetricUnit(widget.props?.unit);

  const updateWidget = (nextValue: string, nextUnit: string): void => {
    onChange({
      ...widget,
      props: {
        ...(widget.props ?? {}),
        value: nextValue,
        unit: normalizeOptionalText(nextUnit),
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

      <Text style={[styles.label, {color: theme.textDark}]}>数值</Text>
      <TextInput
        placeholder="指标值"
        placeholderTextColor={theme.textLight}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={value}
        onChangeText={nextValue => {
          updateWidget(nextValue, unit);
        }}
      />

      <Text style={[styles.label, {color: theme.textDark}]}>单位</Text>
      <TextInput
        placeholder="单位（可选）"
        placeholderTextColor={theme.textLight}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={unit}
        onChangeText={nextUnit => {
          updateWidget(value, nextUnit);
        }}
      />

      <Text style={[styles.label, {color: theme.textDark}]}>说明</Text>
      <TextInput
        placeholder="说明（可选）"
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
        value={widget.description ?? ''}
        onChangeText={description => {
          onChange({
            ...widget,
            description: normalizeOptionalText(description),
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 88,
  },
});
