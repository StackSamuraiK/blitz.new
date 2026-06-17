import { WebContainer, type WebContainerProcess, type FileSystemTree } from '@webcontainer/api';
import React, { useEffect, useState, useRef } from 'react';
import { FileItem } from '../types';

interface PreviewFrameProps {
  files: FileItem[];
  webContainer: WebContainer;
  onUrlReady?: (url: string) => void;
}

// npm install in a WebContainer can take several minutes on a cold cache —
// Vite + React + a typical transitive dep tree commonly lands at 2-4 minutes
// the first time. 5 minutes is a generous ceiling that still bounds pathological
// hangs (bad registry mirror, infinite dep loop). Override with
// VITE_INSTALL_TIMEOUT_MS in .env if a particular project needs more.
const INSTALL_TIMEOUT_MS =
  Number(import.meta.env.VITE_INSTALL_TIMEOUT_MS) || 300_000;

function streamProcessOutput(
  process: WebContainerProcess,
  label: string,
  onLine?: (line: string) => void
) {
  process.output
    .pipeTo(
      new WritableStream({
        write(data) {
          // npm uses \r (carriage return) for in-place progress updates and emits
          // ANSI color codes by default. Normalize both so each real line lands
          // as its own log entry instead of one character per CR frame.
          const cleaned = data
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // eslint-disable-next-line no-control-regex
            .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
          for (const line of cleaned.split('\n')) {
            if (line.length > 0) {
              console.log(`${label}:`, line);
              if (onLine) onLine(line);
            }
          }
        },
      })
    )
    .catch((err) => {
      console.error(`${label} stream error:`, err);
    });
}

// Patterns from common dev servers (vite, webpack, CRA) that indicate a real
// build/runtime problem the user should see in the UI, not just the console.
const DEV_ERROR_PATTERNS = [
  /Failed to compile/i,
  /Module not found/i,
  /Can'?t resolve/i,
  /^ERROR in /,
  /Pre-transform error/i,
  /SyntaxError/i,
  /TypeError:/,
  /ReferenceError:/,
  /webpack compiled with \d+ error/i,
  /\[plugin:vite:.*\]/,
];

// Lines that indicate the dev server recovered — clear any sticky error state.
const DEV_RECOVERY_PATTERNS = [
  /compiled successfully/i,
  /ready in /i,
];

function isErrorLine(line: string): boolean {
  return DEV_ERROR_PATTERNS.some((re) => re.test(line));
}

function isRecoveryLine(line: string): boolean {
  return DEV_RECOVERY_PATTERNS.some((re) => re.test(line));
}

// Headless env for spawned processes: tells npm/pnpm/yarn we are not a TTY, so
// the in-place spinner (the \ | / - frames) is suppressed and the stream only
// emits real lines. NO_COLOR strips ANSI styling as a defense-in-depth.
const HEADLESS_ENV: Record<string, string> = {
  CI: '1',
  NO_COLOR: '1',
  FORCE_COLOR: '0',
};

function isValidFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (path.startsWith('/')) return false;
  const segments = path.split('/').filter((s) => s !== '' && s !== '.');
  if (segments.length === 0) return false;
  for (const segment of segments) {
    if (segment === '..') return false;
  }
  return true;
}

