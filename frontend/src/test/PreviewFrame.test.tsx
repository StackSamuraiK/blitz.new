import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreviewFrame } from '../components/PreviewFrame';
import { FileItem } from '../types';

function createMockWebContainer() {
  const callbacks: Record<string, (...args: any[]) => void> = {};
  return {
    mount: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      callbacks[event] = cb;
      // Fire server-ready on next tick
      if (event === 'server-ready') {
        setTimeout(() => cb(5173, 'http://localhost:5173'), 0);
      }
      return vi.fn();
    }),
    spawn: vi.fn().mockResolvedValue({
      output: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      exit: Promise.resolve(0),
      kill: vi.fn(),
    }),
    fs: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(''),
    },
    teardown: vi.fn(),
  };
}

const filesWithPackageJson: FileItem[] = [
  { name: 'package.json', type: 'file', path: 'package.json', content: JSON.stringify({ scripts: { dev: 'vite' } }) },
  { name: 'index.html', type: 'file', path: 'index.html', content: '<html></html>' },
];

describe('PreviewFrame', () => {
  it('should show loading state when starting', () => {
    render(<PreviewFrame files={[]} webContainer={{} as any} />);
    expect(screen.getByText(/loading preview/i)).toBeInTheDocument();
  });

  it('should render iframe when server-ready fires', async () => {
    const mockWC = createMockWebContainer();
    render(<PreviewFrame files={filesWithPackageJson} webContainer={mockWC as any} />);
    await screen.findByTitle('Web Container Preview');
  });

  it('should not crash with empty files array', () => {
    const { container } = render(<PreviewFrame files={[]} webContainer={{} as any} />);
    expect(container).toBeInTheDocument();
  });

  it('should not throw on unmount', () => {
    const { unmount } = render(<PreviewFrame files={[]} webContainer={{} as any} />);
    expect(() => unmount()).not.toThrow();
  });
});
