import RNFetchBlob from 'react-native-blob-util';
import {Platform} from 'react-native';

const FILE_URI_PREFIX = 'file://';
export const managedDocumentDir = RNFetchBlob.fs.dirs.DocumentDir;

const getDirectoryName = (filePath: string): string => {
  const pathSegments = filePath.split('/');
  pathSegments.pop();
  return pathSegments.join('/');
};

export const stripFileScheme = (filePath: string): string => {
  return filePath.startsWith(FILE_URI_PREFIX)
    ? filePath.slice(FILE_URI_PREFIX.length)
    : filePath;
};

export const toPlatformFileUri = (filePath: string): string => {
  if (/^https?:\/\//.test(filePath) || /^data:/.test(filePath)) {
    return filePath;
  }

  const normalizedPath = stripFileScheme(filePath);
  return Platform.OS === 'android'
    ? `${FILE_URI_PREFIX}${normalizedPath}`
    : normalizedPath;
};

export const ensureDirectoryExists = async (
  directoryPath: string,
): Promise<void> => {
  try {
    await RNFetchBlob.fs.mkdir(directoryPath);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '创建目录时发生未知错误';

    if (!message.includes('already exists')) {
      throw error;
    }
  }
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  return RNFetchBlob.fs.exists(stripFileScheme(filePath));
};

export const copyManagedFile = async (
  sourceUri: string,
  targetPath: string,
): Promise<string> => {
  if (/^https?:\/\//.test(sourceUri) || /^data:/.test(sourceUri)) {
    return sourceUri;
  }

  const normalizedSourcePath = stripFileScheme(sourceUri);
  const normalizedTargetPath = stripFileScheme(targetPath);
  const sourceExists = await fileExists(normalizedSourcePath);

  if (!sourceExists) {
    return sourceUri;
  }

  await ensureDirectoryExists(getDirectoryName(normalizedTargetPath));

  if (normalizedSourcePath !== normalizedTargetPath) {
    await RNFetchBlob.fs.cp(normalizedSourcePath, normalizedTargetPath);
  }

  return toPlatformFileUri(normalizedTargetPath);
};

export const deleteManagedFile = async (filePath: string): Promise<void> => {
  await RNFetchBlob.fs.unlink(stripFileScheme(filePath));
};
