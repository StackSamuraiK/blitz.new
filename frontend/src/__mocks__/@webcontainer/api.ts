// Mock for @webcontainer/api — WebContainer requires cross-origin
// isolation headers (COEP/COOP) which jsdom cannot provide. This mock
// returns a minimal fake instance that tests can assert against.
import { vi } from 'vitest';

const mockFS = {
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(''),
};

const mockWebContainerInstance = {
  fs: mockFS,
  mount: vi.fn().mockResolvedValue(undefined),
  spawn: vi.fn().mockResolvedValue({
    output: {
      pipeTo: vi.fn().mockResolvedValue(undefined),
    },
    exit: Promise.resolve(0),
    kill: vi.fn(),
  }),
  on: vi.fn((_event, cb) => {
    setTimeout(() => cb(5173, 'http://localhost:5173'), 0);
    return vi.fn();
  }),
  teardown: vi.fn(),
};

export const WebContainer = {
  boot: vi.fn().mockResolvedValue(mockWebContainerInstance),
};

export type { WebContainerProcess, FileSystemTree } from '@webcontainer/api';
