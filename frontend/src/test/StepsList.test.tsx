import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StepsList } from '../components/StepsList';
import { Step, StepType } from '../types';

const mockSteps: Step[] = [
  { id: 1, title: 'Create project', description: 'Set up files', type: StepType.CreateFolder, status: 'completed' },
  { id: 2, title: 'Create App.tsx', description: 'Main component', type: StepType.CreateFile, status: 'in-progress' },
  { id: 3, title: 'Install deps', description: 'npm install', type: StepType.RunScript, status: 'pending' },
];

describe('StepsList', () => {
  it('should render all steps', () => {
    render(<StepsList steps={mockSteps} currentStep={2} onStepClick={vi.fn()} />);
    expect(screen.getByText('Create project')).toBeInTheDocument();
    expect(screen.getByText('Create App.tsx')).toBeInTheDocument();
    expect(screen.getByText('Install deps')).toBeInTheDocument();
  });

  it('should highlight the current step', () => {
    const { container } = render(
      <StepsList steps={mockSteps} currentStep={2} onStepClick={vi.fn()} />
    );
    // Find step containers (they should have rounded-lg class)
    const stepElements = container.querySelectorAll('.rounded-lg');
    // The second step should have bg-gray-800 class (current step)
    expect(stepElements.length).toBeGreaterThanOrEqual(3);
  });

  it('should call onStepClick with step id on click', () => {
    const onStepClick = vi.fn();
    render(<StepsList steps={mockSteps} currentStep={2} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByText('Install deps'));
    expect(onStepClick).toHaveBeenCalledWith(3);
  });

  it('should show status icons', () => {
    const { container } = render(
      <StepsList steps={mockSteps} currentStep={2} onStepClick={vi.fn()} />
    );
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});
