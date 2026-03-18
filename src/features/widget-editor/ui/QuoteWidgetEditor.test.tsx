import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {generateThemeColors} from '../../../shared/theme/colors';
import {QuoteWidgetEditor} from './QuoteWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const quoteWidget = {
  id: 'widget-1',
  type: 'quote' as const,
  title: '本周摘录',
  description: '乔布斯',
  props: {
    content: '保持饥饿，保持愚蠢',
  },
};

describe('QuoteWidgetEditor', () => {
  test('updates title content and source through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuoteWidgetEditor
          widget={quoteWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '每日摘录',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...quoteWidget,
      title: '每日摘录',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '引用正文'}).props.onChangeText(
        '求知若饥，虚心若愚',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...quoteWidget,
      props: {
        content: '求知若饥，虚心若愚',
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '来源（可选）'}).props.onChangeText(
        '《全球概览》',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...quoteWidget,
      description: '《全球概览》',
      props: {
        content: '保持饥饿，保持愚蠢',
      },
    });
  });

  test('normalizes empty source to undefined', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QuoteWidgetEditor
          widget={quoteWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '来源（可选）'}).props.onChangeText(
        '',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...quoteWidget,
      description: undefined,
      props: {
        content: '保持饥饿，保持愚蠢',
      },
    });
  });
});
