import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetAction} from '../../../entities/widget/types';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

const createDefaultAction = (): WidgetAction => {
  return {
    id: 'action-1',
    label: '立即查看',
    type: 'open-url',
    payload: {
      url: 'https://example.com',
    },
  };
};

const normalizeOptionalText = (value: string): string | undefined => {
  return value === '' ? undefined : value;
};

const resolvePrimaryAction = (actions: WidgetAction[] | undefined): WidgetAction => {
  const candidate = Array.isArray(actions) ? actions[0] : undefined;

  if (!candidate) {
    return createDefaultAction();
  }

  if (candidate.type === 'insert-text') {
    return {
      id: candidate.id ?? 'action-1',
      label: candidate.label || '立即插入',
      type: 'insert-text',
      payload: {
        text:
          typeof candidate.payload?.text === 'string'
            ? candidate.payload.text
            : '插入内容',
      },
    };
  }

  return {
    id: candidate.id ?? 'action-1',
    label: candidate.label || '立即查看',
    type: 'open-url',
    payload: {
      url:
        typeof candidate.payload?.url === 'string'
          ? candidate.payload.url
          : 'https://example.com',
    },
  };
};

export const ActionCardWidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onChange,
  theme,
}) => {
  const primaryAction = resolvePrimaryAction(widget.actions);

  const updateAction = (nextAction: WidgetAction): void => {
    onChange({
      ...widget,
      actions: [nextAction],
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

      <Text style={[styles.label, {color: theme.textDark}]}>主按钮</Text>
      <TextInput
        placeholder="按钮文案"
        placeholderTextColor={theme.textLight}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        value={primaryAction.label}
        onChangeText={label => {
          updateAction({
            ...primaryAction,
            label,
          });
        }}
      />

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              borderColor: theme.border,
              backgroundColor:
                primaryAction.type === 'open-url'
                  ? theme.primaryTransparent
                  : theme.surface,
            },
          ]}
          onPress={() => {
            updateAction({
              ...primaryAction,
              type: 'open-url',
              payload: {
                url: 'https://example.com',
              },
            });
          }}>
          <Text style={[styles.typeButtonText, {color: theme.textDark}]}>
            打开链接
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              borderColor: theme.border,
              backgroundColor:
                primaryAction.type === 'insert-text'
                  ? theme.primaryTransparent
                  : theme.surface,
            },
          ]}
          onPress={() => {
            updateAction({
              ...primaryAction,
              type: 'insert-text',
              payload: {
                text: '插入内容',
              },
            });
          }}>
          <Text style={[styles.typeButtonText, {color: theme.textDark}]}>
            插入文本
          </Text>
        </TouchableOpacity>
      </View>

      {primaryAction.type === 'insert-text' ? (
        <TextInput
          placeholder="插入文本"
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
          value={
            typeof primaryAction.payload?.text === 'string'
              ? primaryAction.payload.text
              : ''
          }
          onChangeText={text => {
            updateAction({
              ...primaryAction,
              payload: {
                text,
              },
            });
          }}
        />
      ) : (
        <TextInput
          placeholder="URL"
          placeholderTextColor={theme.textLight}
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={
            typeof primaryAction.payload?.url === 'string'
              ? primaryAction.payload.url
              : ''
          }
          onChangeText={url => {
            updateAction({
              ...primaryAction,
              payload: {
                url,
              },
            });
          }}
        />
      )}
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
