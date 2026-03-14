import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import ProfilePage from './ProfilePage';
import {generateThemeColors} from '../../src/shared/theme/colors';

jest.mock('../../src/providers/providerRegistry', () => ({
  providerRegistry: {
    getAuthProvider: () => ({
      updateAvatar: jest.fn(),
      updatePassword: jest.fn(),
    }),
  },
}));

jest.mock('./ChangePasswordPage', () => {
  const {Text: MockText} = require('react-native');

  return function MockChangePasswordPage() {
    return <MockText>Mock Change Password Page</MockText>;
  };
});

jest.mock('../../src/features/trash/ui/TrashModal', () => ({
  TrashModal: () => {
    const {Text: MockText} = require('react-native');

    return <MockText>Mock Trash Modal</MockText>;
  },
}));

describe('ProfilePage', () => {
  test('opens trash modal from feature entry', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProfilePage
          username="alice"
          notesCount={3}
          onLogout={async () => {}}
          onClose={() => {}}
          onOpenSettings={() => {}}
          onUpdateAvatar={() => {}}
          visible
          theme={generateThemeColors('薄荷生巧', false)}
        />,
      );
    });

    const trashButton = renderer!.root.find(node => {
      if (node.type !== TouchableOpacity) {
        return false;
      }

      return (
        node.findAll(
          child => child.type === Text && child.props.children === '回收站',
        ).length > 0
      );
    });

    await ReactTestRenderer.act(async () => {
      trashButton.props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === 'Mock Trash Modal',
      ).length,
    ).toBeGreaterThan(0);
  });
});
