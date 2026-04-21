export {};

const {existsSync, readFileSync} = require('fs') as {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: string) => string;
};

declare const process: {
  cwd: () => string;
};

const resolveRepoPath = (...segments: string[]) => {
  return `${process.cwd()}/${segments.join('/')}`;
};

describe('expo runtime baseline', () => {
  test('adds expo dependency and scripts', () => {
    const packageJson = JSON.parse(
      readFileSync(resolveRepoPath('package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies?.expo).toBeDefined();
    expect(packageJson.scripts?.['expo:start']).toBe('expo start');
    expect(packageJson.scripts?.['expo:android']).toBe('expo run:android');
    expect(packageJson.scripts?.['expo:ios']).toBe('expo run:ios');
    expect(packageJson.scripts?.['expo:web']).toBe('expo start --web');
  });

  test('switches root registration to expo registerRootComponent', () => {
    const indexContent = readFileSync(resolveRepoPath('index.js'), 'utf8');

    expect(indexContent).toContain("import {registerRootComponent} from 'expo';");
    expect(indexContent).toContain('registerRootComponent(App);');
  });

  test('switches babel and metro to expo toolchain', () => {
    const babelConfig = readFileSync(resolveRepoPath('babel.config.js'), 'utf8');
    const metroConfig = readFileSync(resolveRepoPath('metro.config.js'), 'utf8');

    expect(babelConfig).toContain('babel-preset-expo');
    expect(metroConfig).toContain("require('expo/metro-config')");
    expect(metroConfig).toContain('react-native-svg-transformer');
  });

  test('adds expo app config structure', () => {
    const appConfig = JSON.parse(
      readFileSync(resolveRepoPath('app.json'), 'utf8'),
    ) as {
      expo?: {
        name?: string;
        slug?: string;
      };
    };

    expect(appConfig.expo?.name).toBe('CloudNote');
    expect(appConfig.expo?.slug).toBe('cloudnote');
  });

  test('documents expo runtime baseline progress in readme', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      'Expo runtime baseline 已开始，当前已切到 Expo CLI 驱动的 bare app 配置。',
    );
    expect(readme).toContain(
      'Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。',
    );
  });

  test('ignores expo local workspace state', () => {
    const gitignore = readFileSync(resolveRepoPath('.gitignore'), 'utf8');

    expect(gitignore).toContain('.expo/');
  });

  test('still keeps current root app entry file', () => {
    expect(existsSync(resolveRepoPath('App.tsx'))).toBe(true);
  });
});
