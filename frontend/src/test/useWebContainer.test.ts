import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWebContainer } from '../hooks/useWebContainer';

const mockBoot = vi.hoisted(() => vi.fn().mockResolvedValue({
  mount: vi.fn().mockResolvedValue(undefined),
  on: vi.fn().mockReturnValue(vi.fn()),
  spawn: vi.fn().mockResolvedValue({
    output: { pipeTo: vi.fn().mockResolvedValue(undefined) },
    exit: Promise.resolve(0),
    kill: vi.fn(),
  }),
  fs: { mkdir: vi.fn(), writeFile: vi.fn(), readFile: vi.fn() },
  teardown: vi.fn(),
}));

vi.mock('@webcontainer/api', () => ({
  WebContainer: {
    boot: mockBoot,
  },
}));

describe('useWebContainer', () => {
  it('should return a WebContainer instance after boot', async () => {
    const { result } = renderHook(() => useWebContainer());
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it('should boot WebContainer only once across multiple calls', async () => {
    const { result: result1 } = renderHook(() => useWebContainer());
    const { result: result2 } = renderHook(() => useWebContainer());

    await waitFor(() => {
      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
    });

    expect(mockBoot).toHaveBeenCalledTimes(1);
  });

  it('should return the same instance for all consumers', async () => {
    const { result: result1 } = renderHook(() => useWebContainer());
    const { result: result2 } = renderHook(() => useWebContainer());

    await waitFor(() => {
      expect(result1.current).toBe(result2.current);
    });
  });

  it('should call WebContainer.boot with coep option', async () => {
    renderHook(() => useWebContainer());

    await waitFor(() => {
      expect(mockBoot).toHaveBeenCalledWith({
        coep: 'require-corp',
      });
    });
  });
});
