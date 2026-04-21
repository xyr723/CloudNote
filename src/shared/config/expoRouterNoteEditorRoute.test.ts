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

describe('expo router note editor route migration', () => {
  test('creates standalone note editor route file', () => {
    expect(existsSync(resolveRepoPath('src/app/(notes)/editor.tsx'))).toBe(true);
  });

  test('updates readme to reflect standalone editor route progress', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      'note editor 已开始拆到独立 Expo Router 页面，当前由 `/(notes)/editor` 接管新建与编辑入口。',
    );
    expect(readme).toContain(
      '首页内部 modal 当前只保留旧入口兼容，不再作为 Expo Router notes 页的主编辑入口。',
    );
  });
});
