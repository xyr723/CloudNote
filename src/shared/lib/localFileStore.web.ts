import {Platform} from 'react-native';

const FILE_URI_PREFIX = 'file://';
export const managedDocumentDir = '/cloudnote-web';

const getDirectoryName = (filePath: string): string => {
  const pathSegments = filePath.split('/');
  pathSegments.pop();
  return pathSegments.join('/');
};

const webManagedFiles = new Map<string, string>();

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
  if (!directoryPath || directoryPath === '.') {
    return;
  }

  webManagedFiles.set(directoryPath, directoryPath);
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  const normalizedPath = stripFileScheme(filePath);
  return webManagedFiles.has(normalizedPath);
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
  await ensureDirectoryExists(getDirectoryName(normalizedTargetPath));

  if (!webManagedFiles.has(normalizedSourcePath)) {
    return sourceUri;
  }

  webManagedFiles.set(
    normalizedTargetPath,
    webManagedFiles.get(normalizedSourcePath) ?? normalizedSourcePath,
  );

  return toPlatformFileUri(normalizedTargetPath);
};

export const deleteManagedFile = async (filePath: string): Promise<void> => {
  webManagedFiles.delete(stripFileScheme(filePath));
};
