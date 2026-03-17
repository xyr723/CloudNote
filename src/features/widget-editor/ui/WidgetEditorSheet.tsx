import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetSchema} from '../../../entities/widget/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {widgetEditorRegistry} from '../model/widgetEditorRegistry';
import {FallbackWidgetEditor} from './FallbackWidgetEditor';

type WidgetEditorSheetProps = {
  mode?: 'create' | 'edit';
  visible: boolean;
  widget: WidgetSchema | null;
  onClose: () => void;
  onDelete: () => void;
  onSave: (widget: WidgetSchema) => void;
  theme: ThemeColors;
};

export const WidgetEditorSheet: React.FC<WidgetEditorSheetProps> = ({
  mode = 'edit',
  visible,
  widget,
  onClose,
  onDelete,
  onSave,
  theme,
}) => {
  const [draftWidget, setDraftWidget] = useState<WidgetSchema | null>(widget);

  useEffect(() => {
    setDraftWidget(widget);
  }, [widget, visible]);

  if (!visible || !draftWidget) {
    return null;
  }

  const EditorComponent = widgetEditorRegistry[draftWidget.type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.title, {color: theme.textDark}]}>
        {mode === 'create' ? '新建组件' : '编辑组件'}
      </Text>
      <View style={styles.body}>
        {EditorComponent ? (
          <EditorComponent
            widget={draftWidget}
            onChange={setDraftWidget}
            theme={theme}
          />
        ) : (
          <FallbackWidgetEditor
            widget={draftWidget}
            onChange={setDraftWidget}
            theme={theme}
          />
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, {borderColor: theme.border}]}
          onPress={onClose}>
          <Text style={[styles.actionText, {color: theme.text}]}>取消</Text>
        </TouchableOpacity>
        {mode === 'edit' ? (
          <TouchableOpacity
            style={[styles.actionButton, {borderColor: theme.border}]}
            onPress={onDelete}>
            <Text style={[styles.actionText, {color: theme.error}]}>
              删除组件
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryAction,
            {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
          ]}
          onPress={() => onSave(draftWidget)}>
          <Text style={[styles.actionText, {color: theme.surface}]}>保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  body: {
    gap: 12,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  primaryAction: {
    minWidth: 72,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
