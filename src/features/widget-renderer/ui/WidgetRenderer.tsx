import React from 'react';
import type {ThemeColors} from '../../../shared/theme/colors';
import type {WidgetSchema} from '../../../entities/widget/types';
import {widgetRegistry} from '../model/widgetRegistry';
import {FallbackWidgetCard} from './FallbackWidgetCard';

type WidgetRendererProps = {
  theme: ThemeColors;
  widget: WidgetSchema;
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  theme,
  widget,
}) => {
  const WidgetComponent = widgetRegistry[widget.type];

  if (!WidgetComponent) {
    return <FallbackWidgetCard theme={theme} widget={widget} />;
  }

  return <WidgetComponent theme={theme} widget={widget} />;
};
