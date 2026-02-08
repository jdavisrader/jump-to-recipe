import { render, screen } from '@testing-library/react';
import { DragHandle } from '../drag-handle';

describe('DragHandle', () => {
  it('renders with GripVertical icon', () => {
    render(<DragHandle ariaLabel="Drag to reorder ingredient" />);
    
    // Check that the component renders
    const dragHandle = screen.getByRole('button', { name: /drag to reorder ingredient/i });
    expect(dragHandle).toBeInTheDocument();
  });

  it('has grab cursor when not disabled', () => {
    render(<DragHandle ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveClass('cursor-grab');
  });

  it('has grabbing cursor when dragging', () => {
    render(<DragHandle isDragging={true} ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveClass('cursor-grabbing');
  });

  it('has not-allowed cursor when disabled', () => {
    render(<DragHandle disabled={true} ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveClass('cursor-not-allowed');
    expect(dragHandle).toHaveAttribute('aria-disabled', 'true');
  });

  it('is keyboard accessible', () => {
    render(<DragHandle ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveAttribute('tabIndex', '0');
  });

  it('is not keyboard accessible when disabled', () => {
    render(<DragHandle disabled={true} ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveAttribute('tabIndex', '-1');
  });

  it('applies custom className', () => {
    render(<DragHandle className="custom-class" ariaLabel="Drag to reorder" />);
    
    const dragHandle = screen.getByRole('button');
    expect(dragHandle).toHaveClass('custom-class');
  });

  it('uses default aria-label when not provided', () => {
    render(<DragHandle />);
    
    const dragHandle = screen.getByRole('button', { name: /drag to reorder/i });
    expect(dragHandle).toBeInTheDocument();
  });
});
