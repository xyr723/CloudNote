export type WidgetType =
  | 'todo-list'
  | 'action-card'
  | 'form'
  | 'quote'
  | 'metric'
  | 'timeline';

export type WidgetActionType =
  | 'open-url'
  | 'insert-text'
  | 'toggle'
  | 'submit-form';

export interface WidgetAction {
  id: string;
  label: string;
  type: WidgetActionType;
  payload?: Record<string, unknown>;
}

export interface WidgetLayout {
  span?: 1 | 2 | 3 | 4;
  minHeight?: number;
}

export interface WidgetSchema {
  id: string;
  type: WidgetType;
  title?: string;
  description?: string;
  props?: Record<string, unknown>;
  actions?: WidgetAction[];
  layout?: WidgetLayout;
}
