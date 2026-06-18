import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Sample frontend test', () => {
  it('should verify test infrastructure works', () => {
    render(<div data-testid="sample">Hello Tests</div>);
    expect(screen.getByTestId('sample')).toHaveTextContent('Hello Tests');
  });
});
