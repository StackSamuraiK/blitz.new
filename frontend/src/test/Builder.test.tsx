import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Builder } from '../pages/Builder';

const mockNavigate = vi.fn();
const mockLocation = vi.fn(() => ({ state: { prompt: 'Build a landing page' } }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

vi.mock('axios');
vi.mock('../hooks/useWebContainer', () => ({
  useWebContainer: () => ({}),
}));
vi.mock('../steps', () => ({
  parseXml: () => [],
}));

describe('Builder', () => {
  it('should render the prompt from location state', () => {
    render(<Builder />);
    expect(screen.getByText('Build a landing page')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<Builder />);
    expect(screen.getByText(/building/i)).toBeInTheDocument();
  });

  it('should show error state when no prompt is provided', () => {
    mockLocation.mockReturnValueOnce({ state: { prompt: '' } });
    render(<Builder />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should show error state when location state is null', () => {
    mockLocation.mockReturnValueOnce({ state: null });
    render(<Builder />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should show Go Back Home and Retry buttons in error state', () => {
    mockLocation.mockReturnValueOnce({ state: { prompt: '' } });
    render(<Builder />);
    expect(screen.getByText(/go back home/i)).toBeInTheDocument();
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
  });
});
