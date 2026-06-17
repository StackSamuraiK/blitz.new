import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Home } from '../pages/Home';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('Home', () => {
  it('should render the Blitz.new heading', () => {
    render(<Home />);
    const headings = screen.getAllByText(/Blitz/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
    const newTexts = screen.getAllByText(/\.new/i);
    expect(newTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('should render a textarea for prompt input', () => {
    render(<Home />);
    const textarea = screen.getByPlaceholderText(/describe your dream website/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should disable submit button when prompt is empty', () => {
    render(<Home />);
    const button = screen.getByRole('button', { name: /generate website/i });
    expect(button).toBeDisabled();
  });

  it('should enable submit button when prompt has text', () => {
    render(<Home />);
    const textarea = screen.getByPlaceholderText(/describe your dream website/i);
    fireEvent.change(textarea, { target: { value: 'Build a landing page' } });
    const button = screen.getByRole('button', { name: /generate website/i });
    expect(button).not.toBeDisabled();
  });

  it('should navigate to /builder with prompt on submit', () => {
    render(<Home />);
    const textarea = screen.getByPlaceholderText(/describe your dream website/i);
    fireEvent.change(textarea, { target: { value: 'Build a landing page' } });
    const button = screen.getByRole('button', { name: /generate website/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/builder', {
      state: { prompt: 'Build a landing page' },
    });
  });

  it('should not navigate when prompt is only whitespace', () => {
    render(<Home />);
    const textarea = screen.getByPlaceholderText(/describe your dream website/i);
    fireEvent.change(textarea, { target: { value: '   ' } });
    const button = screen.getByRole('button', { name: /generate website/i });
    expect(button).toBeDisabled();
  });
});
