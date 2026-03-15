import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {LoginScreen} from './LoginScreen';

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

describe('LoginScreen', () => {
  test('shows error feedback when sign in fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const onLogin = jest.fn(async () => {
        throw new Error('账号或密码错误');
      });

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <LoginScreen onLogin={onLogin} onRegister={() => {}} theme={theme} />,
        );
      });

      const inputs = renderer!.root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('alice');
        inputs[1].props.onChangeText('123456');
      });

      const loginButton = findButtonByText(renderer!, '登 录');

      await ReactTestRenderer.act(async () => {
        await loginButton.props.onPress();
      });

      expect(onLogin).toHaveBeenCalledWith('alice', '123456');
      expect(
        renderer!.root.findAll(
          node => node.type === Text && node.props.children === '登录失败',
        ).length,
      ).toBeGreaterThan(0);
      expect(
        renderer!.root.findAll(
          node => node.type === Text && node.props.children === '账号或密码错误',
        ).length,
      ).toBeGreaterThan(0);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
