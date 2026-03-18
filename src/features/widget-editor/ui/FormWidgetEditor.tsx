import React from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {
  appendEmptyFormField,
  removeFormFieldAtIndex,
  resolveFormFields,
  updateFormFieldAtIndex,
} from '../model/formWidgetEditorFields';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';
import {FormWidgetFieldCard} from './FormWidgetFieldCard';
import {styles} from './formWidgetEditorStyles';

export const FormWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const fields = resolveFormFields(widget.props?.fields);

  const updateFields = (nextFields: ReturnType<typeof resolveFormFields>) => {
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
            updateFields(appendEmptyFormField(fields));
          }}>
          <Text style={[styles.addButtonText, {color: theme.primaryDark}]}>
            新增字段
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fields}>
        {fields.map((field, fieldIndex) => (
          <FormWidgetFieldCard
            key={field.id}
            field={field}
            fieldIndex={fieldIndex}
            onChangeField={patch => {
              updateFields(updateFormFieldAtIndex(fields, fieldIndex, patch));
            }}
            onRemove={() => {
              updateFields(removeFormFieldAtIndex(fields, fieldIndex));
            }}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
};
