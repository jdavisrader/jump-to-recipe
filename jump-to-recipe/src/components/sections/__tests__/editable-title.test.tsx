import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableTitle } from '../editable-title';

describe('EditableTitle', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the title value in display mode', () => {
    render(
      <EditableTitle
        value="Test Section"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows placeholder when value is empty', () => {
    render(
      <EditableTitle
        value=""
        onChange={mockOnChange}
        placeholder="Custom Placeholder"
      />
    );

    expect(screen.getByText('Custom Placeholder')).toBeInTheDocument();
  });

  it('uses default placeholder when none provided', () => {
    render(
      <EditableTitle
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Untitled Section')).toBeInTheDocument();
  });

  it('enters edit mode when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableTitle
        value="Test Section"
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Section')).toBeInTheDocument();
  });

  it('focuses and selects text when entering edit mode', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableTitle
        value="Test Section"
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Test Section'.length);
  });

  it('saves changes when Enter is pressed', async () => {
    const user = userEvent.setup();
    let currentValue = 'Original';
    
    const { rerender } = render(
      <EditableTitle
        value={currentValue}
        onChange={(newValue) => {
          mockOnChange(newValue);
          currentValue = newValue;
        }}
      />
    );

    await user.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox');
    
    await user.clear(input);
    await user.type(input, 'New Title');
    await user.keyboard('{Enter}');

    // Rerender with updated value to simulate parent component behavior
    rerender(
      <EditableTitle
        value={currentValue}
        onChange={(newValue) => {
          mockOnChange(newValue);
          currentValue = newValue;
        }}
      />
    );

    expect(mockOnChange).toHaveBeenCalledWith('New Title');
    expect(screen.getByText('New Title')).toBeInTheDocument();
  });

  it('saves changes when input loses focus', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <EditableTitle
          value="Original"
          onChange={mockOnChange}
        />
        <button>Other Button</button>
      </div>
    );

    await user.click(screen.getByText('Original'));
    const input = screen.getByRole('textbox');
    
    await user.clear(input);
    await user.type(input, 'Blurred Title');
    await user.click(screen.getByText('Other Button'));

    expect(mockOnChange).toHaveBeenCalledWith('Blurred Title');
  });

  it('cancels changes when Escape is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableTitle
        value="Original"
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox');
    
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.keyboard('{Escape}');

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('uses placeholder as fallback for empty input', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableTitle
        value="Original"
        onChange={mockOnChange}
        placeholder="Fallback Title"
      />
    );

    await user.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox');
    
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith('Fallback Title');
  });

  it('trims whitespace from input', async () => {
    const user = userEvent.setup();
    
    render(
      <EditableTitle
        value="Original"
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox');
    
    await user.clear(input);
    await user.type(input, '  Trimmed Title  ');
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith('Trimmed Title');
  });

  it('applies custom className', () => {
    render(
      <EditableTitle
        value="Test"
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('updates edit value when prop value changes', () => {
    const { rerender } = render(
      <EditableTitle
        value="Initial"
        onChange={mockOnChange}
      />
    );

    rerender(
      <EditableTitle
        value="Updated"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});