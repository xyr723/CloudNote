import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

const resolveQuoteContent = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const normalizeOptionalText = (value: string): string | undefined => {
  return value === '' ? undefined : value;
};

export const QuoteWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const content = resolveQuoteContent(widget.props?.content);

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

      <Text style={[styles.label, {color: theme.textDark}]}>正文</Text>
      <TextInput
        placeholder="引用正文"
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
        value={content}
        onChangeText={nextContent => {
          onChange({
            ...widget,
            props: {
              ...(widget.props ?? {}),
              content: nextContent,
            },
          });
        }}
      />

      <Text style={[styles.label, {color: theme.textDark}]}>来源</Text>
      <TextInput
        placeholder="来源（可选）"
        placeholderTextColor={theme.textLight}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
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
    minHeight: 96,
  },
});
