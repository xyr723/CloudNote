import type {ComponentType} from 'react';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {MetricWidgetEditor} from '../ui/MetricWidgetEditor';
import {TodoListWidgetEditor} from '../ui/TodoListWidgetEditor';

export type WidgetEditorProps = {
  widget: WidgetSchema;
  onChange: (nextWidget: WidgetSchema) => void;
  theme: ThemeColors;
};

export type WidgetEditorRegistry = Partial<
  Record<WidgetType, ComponentType<WidgetEditorProps>>
>;

export const widgetEditorRegistry: WidgetEditorRegistry = {
  metric: MetricWidgetEditor,
  'todo-list': TodoListWidgetEditor,
};
