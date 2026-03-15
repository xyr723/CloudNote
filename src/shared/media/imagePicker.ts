import * as NativeImagePicker from 'react-native-image-picker';

export type PickedImageAsset = {
  uri: string;
};

type PickerResponse = NativeImagePicker.ImagePickerResponse;

function extractPickedImages(
  response: PickerResponse,
  errorMessage: string,
): PickedImageAsset[] {
  if (response.didCancel) {
    return [];
  }

  if (response.errorCode) {
    throw new Error(errorMessage);
  }

  return (response.assets ?? [])
    .filter(
      (asset): asset is NativeImagePicker.Asset & {uri: string} =>
        typeof asset.uri === 'string' && asset.uri.length > 0,
    )
    .map(asset => ({uri: asset.uri}));
}

function pickImages(
  errorMessage: string,
  picker: (
    callback: (response: PickerResponse) => void,
  ) => Promise<NativeImagePicker.ImagePickerResponse>,
): Promise<PickedImageAsset[]> {
  return new Promise((resolve, reject) => {
    picker(response => {
      try {
        resolve(extractPickedImages(response, errorMessage));
      } catch (error) {
        reject(error);
      }
    }).catch(reject);
  });
}

export function pickImagesFromLibrary(): Promise<PickedImageAsset[]> {
  return pickImages('选择图片时发生错误', callback =>
    NativeImagePicker.launchImageLibrary(
      {
        includeBase64: true,
        maxHeight: 1024,
        maxWidth: 1024,
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 0,
      },
      callback,
    ),
  );
}

export async function pickSingleImageFromLibrary(): Promise<PickedImageAsset | null> {
  const assets = await pickImages('选择图片时发生错误', callback =>
    NativeImagePicker.launchImageLibrary(
      {
        includeBase64: true,
        mediaType: 'photo',
        selectionLimit: 1,
      },
      callback,
    ),
  );

  return assets[0] ?? null;
}

export async function captureImage(): Promise<PickedImageAsset | null> {
  const assets = await pickImages('拍照时发生错误', callback =>
    NativeImagePicker.launchCamera(
      {
        includeBase64: true,
        maxHeight: 1024,
        maxWidth: 1024,
        mediaType: 'photo',
        quality: 0.8,
      },
      callback,
    ),
  );

  return assets[0] ?? null;
}
