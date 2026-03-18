import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

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

const createNextFieldId = (fields: FormField[]): string => {
  const maxIndex = fields.reduce((currentMax, field) => {
    const match = /^field-(\d+)$/.exec(field.id);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `field-${maxIndex + 1}`;
};

const createEmptyField = (id: string): FormField => {
  return {
    id,
    label: '',
    type: 'text',
    placeholder: '',
  };
};

export const FormWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const fields = resolveFormFields(widget.props?.fields);

  const updateFields = (nextFields: FormField[]): void => {
    onChange({
      ...widget,
      props: {
        ...(widget.props ?? {}),
        fields: nextFields,
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
        <Text style={[styles.label, {color: theme.textDark}]}>字段</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.primaryTransparent,
              borderColor: theme.border,
            },
          ]}
          onPress={() => {
            updateFields([
              ...fields,
              createEmptyField(createNextFieldId(fields)),
            ]);
          }}>
          <Text style={[styles.addButtonText, {color: theme.primaryDark}]}>
            新增字段
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fields}>
        {fields.map((field, index) => (
          <View key={field.id} style={styles.fieldCard}>
            <TextInput
              placeholder={`字段标题 ${index + 1}`}
              placeholderTextColor={theme.textLight}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={field.label}
              onChangeText={label => {
                updateFields(
                  fields.map((currentField, fieldIndex) => {
                    return fieldIndex === index
                      ? {...currentField, label}
                      : currentField;
                  }),
                );
              }}
            />

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      field.type === 'text'
                        ? theme.primaryTransparent
                        : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  updateFields(
                    fields.map((currentField, fieldIndex) => {
                      return fieldIndex === index
                        ? {...currentField, type: 'text'}
                        : currentField;
                    }),
                  );
                }}>
                <Text style={[styles.typeButtonText, {color: theme.text}]}>
                  单行文本
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      field.type === 'textarea'
                        ? theme.primaryTransparent
                        : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  updateFields(
                    fields.map((currentField, fieldIndex) => {
                      return fieldIndex === index
                        ? {...currentField, type: 'textarea'}
                        : currentField;
                    }),
                  );
                }}>
                <Text style={[styles.typeButtonText, {color: theme.text}]}>
                  多行文本
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder={`占位提示 ${index + 1}`}
              placeholderTextColor={theme.textLight}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={field.placeholder}
              onChangeText={placeholder => {
                updateFields(
                  fields.map((currentField, fieldIndex) => {
                    return fieldIndex === index
                      ? {...currentField, placeholder}
                      : currentField;
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
                updateFields(fields.filter((_field, fieldIndex) => fieldIndex !== index));
              }}>
              <Text style={[styles.removeButtonText, {color: theme.error}]}>
                删除字段
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
  fieldCard: {
    gap: 8,
  },
  fields: {
    gap: 10,
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
  typeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
