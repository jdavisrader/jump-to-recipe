import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookModeToggle } from '../cook-mode-toggle';

const mockToast = jest.fn();
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('CookModeToggle', () => {
  let request: jest.Mock;
  let release: jest.Mock;

  beforeEach(() => {
    mockToast.mockClear();
    release = jest.fn().mockResolvedValue(undefined);
    request = jest.fn().mockResolvedValue({ release });
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  });

  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });

  it('renders a labeled switch that starts off', () => {
    render(<CookModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cook Mode' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Keeps your screen on while you cook')).toBeInTheDocument();
  });

  it('keeps the screen awake when switched on and releases it when switched off', async () => {
    render(<CookModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cook Mode' });

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(request).toHaveBeenCalledWith('screen');

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
    expect(release).toHaveBeenCalled();
  });

  it('shows a toast and stays off when the device refuses', async () => {
    request.mockRejectedValue(new Error('NotAllowedError'));
    render(<CookModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cook Mode' });

    fireEvent.click(toggle);
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Couldn't keep your screen on" })
      )
    );
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('does not show a toast when switched on successfully', async () => {
    render(<CookModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cook Mode' });

    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('can be toggled from the keyboard', async () => {
    render(<CookModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Cook Mode' });

    fireEvent.keyDown(toggle, { key: ' ' });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });

  it('is hidden when the browser does not support wake lock', () => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
    render(<CookModeToggle />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
