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

describe('expo router entry migration', () => {
  test('switches expo main entry to expo-router', () => {
    const packageJson = JSON.parse(
      readFileSync(resolveRepoPath('package.json'), 'utf8'),
    ) as {
      main?: string;
      dependencies?: Record<string, string>;
    };

    expect(packageJson.main).toBe('expo-router/entry');
    expect(packageJson.dependencies?.['expo-router']).toBeDefined();
  });

  test('adds router app config', () => {
    const appConfig = JSON.parse(
      readFileSync(resolveRepoPath('app.json'), 'utf8'),
    ) as {
      expo?: {
        experiments?: {typedRoutes?: boolean};
        scheme?: string;
        web?: {bundler?: string};
      };
    };

    expect(appConfig.expo?.scheme).toBe('cloudnote');
    expect(appConfig.expo?.experiments?.typedRoutes).toBe(true);
    expect(appConfig.expo?.web?.bundler).toBe('metro');
  });

  test('creates the minimal expo router app directory', () => {
    expect(existsSync(resolveRepoPath('src/app/_layout.tsx'))).toBe(true);
    expect(existsSync(resolveRepoPath('src/app/index.tsx'))).toBe(true);

    const layout = readFileSync(resolveRepoPath('src/app/_layout.tsx'), 'utf8');
    const index = readFileSync(resolveRepoPath('src/app/index.tsx'), 'utf8');

    expect(layout).toContain("from 'expo-router'");
    expect(index).toContain('AuthIndexRedirect');
  });

  test('updates readme to reflect router root entry progress', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      'Expo Router 已开始接管 `auth / notes` 文件路由，当前由 `/(auth)` 和 `/(notes)` 组织登录与首页入口。',
    );
    expect(readme).toContain(
      'Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。',
    );
  });
});
