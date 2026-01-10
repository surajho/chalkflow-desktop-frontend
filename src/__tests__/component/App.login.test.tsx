import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../renderer/App';

// Create mock API
const mockBackend = {
  getAuthStatus: vi.fn(),
  login: vi.fn(),
  startScrape: vi.fn(),
  getScrapeStatus: vi.fn(),
  getWorkouts: vi.fn(),
  generateExports: vi.fn(),
};

describe('App - Login Flow', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Set up window.electronAPI mock
    Object.defineProperty(window, 'electronAPI', {
      writable: true,
      value: {
        backend: mockBackend,
      },
    });

    // Default mock responses
    mockBackend.getAuthStatus.mockResolvedValue({
      success: true,
      data: { is_logged_in: false },
    });
  });

  describe('Login Form Rendering', () => {
    it('should display login form when not authenticated', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Login to BTWB/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('should have proper input types and attributes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should show descriptive text', async () => {
      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByText(/Enter your Beyond the Whiteboard credentials/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Login Form Submission', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockResolvedValue({
        success: true,
        data: { success: true, member_id: '12345' },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockBackend.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
      });

      // Should show scraping section after login
      expect(screen.getByText(/Extract Workouts/i)).toBeInTheDocument();
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockResolvedValue({
        success: true,
        data: { success: false, message: 'Invalid credentials' },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });

      // Should still show login form
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: { success: true } }), 100)
          )
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'password');

      const loginButton = screen.getByRole('button', { name: /Login/i });
      await user.click(loginButton);

      // Should show loading text
      expect(screen.getByRole('button', { name: /Logging in.../i })).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });

    it('should disable inputs during login', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: { success: true } }), 100)
          )
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    it('should handle connection errors gracefully', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockRejectedValue(new Error('Network error'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'password');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Connection error/i)).toBeInTheDocument();
      });
    });

    it('should clear password field after successful login', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockResolvedValue({
        success: true,
        data: { success: true, member_id: '12345' },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Password/i);
      await user.type(passwordInput, 'password123');
      await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Extract Workouts/i)).toBeInTheDocument();
      });

      // Password should be cleared (field no longer visible after login)
      expect(screen.queryByLabelText(/Password/i)).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should show logout button when authenticated', async () => {
      mockBackend.getAuthStatus.mockResolvedValue({
        success: true,
        data: { is_logged_in: true, member_id: '12345' },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      });
    });

    it('should return to login screen when logout clicked', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockResolvedValue({
        success: true,
        data: { success: true, member_id: '12345' },
      });

      render(<App />);

      // Login first
      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'password');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      });

      // Logout
      await user.click(screen.getByRole('button', { name: /Logout/i }));

      // Should show login form again
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('should clear all state when logging out', async () => {
      const user = userEvent.setup();
      mockBackend.login.mockResolvedValue({
        success: true,
        data: { success: true, member_id: '12345' },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'password');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Logout/i }));

      // Email should be cleared
      await waitFor(() => {
        const newEmailInput = screen.getByLabelText(/Email/i);
        expect(newEmailInput).toHaveValue('');
      });
    });
  });
});
