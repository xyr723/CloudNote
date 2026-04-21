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

describe('expo web baseline', () => {
  test('adds esbuild peer dependency for metro minifier', () => {
    const packageJson = JSON.parse(
      readFileSync(resolveRepoPath('package.json'), 'utf8'),
    ) as {
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.devDependencies?.esbuild).toBeDefined();
  });

  test('adds web fallbacks for native-only editor and media modules', () => {
    expect(existsSync(resolveRepoPath('src/shared/lib/localFileStore.web.ts'))).toBe(
      true,
    );
    expect(existsSync(resolveRepoPath('src/shared/media/imagePicker.web.ts'))).toBe(
      true,
    );
    expect(
      existsSync(
        resolveRepoPath(
          'src/features/note-editor/model/useAudioRecordingSession.web.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolveRepoPath('src/features/note-editor/ui/NoteEditorModal.web.tsx'),
      ),
    ).toBe(true);
  });

  test('adds release-grade pwa config and favicon asset', () => {
    const appConfig = JSON.parse(
      readFileSync(resolveRepoPath('app.json'), 'utf8'),
    ) as {
      expo?: {
        web?: {
          backgroundColor?: string;
          display?: string;
          favicon?: string;
          shortName?: string;
          themeColor?: string;
        };
      };
    };

    expect(appConfig.expo?.web?.display).toBe('standalone');
    expect(appConfig.expo?.web?.themeColor).toBeDefined();
    expect(appConfig.expo?.web?.backgroundColor).toBeDefined();
    expect(appConfig.expo?.web?.shortName).toBe('CloudNote');
    expect(appConfig.expo?.web?.favicon).toBe('./assets/favicon.png');
    expect(existsSync(resolveRepoPath('assets/favicon.png'))).toBe(true);
  });

  test('documents web baseline verification progress in readme', () => {
    const readme = readFileSync(resolveRepoPath('README.md'), 'utf8');

    expect(readme).toContain(
      'Web / PWA baseline 已推进到图片选择、录音 fallback 与最小 PWA 配置。',
    );
  });
});
