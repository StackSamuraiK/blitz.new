import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileExplorer } from '../components/FileExplorer';
import { FileItem } from '../types';

const mockFiles: FileItem[] = [
  {
    name: 'src',
    type: 'folder',
    path: 'src',
    children: [
      { name: 'App.tsx', type: 'file', path: 'src/App.tsx', content: '// app' },
      { name: 'index.ts', type: 'file', path: 'src/index.ts', content: '// index' },
    ],
  },
  {
    name: 'package.json',
    type: 'file',
    path: 'package.json',
    content: '{}',
  },
];

describe('FileExplorer', () => {
  it('should render file and folder names', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={vi.fn()} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  it('should expand folder on click to show children', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={vi.fn()} />);
    // Children should not be visible initially
    expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
    // Click the folder
    fireEvent.click(screen.getByText('src'));
    // Children should now be visible
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('should call onFileSelect with file on click', () => {
    const onFileSelect = vi.fn();
    render(<FileExplorer files={mockFiles} onFileSelect={onFileSelect} />);
    fireEvent.click(screen.getByText('package.json'));
    expect(onFileSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'package.json', path: 'package.json' })
    );
  });

  it('should not call onFileSelect when clicking a folder', () => {
    const onFileSelect = vi.fn();
    render(<FileExplorer files={mockFiles} onFileSelect={onFileSelect} />);
    fireEvent.click(screen.getByText('src'));
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should render File Explorer heading even when files array is empty', () => {
    render(<FileExplorer files={[]} onFileSelect={vi.fn()} />);
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
  });
});
