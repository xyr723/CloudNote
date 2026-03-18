import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

type FormFieldType = 'text' | 'textarea';

type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder: string;
};

const resolveFieldType = (value: unknown): FormFieldType => {
  return value === 'textarea' ? 'textarea' : 'text';
};

const resolveFormFields = (value: unknown): FormField[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const candidate = item as {
      id?: unknown;
      label?: unknown;
      type?: unknown;
      placeholder?: unknown;
    };

    return {
      id:
        typeof candidate.id === 'string' && candidate.id.trim().length > 0
          ? candidate.id
          : `field-${index + 1}`,
      label: typeof candidate.label === 'string' ? candidate.label : '',
      type: resolveFieldType(candidate.type),
      placeholder:
        typeof candidate.placeholder === 'string' ? candidate.placeholder : '',
    };
  });
};

export const FormWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const fields = resolveFormFields(widget.props?.fields);

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
      <View style={styles.fields}>
        {fields.map(field => (
          <View key={field.id} style={styles.field}>
            <Text style={[styles.label, {color: theme.textDark}]}>
              {field.label}
            </Text>
            <View
              style={[
                styles.preview,
                field.type === 'textarea' ? styles.textareaPreview : null,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}>
              {field.placeholder ? (
                <Text style={[styles.placeholder, {color: theme.textLight}]}>
                  {field.placeholder}
                </Text>
              ) : null}
            </View>
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
  field: {
    gap: 6,
  },
  fields: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 14,
    lineHeight: 20,
  },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textareaPreview: {
    alignItems: 'flex-start',
    minHeight: 88,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
