export type PickedImageAsset = {
  uri: string;
};

type BrowserFile = {
  type?: string;
};

type BrowserFileInput = {
  accept: string;
  capture?: string;
  click: () => void;
  files?: BrowserFile[] | null;
  multiple: boolean;
  remove?: () => void;
  style: {
    display?: string;
  };
  type: string;
  addEventListener: (type: 'change', listener: () => void) => void;
  removeEventListener: (type: 'change', listener: () => void) => void;
};

type BrowserDocument = {
  body?: {
    appendChild: (node: BrowserFileInput) => void;
    removeChild: (node: BrowserFileInput) => void;
  };
  createElement: (tagName: 'input') => BrowserFileInput;
};

type BrowserFileReader = {
  result: string | ArrayBuffer | null;
  onerror: null | (() => void);
  onload: null | (() => void);
  readAsDataURL: (file: BrowserFile) => void;
};

type BrowserGlobals = {
  FileReader?: new () => BrowserFileReader;
  document?: BrowserDocument;
  window?: {
    addEventListener: (type: 'focus', listener: () => void) => void;
    removeEventListener: (type: 'focus', listener: () => void) => void;
  };
};

const browserGlobals = globalThis as unknown as BrowserGlobals;

const canUseBrowserPicker = (): boolean => {
  return Boolean(
    browserGlobals.document?.createElement &&
      browserGlobals.document.body &&
      browserGlobals.FileReader,
  );
};

const isImageFile = (file: BrowserFile): boolean => {
  return typeof file.type === 'string' && file.type.startsWith('image/');
};

const readFileAsDataUrl = (file: BrowserFile): Promise<string> => {
  const FileReaderConstructor = browserGlobals.FileReader;

  if (!FileReaderConstructor) {
    return Promise.reject(new Error('当前环境不支持读取图片'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReaderConstructor();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('读取图片失败'));
    };
    reader.onerror = () => {
      reject(new Error('读取图片失败'));
    };
    reader.readAsDataURL(file);
  });
};

const openBrowserImagePicker = ({
  capture,
  errorMessage,
  multiple,
}: {
  capture?: string;
  errorMessage: string;
  multiple: boolean;
}): Promise<PickedImageAsset[]> => {
  if (!canUseBrowserPicker()) {
    return Promise.reject(new Error(errorMessage));
  }

  const document = browserGlobals.document!;
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = multiple;
  input.style.display = 'none';

  if (capture) {
    input.capture = capture;
  }

  document.body!.appendChild(input);

  return new Promise((resolve, reject) => {
    let hasSettled = false;
    let focusTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      input.removeEventListener('change', handleChange);

      if (browserGlobals.window) {
        browserGlobals.window.removeEventListener('focus', handleWindowFocus);
      }

      if (focusTimer) {
        clearTimeout(focusTimer);
      }

      if (typeof input.remove === 'function') {
        input.remove();
      } else {
        document.body!.removeChild(input);
      }
    };

    const settleResolve = (assets: PickedImageAsset[]) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      resolve(assets);
    };

    const settleReject = () => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      reject(new Error(errorMessage));
    };

    const handleWindowFocus = () => {
      focusTimer = setTimeout(() => {
        if (!hasSettled) {
          settleResolve([]);
        }
      }, 0);
    };

    const handleChange = () => {
      const files = (input.files ?? []).filter(isImageFile);

      if (files.length === 0) {
        settleResolve([]);
        return;
      }

      Promise.all(files.map(readFileAsDataUrl))
        .then(uris => {
          settleResolve(
            uris.map(uri => ({
              uri,
            })),
          );
        })
        .catch(() => {
          settleReject();
        });
    };

    input.addEventListener('change', handleChange);

    if (browserGlobals.window) {
      browserGlobals.window.addEventListener('focus', handleWindowFocus);
    }

    input.click();
  });
};

export async function pickImagesFromLibrary(): Promise<PickedImageAsset[]> {
  return openBrowserImagePicker({
    errorMessage: '选择图片时发生错误',
    multiple: true,
  });
}

export async function pickSingleImageFromLibrary(): Promise<PickedImageAsset | null> {
  const assets = await openBrowserImagePicker({
    errorMessage: '选择图片时发生错误',
    multiple: false,
  });

  return assets[0] ?? null;
}

export async function captureImage(): Promise<PickedImageAsset | null> {
  const assets = await openBrowserImagePicker({
    capture: 'environment',
    errorMessage: '拍照时发生错误',
    multiple: false,
  });

  return assets[0] ?? null;
}