async function writeFilesRecursive(
  webContainer: WebContainer,
  items: FileItem[]
): Promise<void> {
  for (const item of items) {
    if (item.type === 'file') {
      if (!isValidFilePath(item.path)) {
        console.error('PreviewFrame: skipping invalid file path:', item.path);
        continue;
      }
      const content = item.content || '';
      const slashIdx = item.path.lastIndexOf('/');
      if (slashIdx > 0) {
        const dir = item.path.substring(0, slashIdx);
        try {
          await webContainer.fs.mkdir(dir, { recursive: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!/exists/i.test(msg)) {
            throw err;
          }
        }
      }
      await webContainer.fs.writeFile(item.path, content);
    } else if (item.type === 'folder' && item.children) {
      await writeFilesRecursive(webContainer, item.children);
    }
  }
}

function findFileContent(items: FileItem[], fileName: string): string | null {
  for (const item of items) {
    if (item.type === 'file' && item.name === fileName) {
      return item.content ?? null;
    }
    if (item.type === 'folder' && item.children) {
      const found = findFileContent(item.children, fileName);
      if (found !== null) return found;
    }
  }
  return null;
}

// Pick the best dev script to run for the generated project. We try the
// conventional names in priority order, then fall back to whatever scripts
// exist that look like they could start a dev server. Returns null with
// `available` populated when nothing suitable is found.
const DEV_SCRIPT_PRIORITY = ['dev', 'start', 'serve', 'preview', 'develop'] as const;

function pickDevScript(packageJsonContent: string): {
  script: string | null;
  available: string[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(packageJsonContent);
  } catch {
    return { script: null, available: [] };
  }
  const scripts = (parsed as { scripts?: Record<string, string> })?.scripts ?? {};
  const available = Object.keys(scripts);
  for (const candidate of DEV_SCRIPT_PRIORITY) {
    if (typeof scripts[candidate] === 'string' && scripts[candidate].length > 0) {
      return { script: candidate, available };
    }
  }
  // Last resort: any script whose name contains "dev" or "start"
  const fallback = available.find(
    (name) => /dev|start|serve/i.test(name) && typeof scripts[name] === 'string'
  );
  return { script: fallback ?? null, available };
}

export function PreviewFrame({ files, webContainer, onUrlReady }: PreviewFrameProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devErrors, setDevErrors] = useState<string[]>([]);
  const [devErrorsDismissed, setDevErrorsDismissed] = useState(false);

  const serverStarted = useRef(false);
  const serverReadyUnsubRef = useRef<(() => void) | null>(null);
  const devServerProcessRef = useRef<WebContainerProcess | null>(null);
  const installProcessRef = useRef<WebContainerProcess | null>(null);
  const installTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect to handle server startup — keyed on webContainer only so file
  // edits do not kill the dev server. File updates flow through the second effect.
  useEffect(() => {
    let cancelled = false;

    async function startDevServer() {
      if (!webContainer || serverStarted.current) return;

      const hasPackageJson = (function checkFiles(items: FileItem[]): boolean {
        for (const item of items) {
          if (item.name === 'package.json' && item.type === 'file') return true;
          if (item.type === 'folder' && item.children && checkFiles(item.children)) return true;
        }
        return false;
      })(files);

      if (!hasPackageJson) {
        console.log('Waiting for package.json before starting server...');
        return;
      }

      try {
        console.log('Starting WebContainer setup...');

        const hasRootFile = (items: FileItem[], name: string): boolean => {
          return items.some((item) => item.type === 'file' && item.name === name);
        };

        const createMountStructure = (items: FileItem[]): FileSystemTree => {
          const structure: FileSystemTree = {};
          for (const item of items) {
            if (item.type === 'file') {
              structure[item.name] = { file: { contents: item.content || '' } };
            } else {
              structure[item.name] = { directory: createMountStructure(item.children || []) };
            }
          }
          // Self-heal: AI generators commonly forget index.html for Vite projects.
          // Vite serves whatever is at the project root, so without index.html
          // the dev server has nothing to return and the iframe shows blank.
          if (!hasRootFile(items, 'index.html')) {
            const pkgRaw = findFileContent(items, 'package.json');
            let isVite = false;
            if (pkgRaw) {
              try {
                const scripts = (JSON.parse(pkgRaw) as { scripts?: Record<string, string> }).scripts ?? {};
                isVite = Object.values(scripts).some(
                  (cmd) => typeof cmd === 'string' && /\bvite\b/.test(cmd)
                );
              } catch (err) {
                // Malformed package.json from the AI — treat as non-Vite and let
                // the downstream error surface the real problem rather than
                // masking it with our self-heal.
                console.warn('PreviewFrame: package.json is not valid JSON, skipping Vite self-heal.', err);
              }
            }
            if (isVite) {
              const srcItems = items.find((i) => i.type === 'folder' && i.name === 'src')?.children ?? [];
              // Common Vite/React entry names in priority order, then a
              // scan of any .tsx/.jsx file in src/, then a root-level scan.
              const preferred = [
                'main.tsx',
                'main.jsx',
                'main.ts',
                'main.js',
                'index.tsx',
                'index.jsx',
                'index.ts',
                'index.js',
                'App.tsx',
                'App.jsx',
              ];
              const srcEntry = preferred.find((name) => hasRootFile(srcItems, name))
                ?? srcItems.find((i) => i.type === 'file' && /\.(t|j)sx?$/.test(i.name))?.name;
              const rootEntry = preferred.find((name) => hasRootFile(items, name))
                ?? items.find((i) => i.type === 'file' && /\.(t|j)sx?$/.test(i.name) && i.name !== 'index.html')?.name;
              const entryFile = srcEntry ?? rootEntry ?? 'main.tsx';
              const entryPath = srcEntry ? `/src/${entryFile}` : rootEntry ? `/${entryFile}` : `/src/${entryFile}`;
              console.warn(
                `PreviewFrame: AI did not generate index.html for Vite project. Adding a default that loads ${entryPath}.`
              );
              structure['index.html'] = {
                file: {
                  contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${entryPath}"></script>
  </body>
</html>
`,
                },
              };
            }
          }
          return structure;
        };

        const mountStructure = createMountStructure(files);
        await webContainer.mount(mountStructure);
        if (cancelled) return;
        serverStarted.current = true;

        console.log('Running npm install...');
        const installProcess = await webContainer.spawn(
          'npm',
          ['install', '--no-progress', '--no-audit', '--no-fund', '--prefer-offline'],
          { env: HEADLESS_ENV }
        );
        installProcessRef.current = installProcess;
        streamProcessOutput(installProcess, 'Install output');

        let installExitCode: number | null;
        try {
          installExitCode = await Promise.race([
            installProcess.exit,
            new Promise<never>((_, reject) => {
              installTimeoutRef.current = setTimeout(
                () =>
                  reject(
                    new Error(
                      `Install timeout exceeded after ${Math.round(INSTALL_TIMEOUT_MS / 1000)}s. ` +
                        'The generated project may have an unusually large dependency tree, ' +
                        'unreachable/invalid package references, or a slow network to the ' +
                        'WebContainer registry. Check the install output above for the last ' +
                        'package npm was processing before it stalled.'
                    )
                  ),
                INSTALL_TIMEOUT_MS
              );
            }),
          ]);
        } catch (err) {
          try {
            installProcess.kill();
          } catch (killErr) {
            console.error('Failed to kill install process:', killErr);
          }
          throw err;
        } finally {
          if (installTimeoutRef.current) {
            clearTimeout(installTimeoutRef.current);
            installTimeoutRef.current = null;
          }
        }

        if (installExitCode === null || installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }

        if (cancelled) return;

        // Attach server-ready listener BEFORE spawning the dev server
        // so we do not miss the event if vite is fast.
        const unsubscribeServerReady = webContainer.on('server-ready', (port, readyUrl) => {
          console.log(`Server ready on port ${port}: ${readyUrl}`);
          setUrl(readyUrl);
          setIsLoading(false);
          onUrlReady?.(readyUrl);
        });
        serverReadyUnsubRef.current = unsubscribeServerReady;

        const packageJsonContent = findFileContent(files, 'package.json') ?? '{}';
        const { script: devScript, available: availableScripts } = pickDevScript(packageJsonContent);
        if (!devScript) {
          throw new Error(
            availableScripts.length === 0
              ? 'package.json has no "scripts" section. The AI-generated project is missing runnable commands.'
              : `package.json has no runnable dev/start/serve script. Available scripts: ${availableScripts.join(', ')}.`
          );
        }
        console.log(`Running npm run ${devScript}...`);
        const devServerProcess = await webContainer.spawn(
          'npm',
          ['run', devScript],
          { env: HEADLESS_ENV }
        );
        devServerProcessRef.current = devServerProcess;
        streamProcessOutput(devServerProcess, 'Dev server output', (line) => {
          if (isRecoveryLine(line)) {
            // The dev server is healthy again — clear any sticky error overlay.
            if (devErrors.length > 0) {
              setDevErrors([]);
              setDevErrorsDismissed(false);
            }
            return;
          }
          if (isErrorLine(line)) {
            setDevErrors((prev) => {
              // Dedupe consecutive identical lines (e.g. the same module-not-found
              // printed once per dependency edge).
              const last = prev[prev.length - 1];
              if (last === line) return prev;
              return [...prev, line].slice(-20);
            });
            setDevErrorsDismissed(false);
          }
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Preview setup failed:', error);
        const msg = error instanceof Error ? error.message : String(error);
        let userMessage = 'Failed to start preview. Check the browser console for details.';
        const lower = msg.toLowerCase();
        if (lower.includes('install')) {
          userMessage =
            'Failed to install dependencies. The generated project may have an invalid package.json or its dependencies failed to resolve.';
        } else if (lower.includes('mount')) {
          userMessage =
            'Failed to mount files. The AI may have generated an invalid project structure.';
        } else if (lower.includes('script')) {
          // Re-throw: the script-picker already produced a user-friendly message
          userMessage = msg;
        }
        console.error('User-facing error:', userMessage);
        setIsLoading(false);
        serverStarted.current = false;
      }
    }

    startDevServer();

    return () => {
      cancelled = true;
      serverReadyUnsubRef.current?.();
      serverReadyUnsubRef.current = null;
      devServerProcessRef.current?.kill();
      devServerProcessRef.current = null;
      installProcessRef.current?.kill();
      installProcessRef.current = null;
      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
        installTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webContainer]);

  // Effect to handle file updates — use fs.writeFile for individual files.
  // Gated on serverStarted so we do not race the initial mount.
  useEffect(() => {
    if (!webContainer || !serverStarted.current) return;

    writeFilesRecursive(webContainer, files).catch((err) => {
      console.error('File update failed:', err);
    });
  }, [files, webContainer]);

  return (
    <div className="relative h-full">
      <div className="h-full flex items-center justify-center text-gray-400">
        {isLoading && (
          <div className="text-center">
            <p className="mb-2">Loading preview...</p>
          </div>
        )}
        {url && (
          <iframe
            className="w-full h-full border-0"
            src={url}
            title="Web Container Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
            referrerPolicy="no-referrer"
            onLoad={() => console.log('Iframe loaded')}
            onError={(e) => console.error('Iframe error:', e)}
          />
        )}
      </div>
      {devErrors.length > 0 && !devErrorsDismissed && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-red-950/95 border border-red-700 text-red-100 rounded shadow-lg p-3 max-h-64 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">
              Build errors in generated code ({devErrors.length})
            </span>
            <button
              type="button"
              onClick={() => setDevErrorsDismissed(true)}
              className="text-red-200 hover:text-white text-sm px-2"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-red-200 mb-2">
            The AI-generated code has missing imports or syntax errors. The preview
            iframe may appear blank until these are resolved. Regenerate with a
            simpler prompt, or check the console for full details.
          </p>
          <ul className="text-xs font-mono space-y-1">
            {devErrors.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap break-words">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
