import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {FormWidgetEditor} from './FormWidgetEditor';

const theme = generateThemeColors('薄荷生巧', false);
const singleFieldWidget = {
  id: 'widget-1',
  type: 'form' as const,
  title: '联系表单',
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
const multiFieldWidget = {
  id: 'widget-2',
  type: 'form' as const,
  title: '报名表单',
  props: {
    fields: [
      {
        id: 'field-1',
        label: '姓名',
        type: 'text' as const,
        placeholder: '请输入姓名',
      },
      {
        id: 'field-2',
        label: '补充说明',
        type: 'textarea' as const,
        placeholder: '写点备注',
      },
    ],
  },
};

const findButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
  index: number = 0,
) => {
  return renderer.root.findAll(node => {
    if (node.type !== TouchableOpacity || node.props.disabled) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  })[index];
};

describe('FormWidgetEditor', () => {
  test('updates title field label type and placeholder through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <FormWidgetEditor
          widget={singleFieldWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
        '新的表单标题',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...singleFieldWidget,
      title: '新的表单标题',
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '字段标题 1'}).props.onChangeText(
        '联系人',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...singleFieldWidget,
      props: {
        fields: [
          {
            id: 'field-1',
            label: '联系人',
            type: 'text',
            placeholder: '请输入姓名',
          },
        ],
      },
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '多行文本').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...singleFieldWidget,
      props: {
        fields: [
          {
            id: 'field-1',
            label: '姓名',
            type: 'textarea',
            placeholder: '请输入姓名',
          },
        ],
      },
    });

    ReactTestRenderer.act(() => {
      renderer!.root.findByProps({placeholder: '占位提示 1'}).props.onChangeText(
        '请填写联系人姓名',
      );
    });

    expect(onChange).toHaveBeenCalledWith({
      ...singleFieldWidget,
      props: {
        fields: [
          {
            id: 'field-1',
            label: '姓名',
            type: 'text',
            placeholder: '请填写联系人姓名',
          },
        ],
      },
    });
  });

  test('adds and removes fields through onChange', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <FormWidgetEditor
          widget={multiFieldWidget}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '新增字段').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...multiFieldWidget,
      props: {
        fields: [
          ...multiFieldWidget.props.fields,
          {
            id: 'field-3',
            label: '',
            type: 'text',
            placeholder: '',
          },
        ],
      },
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '删除字段').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      ...multiFieldWidget,
      props: {
        fields: [multiFieldWidget.props.fields[1]],
      },
    });
  });

  test('creates first field when fields are missing', () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <FormWidgetEditor
          widget={{
            id: 'widget-3',
            type: 'form',
            title: '空表单',
            props: {},
          }}
          onChange={onChange}
          theme={theme}
        />,
      );
    });

    ReactTestRenderer.act(() => {
      findButtonByLabel(renderer!, '新增字段').props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith({
      id: 'widget-3',
      type: 'form',
      title: '空表单',
      props: {
        fields: [
          {
            id: 'field-1',
            label: '',
            type: 'text',
            placeholder: '',
          },
        ],
      },
    });
  });
});
