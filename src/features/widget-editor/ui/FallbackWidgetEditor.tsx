import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {WidgetEditorProps} from '../model/widgetEditorRegistry';

export const FallbackWidgetEditor: React.FC<WidgetEditorProps> = ({
  theme,
  widget,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: theme.textDark}]}>
        {widget.title ?? widget.type}
      </Text>
      <Text style={[styles.type, {color: theme.text}]}>类型：{widget.type}</Text>
      {widget.description ? (
        <Text style={[styles.description, {color: theme.text}]}>
          {widget.description}
        </Text>
      ) : null}
      <Text style={[styles.hint, {color: theme.textLight}]}>
        暂不支持编辑此类型组件
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  type: {
    fontSize: 13,
    fontWeight: '600',
  },
});
