import React from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import type {ThemeColors} from '../../../shared/theme/colors';
import type {FormField} from '../model/formWidgetEditorFields';
import {styles} from './formWidgetEditorStyles';

type FormWidgetFieldCardProps = {
  field: FormField;
  fieldIndex: number;
  onChangeField: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  theme: ThemeColors;
};

export const FormWidgetFieldCard: React.FC<FormWidgetFieldCardProps> = ({
  field,
  fieldIndex,
  onChangeField,
  onRemove,
  theme,
}) => {
  return (
    <View style={styles.fieldCard}>
      <TextInput
        placeholder={`字段标题 ${fieldIndex + 1}`}
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
          onChangeField({label});
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
            onChangeField({type: 'text'});
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
            onChangeField({type: 'textarea'});
          }}>
          <Text style={[styles.typeButtonText, {color: theme.text}]}>
            多行文本
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder={`占位提示 ${fieldIndex + 1}`}
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
          onChangeField({placeholder});
        }}
      />

      <TouchableOpacity
        style={[
          styles.removeButton,
          {
            borderColor: theme.border,
          },
        ]}
        onPress={onRemove}>
        <Text style={[styles.removeButtonText, {color: theme.error}]}>
          删除字段
        </Text>
      </TouchableOpacity>
    </View>
  );
};
