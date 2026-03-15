import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Image, Text, TouchableOpacity} from 'react-native';
import {EditNoteImageBlock} from './EditNoteImageBlock';

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

describe('EditNoteImageBlock', () => {
  test('renders image uri', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteImageBlock
          imageIndex={1}
          imageUri="file:///image-1.jpg"
          onDelete={() => {}}
        />,
      );
    });

    expect(renderer!.root.findByType(Image).props.source).toEqual({
      uri: 'file:///image-1.jpg',
    });
  });

  test('calls onDelete with image index when pressing delete button', async () => {
    const onDelete = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditNoteImageBlock
          imageIndex={2}
          imageUri="file:///image-2.jpg"
          onDelete={onDelete}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer!, '×').props.onPress();
    });

    expect(onDelete).toHaveBeenCalledWith(2);
  });

  test('logs image error details when image loading fails', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    let renderer: ReactTestRenderer.ReactTestRenderer;

    try {
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <EditNoteImageBlock
            imageIndex={0}
            imageUri="file:///broken-image.jpg"
            onDelete={() => {}}
          />,
        );
      });

      await ReactTestRenderer.act(async () => {
        renderer!.root
          .findByType(Image)
          .props.onError({nativeEvent: {error: 'load failed'}});
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('图片加载错误:', 'load failed');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '图片URL:',
        'file:///broken-image.jpg',
      );
    } finally {
      consoleLogSpy.mockRestore();
    }
  });
});
