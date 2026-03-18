import ReactTestRenderer from 'react-test-renderer';
import {
  findButtonByLabel,
  formWidget,
  renderWidgetEditorSheet,
  todoWidget,
} from './WidgetEditorSheet.testUtils';

test('triggers delete when delete button is pressed', () => {
  const onDelete = jest.fn();
  const renderer = renderWidgetEditorSheet({
    onDelete,
    widget: todoWidget,
  });

  ReactTestRenderer.act(() => {
    findButtonByLabel(renderer, '删除组件').props.onPress();
  });

  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('does not submit changes when cancel button is pressed', () => {
  const onClose = jest.fn();
  const onSave = jest.fn();
  const renderer = renderWidgetEditorSheet({
    onClose,
    onSave,
    widget: todoWidget,
  });

  ReactTestRenderer.act(() => {
    findButtonByLabel(renderer, '取消').props.onPress();
  });

  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('saves the latest edited widget', () => {
  const onSave = jest.fn();
  const renderer = renderWidgetEditorSheet({
    onSave,
    widget: todoWidget,
  });

  ReactTestRenderer.act(() => {
    renderer.root.findByProps({placeholder: '组件标题'}).props.onChangeText(
      '编辑后的待办',
    );
  });

  ReactTestRenderer.act(() => {
    findButtonByLabel(renderer, '保存').props.onPress();
  });

  expect(onSave).toHaveBeenCalledWith({
    ...todoWidget,
    title: '编辑后的待办',
  });
});

test('saves fallback widgets in create mode', () => {
  const onSave = jest.fn();
  const renderer = renderWidgetEditorSheet({
    mode: 'create',
    onSave,
    widget: formWidget,
  });

  ReactTestRenderer.act(() => {
    findButtonByLabel(renderer, '保存').props.onPress();
  });

  expect(onSave).toHaveBeenCalledWith(formWidget);
});
