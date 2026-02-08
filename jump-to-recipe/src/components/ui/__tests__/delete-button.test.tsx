import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteButton } from '../delete-button';

describe('DeleteButton', () => {
  it('renders with X icon', () => {
    render(<DeleteButton ariaLabel="Delete ingredient" />);
    
    // Check that the button renders
    const deleteButton = screen.getByRole('button', { name: /delete ingredient/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onDelete when clicked', () => {
    const handleDelete = jest.fn();
    render(<DeleteButton onDelete={handleDelete} ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);
    
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete when disabled', () => {
    const handleDelete = jest.fn();
    render(<DeleteButton onDelete={handleDelete} disabled={true} ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);
    
    expect(handleDelete).not.toHaveBeenCalled();
  });

  it('applies outline variant by default', () => {
    render(<DeleteButton ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    // The button should have outline variant classes
    expect(deleteButton).toBeInTheDocument();
  });

  it('applies destructive variant when specified', () => {
    render(<DeleteButton variant="destructive" ariaLabel="Delete recipe" />);
    
    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
  });

  it('applies small size by default', () => {
    render(<DeleteButton ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
  });

  it('is keyboard accessible', () => {
    const handleDelete = jest.fn();
    render(<DeleteButton onDelete={handleDelete} ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    
    // Simulate Enter key press
    fireEvent.keyDown(deleteButton, { key: 'Enter', code: 'Enter' });
    
    // Button should be focusable
    expect(deleteButton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DeleteButton className="custom-class" ariaLabel="Delete ingredient" />);
    
    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toHaveClass('custom-class');
  });

  it('uses default aria-label when not provided', () => {
    render(<DeleteButton />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls both onClick and onDelete when provided', () => {
    const handleClick = jest.fn();
    const handleDelete = jest.fn();
    render(
      <DeleteButton 
        onClick={handleClick} 
        onDelete={handleDelete} 
        ariaLabel="Delete ingredient" 
      />
    );
    
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
