import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {SettingsModal} from './SettingsModal';

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

describe('SettingsModal', () => {
  test('emits theme color selection from feature entry', async () => {
    const onThemeColorChange = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SettingsModal
          isDarkMode={false}
          onClose={() => {}}
          onThemeColorChange={onThemeColorChange}
          onToggleDarkMode={() => {}}
          theme={theme}
          themeColor="#BBE1E4"
          visible
        />,
      );
    });

    const button = findButtonByText(renderer!, '桃桃乌龙');

    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });

    expect(onThemeColorChange).toHaveBeenCalledWith('#FBD7D7');
  });
});
