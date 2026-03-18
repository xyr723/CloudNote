import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {WidgetEditorSheet} from './WidgetEditorSheet';

export const theme = generateThemeColors('薄荷生巧', false);

export const todoWidget = {
  id: 'widget-1',
  type: 'todo-list' as const,
  title: '原待办',
  props: {
    items: ['事项一'],
  },
};

export const actionCardWidget = {
  id: 'widget-0',
  type: 'action-card' as const,
  title: '快捷入口',
  description: '查看今日数据',
  props: {},
  actions: [
    {
      id: 'action-1',
      label: '立即查看',
      type: 'open-url' as const,
      payload: {
        url: 'https://example.com',
      },
    },
  ],
};

export const metricWidget = {
  id: 'widget-2',
  type: 'metric' as const,
  title: '指标卡片',
  description: '展示一个关键指标',
  props: {
    value: '99%',
  },
};

export const quoteWidget = {
  id: 'widget-4',
  type: 'quote' as const,
  title: '摘录卡片',
  description: '乔布斯',
  props: {
    content: '保持饥饿，保持愚蠢',
  },
};

export const timelineWidget = {
  id: 'widget-3',
  type: 'timeline' as const,
  title: '项目里程碑',
  props: {
    items: [
      {time: '09:00', content: '开始整理需求'},
      {time: '11:00', content: '完成第一版方案'},
    ],
  },
};

export const formWidget = {
  id: 'widget-5',
  type: 'form' as const,
  title: '表单卡片',
  props: {
    fields: [
      {
        id: 'field-1',
        label: '姓名',
        type: 'text' as const,
        placeholder: '请输入姓名',
      },
    ],
  },
};

export const unsupportedWidget = {
  id: 'widget-6',
  type: 'unknown-widget' as WidgetType,
  title: '未知组件',
  description: '暂不支持直接编辑此类型组件',
  props: {},
};

export const findButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });
};

export const renderWidgetEditorSheet = ({
  mode,
  onClose = () => {},
  onDelete = () => {},
  onSave = () => {},
  visible = true,
  widget = todoWidget,
}: {
  mode?: 'create' | 'edit';
  onClose?: () => void;
  onDelete?: () => void;
  onSave?: (widget: WidgetSchema) => void;
  visible?: boolean;
  widget?: WidgetSchema;
}) => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <WidgetEditorSheet
        visible={visible}
        mode={mode}
        widget={widget}
        onClose={onClose}
        onDelete={onDelete}
        onSave={onSave}
        theme={theme}
      />,
    );
  });

  return renderer!;
};
