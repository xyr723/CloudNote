import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {WidgetType} from '../../../entities/widget/types';
import type {ThemeColors} from '../../../shared/theme/colors';

type WidgetTypeOption = {
  type: WidgetType;
  title: string;
  description: string;
};

const WIDGET_TYPE_OPTIONS: WidgetTypeOption[] = [
  {
    type: 'todo-list',
    title: '待办清单',
    description: '适合记录待办事项与步骤列表',
  },
  {
    type: 'action-card',
    title: '动作卡片',
    description: '适合承载一个简短动作入口',
  },
  {
    type: 'form',
    title: '表单',
    description: '适合收集结构化输入内容',
  },
  {
    type: 'quote',
    title: '引用块',
    description: '适合展示摘要、引用或提醒',
  },
  {
    type: 'metric',
    title: '指标卡片',
    description: '适合展示一个关键数字或状态',
  },
  {
    type: 'timeline',
    title: '时间线',
    description: '适合按时间顺序组织事件节点',
  },
];

type WidgetTypePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: WidgetType) => void;
  theme: ThemeColors;
};

export const WidgetTypePickerSheet: React.FC<WidgetTypePickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  theme,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.title, {color: theme.textDark}]}>选择组件类型</Text>
      <View style={styles.options}>
        {WIDGET_TYPE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.type}
            style={[
              styles.optionButton,
              {
                borderColor: theme.border,
                backgroundColor: theme.primaryTransparent,
              },
            ]}
            onPress={() => onSelect(option.type)}>
            <Text style={[styles.optionTitle, {color: theme.textDark}]}>
              {option.title}
            </Text>
            <Text style={[styles.optionDescription, {color: theme.text}]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.cancelButton, {borderColor: theme.border}]}
        onPress={onClose}>
        <Text style={[styles.cancelButtonText, {color: theme.text}]}>取消</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  optionButton: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  options: {
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
