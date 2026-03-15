import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {EditNoteAudioBlock} from './EditNoteAudioBlock';

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

describe('EditNoteAudioBlock', () => {
  test('shows play label when audio is inactive', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteAudioBlock
          audioIndex={1}
          isActive={false}
          onDelete={() => {}}
          onPlay={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '播放',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('shows pause label when audio is active', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteAudioBlock
          audioIndex={1}
          isActive
          onDelete={() => {}}
          onPlay={() => {}}
          theme={theme}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.type === Text && node.props.children === '暂停',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('calls onPlay with audio index when pressing play button', async () => {
    const onPlay = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteAudioBlock
          audioIndex={2}
          isActive={false}
          onDelete={() => {}}
          onPlay={onPlay}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '播放').props.onPress();
    });

    expect(onPlay).toHaveBeenCalledWith(2);
  });

  test('calls onDelete with audio index when pressing delete button', async () => {
    const onDelete = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteAudioBlock
          audioIndex={2}
          isActive={false}
          onDelete={onDelete}
          onPlay={() => {}}
          theme={theme}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '×').props.onPress();
    });

    expect(onDelete).toHaveBeenCalledWith(2);
  });
});
