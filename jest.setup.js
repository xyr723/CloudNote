/* eslint-env jest */

jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: {
        DocumentDir: '/tmp',
      },
      cp: jest.fn(() => Promise.resolve()),
      exists: jest.fn(() => Promise.resolve(false)),
      mkdir: jest.fn(() => Promise.resolve()),
      unlink: jest.fn(() => Promise.resolve()),
    },
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-audio-recorder-player', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addPlayBackListener: jest.fn(),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    startPlayer: jest.fn(() => Promise.resolve()),
    startRecorder: jest.fn(() => Promise.resolve('/tmp/mock-audio.mp3')),
    stopPlayer: jest.fn(() => Promise.resolve()),
    stopRecorder: jest.fn(() => Promise.resolve('/tmp/mock-audio.mp3')),
  })),
}));
