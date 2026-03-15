import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {ChangePasswordScreen} from './ChangePasswordScreen';

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

describe('ChangePasswordScreen', () => {
  test('blocks submit when confirm password does not match', async () => {
    const onChangePassword = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ChangePasswordScreen
          onBack={() => {}}
          onChangePassword={onChangePassword}
          theme={theme}
          username="alice"
        />,
      );
    });

    const inputs = renderer!.root.findAllByType(TextInput);

    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('old-pass');
      inputs[1].props.onChangeText('new-pass');
      inputs[2].props.onChangeText('bad-pass');
    });

    const button = findButtonByText(renderer!, '确认修改');

    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });

    expect(onChangePassword).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAll(
        node =>
          node.type === Text &&
          node.props.children === '两次输入的密码不一致',
      ).length,
    ).toBeGreaterThan(0);
  });
});
