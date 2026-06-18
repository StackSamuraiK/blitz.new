import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeEditor } from '../components/CodeEditor';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => <div data-testid="monaco">{value}</div>,
}));

describe('CodeEditor', () => {
  it('should show placeholder when file is null', () => {
    render(<CodeEditor file={null} />);
    expect(screen.getByText(/select a file/i)).toBeInTheDocument();
  });

  it('should render Monaco editor with file content when file is provided', () => {
    const file = { name: 'App.tsx', type: 'file' as const, path: 'App.tsx', content: 'function App() {}' };
    render(<CodeEditor file={file} />);
    expect(screen.getByText('function App() {}')).toBeInTheDocument();
  });

  it('should handle file with empty content string', () => {
    const file = { name: 'empty.ts', type: 'file' as const, path: 'empty.ts', content: '' };
    render(<CodeEditor file={file} />);
    expect(screen.getByTestId('monaco')).toBeInTheDocument();
  });
});
