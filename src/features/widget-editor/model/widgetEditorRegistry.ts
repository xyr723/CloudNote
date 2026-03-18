import type {ComponentType} from 'react';
import type {WidgetSchema, WidgetType} from '../../../entities/widget/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {ActionCardWidgetEditor} from '../ui/ActionCardWidgetEditor';
import {FormWidgetEditor} from '../ui/FormWidgetEditor';
import {MetricWidgetEditor} from '../ui/MetricWidgetEditor';
import {QuoteWidgetEditor} from '../ui/QuoteWidgetEditor';
import {TimelineWidgetEditor} from '../ui/TimelineWidgetEditor';
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
  'action-card': ActionCardWidgetEditor,
  form: FormWidgetEditor,
  metric: MetricWidgetEditor,
  quote: QuoteWidgetEditor,
  timeline: TimelineWidgetEditor,
  'todo-list': TodoListWidgetEditor,
};
