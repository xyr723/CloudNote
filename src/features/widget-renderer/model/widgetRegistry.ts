import type {ComponentType} from 'react';
import type {ThemeColors} from '../../../shared/theme/colors';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import {ActionCardWidget} from '../ui/ActionCardWidget';
import {FormWidget} from '../ui/FormWidget';
import {MetricWidget} from '../ui/MetricWidget';
import {QuoteWidget} from '../ui/QuoteWidget';
import {TimelineWidget} from '../ui/TimelineWidget';
import {TodoListWidget} from '../ui/TodoListWidget';

export type WidgetRendererComponentProps = {
  theme: ThemeColors;
  widget: WidgetSchema;
};

export type WidgetRegistry = Partial<
  Record<WidgetType, ComponentType<WidgetRendererComponentProps>>
>;

export const widgetRegistry: WidgetRegistry = {
  'action-card': ActionCardWidget,
  form: FormWidget,
  metric: MetricWidget,
  quote: QuoteWidget,
  timeline: TimelineWidget,
  'todo-list': TodoListWidget,
};
