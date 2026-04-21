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

describe('phase6 cleanup status alignment', () => {
  test('removes legacy app shims', () => {
    expect(existsSync(resolveRepoPath('app/utils/chatComplete.ts'))).toBe(false);
    expect(existsSync(resolveRepoPath('app/theme/colors.ts'))).toBe(false);
  });

  test('removes unused phase6 dependencies from package.json', () => {
    const packageJson = JSON.parse(
      readFileSync(resolveRepoPath('package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.axios).toBeUndefined();
    expect(packageJson.dependencies?.md5).toBeUndefined();
    expect(packageJson.devDependencies?.['@types/md5']).toBeUndefined();
  });

  test('updates readme to reflect live draft document preview', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      '预览态当前直接消费 live `draft.document`，不再走 parse + merge 回退链路。',
    );
    expect(readme).not.toContain(
      '预览态已优先合并当前文本解析结果与草稿中的 widget blocks，不再只依赖纯文本 parse。',
    );
    expect(readme).not.toContain(
      '再决定是否把 `document` 继续收口为唯一事实来源，逐步替代当前 `content + textSegments` 镜像关系',
    );
  });
});
