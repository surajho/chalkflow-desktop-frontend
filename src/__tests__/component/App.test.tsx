import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../renderer/App';

describe('Component Test Example: App Login Form', () => {
  it('should render login form when not authenticated', () => {
    render(<App />);

    expect(screen.getByText('Login to BTWB')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should update email and password fields', () => {
    render(<App />);

    const emailInput = screen.getByLabelText('Email:') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password:') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should call login on form submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: true,
      data: { success: true, member_id: '12345' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.electronAPI.backend.login as any) = mockLogin;

    render(<App />);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    const loginButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
