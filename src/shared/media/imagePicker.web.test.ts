import {
  captureImage,
  pickImagesFromLibrary,
  pickSingleImageFromLibrary,
} from './imagePicker.web';

type FakeFile = {
  dataUrl: string;
  type: string;
};

type FakeInput = {
  accept: string;
  capture?: string;
  click: jest.Mock<void, []>;
  files: FakeFile[] | null;
  multiple: boolean;
  remove: jest.Mock<void, []>;
  style: Record<string, string>;
  type: string;
  addEventListener: jest.Mock<void, [string, (event: unknown) => void]>;
  removeEventListener: jest.Mock<void, [string, (event: unknown) => void]>;
  dispatchChange: () => void;
};

type BrowserFileReaderCtor = new () => {
  result: string | null;
  onerror: null | (() => void);
  onload: null | (() => void);
  readAsDataURL: (file: FakeFile) => void;
};

const globalObject = globalThis as unknown as {
  FileReader?: BrowserFileReaderCtor;
  document?: {
    body: {
      appendChild: jest.Mock<void, [FakeInput]>;
      removeChild: jest.Mock<void, [FakeInput]>;
    };
    createElement: jest.Mock<FakeInput, [string]>;
  };
  window?: {
    addEventListener: jest.Mock<void, [string, () => void]>;
    removeEventListener: jest.Mock<void, [string, () => void]>;
  };
};

const createFakeInput = (): FakeInput => {
  const listeners = new Map<string, (event: unknown) => void>();
  const input: FakeInput = {
    accept: '',
    click: jest.fn(),
    files: null,
    multiple: false,
    remove: jest.fn(),
    style: {},
    type: '',
    addEventListener: jest.fn((type, listener) => {
      listeners.set(type, listener);
    }),
    removeEventListener: jest.fn((type, listener) => {
      const currentListener = listeners.get(type);

      if (currentListener === listener) {
        listeners.delete(type);
      }
    }),
    dispatchChange: () => {
      listeners.get('change')?.({
        target: input,
      });
    },
  };

  return input;
};

describe('imagePicker.web', () => {
  const originalDocument = globalObject.document;
  const originalFileReader = globalObject.FileReader;
  const originalWindow = globalObject.window;
  let createdInputs: FakeInput[] = [];

  beforeEach(() => {
    createdInputs = [];
    globalObject.document = {
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      },
      createElement: jest.fn((tagName: string) => {
        expect(tagName).toBe('input');
        const input = createFakeInput();
        createdInputs.push(input);
        return input;
      }),
    };
    globalObject.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    globalObject.FileReader = class MockFileReader {
      result: string | null = null;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      readAsDataURL(file: FakeFile) {
        this.result = file.dataUrl;
        this.onload?.();
      }
    } as unknown as BrowserFileReaderCtor;
  });

  afterAll(() => {
    globalObject.document = originalDocument;
    globalObject.FileReader = originalFileReader;
    globalObject.window = originalWindow;
  });

  test('reads selected images from the browser file input', async () => {
    const promise = pickImagesFromLibrary();
    const input = createdInputs[0];

    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*');
    expect(input.multiple).toBe(true);
    expect(input.click).toHaveBeenCalledTimes(1);

    input.files = [
      {
        dataUrl: 'data:image/png;base64,AAA',
        type: 'image/png',
      },
      {
        dataUrl: 'data:image/jpeg;base64,BBB',
        type: 'image/jpeg',
      },
    ];
    input.dispatchChange();

    await expect(promise).resolves.toEqual([
      {uri: 'data:image/png;base64,AAA'},
      {uri: 'data:image/jpeg;base64,BBB'},
    ]);
  });

  test('returns only the first image for single image picking', async () => {
    const promise = pickSingleImageFromLibrary();
    const input = createdInputs[0];

    expect(input.multiple).toBe(false);

    input.files = [
      {
        dataUrl: 'data:image/png;base64,AVATAR',
        type: 'image/png',
      },
      {
        dataUrl: 'data:image/png;base64,IGNORED',
        type: 'image/png',
      },
    ];
    input.dispatchChange();

    await expect(promise).resolves.toEqual({
      uri: 'data:image/png;base64,AVATAR',
    });
  });

  test('requests capture fallback when taking a photo on web', async () => {
    const promise = captureImage();
    const input = createdInputs[0];

    expect(input.capture).toBe('environment');

    input.files = [
      {
        dataUrl: 'data:image/png;base64,CAPTURE',
        type: 'image/png',
      },
    ];
    input.dispatchChange();

    await expect(promise).resolves.toEqual({
      uri: 'data:image/png;base64,CAPTURE',
    });
  });
});
