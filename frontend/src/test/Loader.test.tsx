import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Loader } from '../components/Loader';

describe('Loader', () => {
  it('should render without crashing', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render an SVG spinner element with animate-spin class', () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class')).toContain('animate-spin');
  });
});
