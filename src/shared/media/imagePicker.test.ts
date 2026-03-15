import * as NativeImagePicker from 'react-native-image-picker';
import {
  captureImage,
  pickImagesFromLibrary,
  pickSingleImageFromLibrary,
} from './imagePicker';

describe('imagePicker', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns all selected images from photo library', async () => {
    jest
      .spyOn(NativeImagePicker, 'launchImageLibrary')
      .mockImplementation((_options, callback) => {
        callback?.({
          assets: [{uri: 'file:///0.jpg'}, {uri: 'file:///1.jpg'}],
        });
        return Promise.resolve({});
      });

    await expect(pickImagesFromLibrary()).resolves.toEqual([
      {uri: 'file:///0.jpg'},
      {uri: 'file:///1.jpg'},
    ]);
  });

  test('returns first image when picking a single avatar image', async () => {
    jest
      .spyOn(NativeImagePicker, 'launchImageLibrary')
      .mockImplementation((_options, callback) => {
        callback?.({
          assets: [{uri: 'file:///avatar.jpg'}],
        });
        return Promise.resolve({});
      });

    await expect(pickSingleImageFromLibrary()).resolves.toEqual({
      uri: 'file:///avatar.jpg',
    });
  });

  test('throws when camera picker reports an error', async () => {
    jest
      .spyOn(NativeImagePicker, 'launchCamera')
      .mockImplementation((_options, callback) => {
        callback?.({
          errorCode: 'camera_unavailable',
        });
        return Promise.resolve({});
      });

    await expect(captureImage()).rejects.toThrow('拍照时发生错误');
  });
});
