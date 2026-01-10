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

beforeEach(() => {
  vi.clearAllMocks();

  // Set up window.electronAPI mock
  Object.defineProperty(window, 'electronAPI', {
    writable: true,
    value: {
      backend: mockBackend,
    },
  });

  // Default to authenticated state
  mockBackend.getAuthStatus.mockResolvedValue({
    success: true,
    data: { is_logged_in: true, member_id: '12345' },
  });
});

describe('App - Scraping Flow', () => {
  describe('Scraping Form', () => {
    it('should display member ID input when authenticated', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Member ID/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
    });

    it('should pre-fill member ID from auth status', async () => {
      render(<App />);

      await waitFor(() => {
        const memberIdInput = screen.getByLabelText(/Member ID/i) as HTMLInputElement;
        expect(memberIdInput.value).toBe('12345');
      });
    });

    it('should allow editing member ID', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Member ID/i)).toBeInTheDocument();
      });

      const memberIdInput = screen.getByLabelText(/Member ID/i);
      await user.clear(memberIdInput);
      await user.type(memberIdInput, '54321');

      expect(memberIdInput).toHaveValue('54321');
    });

    it('should disable start button when member ID is empty', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Member ID/i)).toBeInTheDocument();
      });

      const memberIdInput = screen.getByLabelText(/Member ID/i);
      await user.clear(memberIdInput);

      const startButton = screen.getByRole('button', { name: /Start Extraction/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe('Scraping Execution', () => {
    it('should start scraping when button clicked', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      mockBackend.getScrapeStatus.mockResolvedValue({
        success: true,
        data: {
          is_scraping: true,
          progress: 0,
          total: 100,
          status: 'scraping',
          error: null,
          member_id: '12345',
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        expect(mockBackend.startScrape).toHaveBeenCalledWith('12345');
      });

      await waitFor(() => {
        expect(screen.getByText(/Extraction Progress/i)).toBeInTheDocument();
      });
    });

    it('should disable button and inputs during scraping', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      mockBackend.getScrapeStatus.mockResolvedValue({
        success: true,
        data: {
          is_scraping: true,
          progress: 10,
          total: 100,
          status: 'scraping',
          error: null,
          member_id: '12345',
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Extracting.../i });
        expect(button).toBeDisabled();
      });

      const memberIdInput = screen.getByLabelText(/Member ID/i);
      expect(memberIdInput).toBeDisabled();
    });

    it('should show progress bar during scraping', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      mockBackend.getScrapeStatus.mockResolvedValue({
        success: true,
        data: {
          is_scraping: true,
          progress: 25,
          total: 100,
          status: 'scraping',
          error: null,
          member_id: '12345',
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        expect(screen.getByText(/25 \/ 100 workouts/i)).toBeInTheDocument();
        expect(screen.getByText(/\(25%\)/i)).toBeInTheDocument();
      });
    });

    it('should update progress in real-time', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      // Start with initial progress
      mockBackend.getScrapeStatus
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_scraping: true,
            progress: 10,
            total: 100,
            status: 'scraping',
            error: null,
            member_id: '12345',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_scraping: true,
            progress: 50,
            total: 100,
            status: 'scraping',
            error: null,
            member_id: '12345',
          },
        });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        expect(screen.getByText(/10 \/ 100 workouts/i)).toBeInTheDocument();
      });

      // Progress should update
      await waitFor(
        () => {
          expect(screen.getByText(/50 \/ 100 workouts/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should handle scraping errors', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: false,
        error: 'Failed to connect to BTWB',
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to BTWB/i)).toBeInTheDocument();
      });
    });

    it('should show error from scrape status', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      mockBackend.getScrapeStatus.mockResolvedValue({
        success: true,
        data: {
          is_scraping: false,
          progress: 25,
          total: 100,
          status: 'error',
          error: 'Session expired',
          member_id: '12345',
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(() => {
        expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Scraping Completion', () => {
    it('should fetch workouts when scraping completes', async () => {
      const user = userEvent.setup();
      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      mockBackend.getScrapeStatus
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_scraping: true,
            progress: 50,
            total: 100,
            status: 'scraping',
            error: null,
            member_id: '12345',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_scraping: false,
            progress: 100,
            total: 100,
            status: 'completed',
            error: null,
            member_id: '12345',
          },
        });

      mockBackend.getWorkouts.mockResolvedValue({
        success: true,
        data: {
          workouts: [
            {
              date: '2024-01-15T10:00:00',
              title: 'Fran',
              description: '21-15-9',
              results: 'Time: 5:23',
              notes: null,
              workout_type: 'For Time',
              session_url: 'https://btwb.com/workout/123',
            },
          ],
          total: 1,
        },
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      await waitFor(
        () => {
          expect(mockBackend.getWorkouts).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        expect(screen.getByText('Fran')).toBeInTheDocument();
      });
    });

    it('should show export preview after completion', async () => {
      const user = userEvent.setup();

      const mockWorkoutData = [
        {
          date: '2024-01-15',
          workout_type: 'For Time',
          workout_name: 'Test WOD',
          track_name: 'Track A',
          description: 'Test workout description',
          results: '10:00',
        },
      ];

      mockBackend.startScrape.mockResolvedValue({
        success: true,
        data: { success: true },
      });

      // Simulate polling: first scraping, then completed
      mockBackend.getScrapeStatus
        .mockResolvedValueOnce({
          success: true,
          data: {
            is_scraping: true,
            progress: 0,
            total: 1,
            status: 'scraping',
            error: null,
            member_id: '12345',
          },
        })
        .mockResolvedValue({
          success: true,
          data: {
            is_scraping: false,
            progress: 1,
            total: 1,
            status: 'completed',
            error: null,
            member_id: '12345',
          },
        });

      mockBackend.getWorkouts.mockResolvedValue({
        success: true,
        data: mockWorkoutData,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Extraction/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Start Extraction/i }));

      // Wait for workouts to be fetched (polling detects completion)
      await waitFor(
        () => {
          expect(mockBackend.getWorkouts).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });
  });
});
