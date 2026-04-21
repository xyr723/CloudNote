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

describe('expo router route groups migration', () => {
  test('creates auth and notes route groups', () => {
    expect(existsSync(resolveRepoPath('src/app/(auth)/_layout.tsx'))).toBe(true);
    expect(existsSync(resolveRepoPath('src/app/(auth)/login.tsx'))).toBe(true);
    expect(existsSync(resolveRepoPath('src/app/(auth)/register.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolveRepoPath('src/app/(notes)/_layout.tsx'))).toBe(
      true,
    );
    expect(existsSync(resolveRepoPath('src/app/(notes)/index.tsx'))).toBe(true);
  });

  test('switches root route to auth redirect gate', () => {
    const rootIndex = readFileSync(resolveRepoPath('src/app/index.tsx'), 'utf8');

    expect(rootIndex).toContain('AuthIndexRedirect');
  });

  test('updates readme to reflect route groups and web baseline progress', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      'Expo Router 已开始接管 `auth / notes` 文件路由，当前由 `/(auth)` 和 `/(notes)` 组织登录与首页入口。',
    );
    expect(readme).toContain(
      'Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。',
    );
  });
});
