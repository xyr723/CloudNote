import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Alert, Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {AvatarUpdateFlow} from './AvatarUpdateFlow';

const mockPickSingleImageFromLibrary = jest.fn();
const mockSaveUserAvatar = jest.fn();

jest.mock('../../../shared/media/imagePicker', () => ({
  pickSingleImageFromLibrary: (...args: unknown[]) =>
    mockPickSingleImageFromLibrary(...args),
}));

jest.mock('../../../shared/account/accountCommands', () => ({
  saveUserAvatar: (...args: unknown[]) => mockSaveUserAvatar(...args),
}));

const theme = generateThemeColors('薄荷生巧', false);

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });
};

const renderAvatarUpdateFlow = (onUpdateAvatar = jest.fn()) => {
  return ReactTestRenderer.create(
    <AvatarUpdateFlow
      onUpdateAvatar={onUpdateAvatar}
      theme={theme}
      username="alice">
      {openAvatarPicker => (
        <TouchableOpacity onPress={openAvatarPicker}>
          <Text>打开头像流程</Text>
        </TouchableOpacity>
      )}
    </AvatarUpdateFlow>,
  );
};

describe('AvatarUpdateFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('opens avatar confirmation modal from feature entry trigger', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = renderAvatarUpdateFlow();
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '打开头像流程').props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '选择头像',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('uploads avatar after confirming image selection', async () => {
    mockPickSingleImageFromLibrary.mockResolvedValue({uri: 'file:///picked.jpg'});
    mockSaveUserAvatar.mockResolvedValue('file:///avatar.jpg');
    const onUpdateAvatar = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = renderAvatarUpdateFlow(onUpdateAvatar);
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '打开头像流程').props.onPress();
      await findButtonByText(renderer!, '选择图片').props.onPress();
    });

    expect(mockPickSingleImageFromLibrary).toHaveBeenCalledTimes(1);
    expect(mockSaveUserAvatar).toHaveBeenCalledWith(
      'alice',
      'file:///picked.jpg',
    );
    expect(onUpdateAvatar).toHaveBeenCalledWith('file:///avatar.jpg');
  });

  test('shows alert when avatar upload fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockPickSingleImageFromLibrary.mockRejectedValue(new Error('选择图片时发生错误'));
    let renderer: ReactTestRenderer.ReactTestRenderer;

    try {
      await ReactTestRenderer.act(() => {
        renderer = renderAvatarUpdateFlow();
      });

      await ReactTestRenderer.act(async () => {
        await findButtonByText(renderer!, '打开头像流程').props.onPress();
        await findButtonByText(renderer!, '选择图片').props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledWith('错误', '选择图片时发生错误');
    } finally {
      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    }
  });
});
