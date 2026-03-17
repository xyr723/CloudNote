import type {ComponentType} from 'react';
import type {ThemeColors} from '../../../shared/theme/colors';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import {MetricWidget} from '../ui/MetricWidget';
import {TodoListWidget} from '../ui/TodoListWidget';

export type WidgetRendererComponentProps = {
  theme: ThemeColors;
  widget: WidgetSchema;
};

export type WidgetRegistry = Partial<
  Record<WidgetType, ComponentType<WidgetRendererComponentProps>>
>;

export const widgetRegistry: WidgetRegistry = {
  metric: MetricWidget,
  'todo-list': TodoListWidget,
};
