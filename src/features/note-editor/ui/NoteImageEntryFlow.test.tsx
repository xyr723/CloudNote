import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {NoteImageEntryFlow} from './NoteImageEntryFlow';

const theme = generateThemeColors('薄荷生巧', false);

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  const matches = renderer.root.findAll(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });

  return matches[matches.length - 1];
};

const renderImageEntryFlow = (overrides?: {
  onCaptureImage?: jest.Mock;
  onPickImage?: jest.Mock;
}) => {
  return ReactTestRenderer.create(
    <NoteImageEntryFlow
      onCaptureImage={overrides?.onCaptureImage ?? jest.fn()}
      onPickImage={overrides?.onPickImage ?? jest.fn()}
      theme={theme}>
      {openImageOptions => (
        <TouchableOpacity onPress={openImageOptions}>
          <Text>打开图片入口</Text>
        </TouchableOpacity>
      )}
    </NoteImageEntryFlow>,
  );
};

describe('NoteImageEntryFlow', () => {
  test('opens image options modal from feature entry trigger', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = renderImageEntryFlow();
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '打开图片入口').props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '添加图片',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('closes modal and calls gallery action from feature entry', async () => {
    const onPickImage = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = renderImageEntryFlow({onPickImage});
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '打开图片入口').props.onPress();
      await findButtonByText(renderer!, '从相册选择').props.onPress();
    });

    expect(onPickImage).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '添加图片',
      ).length,
    ).toBe(0);
  });

  test('closes modal and calls camera action from feature entry', async () => {
    const onCaptureImage = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = renderImageEntryFlow({onCaptureImage});
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '打开图片入口').props.onPress();
      await findButtonByText(renderer!, '拍照').props.onPress();
    });

    expect(onCaptureImage).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '添加图片',
      ).length,
    ).toBe(0);
  });
});
