import {saveUserAvatar, updateUserPassword} from './accountCommands';

const mockUpdateAvatar = jest.fn();
const mockUpdatePassword = jest.fn();

jest.mock('../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAuthProvider: () => ({
      updateAvatar: mockUpdateAvatar,
      updatePassword: mockUpdatePassword,
    }),
  },
}));

describe('accountCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saves avatar through auth provider boundary', async () => {
    mockUpdateAvatar.mockResolvedValue('file:///avatar.jpg');

    await expect(
      saveUserAvatar('alice', 'file:///selected.jpg'),
    ).resolves.toBe('file:///avatar.jpg');

    expect(mockUpdateAvatar).toHaveBeenCalledWith(
      'alice',
      'file:///selected.jpg',
    );
  });

  test('updates password through auth provider boundary', async () => {
    mockUpdatePassword.mockResolvedValue(undefined);

    await updateUserPassword({
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
      username: 'alice',
    });

    expect(mockUpdatePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
      username: 'alice',
    });
  });
});
