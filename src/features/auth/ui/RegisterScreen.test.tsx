import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TextInput, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {RegisterScreen} from './RegisterScreen';

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

describe('RegisterScreen', () => {
  test('blocks submit when confirm password does not match', async () => {
    const onRegister = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <RegisterScreen
          onBack={() => {}}
          onRegister={onRegister}
          theme={theme}
        />,
      );
    });

    const inputs = renderer!.root.findAllByType(TextInput);

    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('alice');
      inputs[1].props.onChangeText('123456');
      inputs[2].props.onChangeText('654321');
    });

    const registerButton = findButtonByText(renderer!, '注 册');

    await ReactTestRenderer.act(async () => {
      await registerButton.props.onPress();
    });

    expect(onRegister).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAll(
        node =>
          node.type === Text &&
          node.props.children === '两次输入的密码不一致',
      ).length,
    ).toBeGreaterThan(0);
  });
});
