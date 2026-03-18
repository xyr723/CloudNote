import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetAction} from '../../../entities/widget/types';
import type {WidgetRendererComponentProps} from '../model/widgetRegistry';

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

export const ActionCardWidget: React.FC<WidgetRendererComponentProps> = ({
  theme,
  widget,
}) => {
  const title = widget.title ?? widget.type;
  const primaryAction = resolvePrimaryAction(widget.actions);
  const actionDetail =
    primaryAction.type === 'insert-text'
      ? primaryAction.payload?.text
      : primaryAction.payload?.url;

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
      {widget.description ? (
        <Text style={[styles.description, {color: theme.text}]}>
          {widget.description}
        </Text>
      ) : null}
      <View
        style={[
          styles.actionChip,
          {
            backgroundColor: theme.primaryTransparent,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.actionLabel, {color: theme.primaryDark}]}>
          {primaryAction.label}
        </Text>
      </View>
      {typeof actionDetail === 'string' ? (
        <Text style={[styles.actionDetail, {color: theme.textLight}]}>
          {actionDetail}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  actionChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
