import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {ProfileModal} from './ProfileModal';

const mockPickSingleImageFromLibrary = jest.fn();
const mockSaveUserAvatar = jest.fn();
const mockUpdateUserPassword = jest.fn();

jest.mock('../../../shared/media/imagePicker', () => ({
  pickSingleImageFromLibrary: (...args: unknown[]) =>
    mockPickSingleImageFromLibrary(...args),
}));

jest.mock('../../../shared/account/accountCommands', () => ({
  saveUserAvatar: (...args: unknown[]) => mockSaveUserAvatar(...args),
  updateUserPassword: (...args: unknown[]) => mockUpdateUserPassword(...args),
}));

jest.mock('./ChangePasswordScreen', () => {
  const {Text: MockText} = require('react-native');

  return {
    ChangePasswordScreen: function MockChangePasswordScreen() {
      return <MockText>Mock Change Password Screen</MockText>;
    },
  };
});

jest.mock('../../trash/ui/TrashModal', () => ({
  TrashModal: () => {
    const {Text: MockText} = require('react-native');

    return <MockText>Mock Trash Modal</MockText>;
  },
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

describe('ProfileModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates avatar after confirming avatar selection', async () => {
    mockPickSingleImageFromLibrary.mockResolvedValue({uri: 'file:///picked.jpg'});
    mockSaveUserAvatar.mockResolvedValue('file:///avatar.jpg');

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProfileModal
          username="alice"
          notesCount={3}
          onLogout={async () => {}}
          onClose={() => {}}
          onOpenSettings={() => {}}
          onUpdateAvatar={() => {}}
          visible
          theme={theme}
        />,
      );
    });

    const avatarButton = renderer!.root.find(node => {
      if (node.type !== TouchableOpacity) {
        return false;
      }

      return (
        node.findAll(child => child.type === Text && child.props.children === 'A')
          .length > 0
      );
    });

    await ReactTestRenderer.act(async () => {
      await avatarButton.props.onPress();
    });

    const confirmButton = findButtonByText(renderer!, '选择图片');

    await ReactTestRenderer.act(async () => {
      await confirmButton.props.onPress();
    });

    expect(mockPickSingleImageFromLibrary).toHaveBeenCalled();
    expect(mockSaveUserAvatar).toHaveBeenCalledWith(
      'alice',
      'file:///picked.jpg',
    );
  });

  test('opens change password screen from profile feature entry', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProfileModal
          avatar={undefined}
          notesCount={3}
          onClose={() => {}}
          onLogout={async () => {}}
          onOpenSettings={() => {}}
          onUpdateAvatar={() => {}}
          theme={theme}
          username="alice"
          visible
        />,
      );
    });

    const button = findButtonByText(renderer!, '修改密码');

    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });

    expect(mockUpdateUserPassword).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAll(
        node =>
          node.type === Text &&
          node.props.children === 'Mock Change Password Screen',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('opens trash modal from profile feature entry', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProfileModal
          avatar={undefined}
          notesCount={3}
          onClose={() => {}}
          onLogout={async () => {}}
          onOpenSettings={() => {}}
          onUpdateAvatar={() => {}}
          theme={theme}
          username="alice"
          visible
        />,
      );
    });

    const button = findButtonByText(renderer!, '回收站');

    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === 'Mock Trash Modal',
      ).length,
    ).toBeGreaterThan(0);
  });
});
