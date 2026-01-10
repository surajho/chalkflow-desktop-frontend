import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportPreview from '../../renderer/ExportPreview';
import { WorkoutSession } from '../../types/workout';

describe('ExportPreview', () => {
  const mockWorkouts: WorkoutSession[] = [
    {
      date: '2024-01-15T10:00:00',
      title: 'Fran',
      description: '21-15-9 Thrusters and Pull-ups',
      results: 'Time: 5:23',
      notes: 'Felt great today',
      workout_type: 'For Time',
      session_url: 'https://btwb.com/workout/123',
    },
    {
      date: '2024-01-14T10:00:00',
      title: 'Back Squat',
      description: '5-5-5-5-5',
      results: '225-245-265-275-285',
      notes: 'New PR!',
      workout_type: 'Strength',
      session_url: 'https://btwb.com/workout/124',
    },
    {
      date: '2024-01-13T10:00:00',
      title: 'Cindy',
      description: '20 min AMRAP',
      results: '15 rounds',
      notes: null,
      workout_type: 'AMRAP',
      session_url: 'https://btwb.com/workout/125',
    },
  ];

  describe('Rendering', () => {
    it('should render workout table with correct headers', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      const table = screen.getByRole('table');
      expect(within(table).getByText(/Date/)).toBeInTheDocument();
      expect(within(table).getByText(/Title/)).toBeInTheDocument();
      expect(within(table).getByText(/Type/)).toBeInTheDocument();
      expect(within(table).getByText('Results')).toBeInTheDocument();
    });

    it('should display all workouts in the table', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      expect(screen.getByText('Fran')).toBeInTheDocument();
      expect(screen.getByText('Back Squat')).toBeInTheDocument();
      expect(screen.getByText('Cindy')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      // Should display human-readable dates
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
    });

    it('should display workout types', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      const table = screen.getByRole('table');
      expect(within(table).getAllByText('For Time')[0]).toBeInTheDocument();
      expect(within(table).getByText('Strength')).toBeInTheDocument();
      expect(within(table).getAllByText('AMRAP')[0]).toBeInTheDocument();
    });

    it('should render empty state when no workouts', () => {
      render(<ExportPreview workouts={[]} />);

      expect(screen.getByText(/no workouts/i)).toBeInTheDocument();
    });

    it('should display workout count', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      expect(screen.getByText(/3 workouts/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by date descending by default', () => {
      render(<ExportPreview workouts={mockWorkouts} />);

      const rows = screen.getAllByRole('row');
      // Skip header row
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Fran')).toBeInTheDocument();
    });

    it('should sort by date ascending when date header clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const dateHeader = screen.getByText(/Date/);
      await user.click(dateHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Cindy')).toBeInTheDocument();
    });

    it('should sort by title alphabetically', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const titleHeader = screen.getByText(/Title/);
      await user.click(titleHeader);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Back Squat')).toBeInTheDocument();
    });

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const titleHeader = screen.getByText(/Title/);

      // First click - ascending
      await user.click(titleHeader);
      let rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Back Squat')).toBeInTheDocument();

      // Second click - descending
      await user.click(titleHeader);
      rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Fran')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter workouts by search term in title', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const searchInput = screen.getByPlaceholderText(/search workouts/i);
      await user.type(searchInput, 'Fran');

      expect(screen.getByText('Fran')).toBeInTheDocument();
      expect(screen.queryByText('Back Squat')).not.toBeInTheDocument();
      expect(screen.queryByText('Cindy')).not.toBeInTheDocument();
    });

    it('should filter workouts by workout type', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const typeFilter = screen.getByLabelText(/filter by type/i);
      await user.selectOptions(typeFilter, 'Strength');

      expect(screen.getByText('Back Squat')).toBeInTheDocument();
      expect(screen.queryByText('Fran')).not.toBeInTheDocument();
      expect(screen.queryByText('Cindy')).not.toBeInTheDocument();
    });

    it('should show filtered workout count', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const searchInput = screen.getByPlaceholderText(/search workouts/i);
      await user.type(searchInput, 'Squat');

      expect(screen.getByText(/1 workout/i)).toBeInTheDocument();
    });

    it('should clear search when clear button clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const searchInput = screen.getByPlaceholderText(/search workouts/i);
      await user.type(searchInput, 'Fran');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText(/3 workouts/i)).toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    it('should expand row to show workout details on click', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const franRow = screen.getByText('Fran').closest('tr');
      expect(franRow).toBeInTheDocument();

      if (franRow) {
        await user.click(franRow);
        expect(screen.getByText('21-15-9 Thrusters and Pull-ups')).toBeInTheDocument();
        expect(screen.getByText('Felt great today')).toBeInTheDocument();
      }
    });

    it('should collapse expanded row on second click', async () => {
      const user = userEvent.setup();
      render(<ExportPreview workouts={mockWorkouts} />);

      const franRow = screen.getByText('Fran').closest('tr');
      if (franRow) {
        await user.click(franRow);
        expect(screen.getByText('21-15-9 Thrusters and Pull-ups')).toBeInTheDocument();

        await user.click(franRow);
        expect(screen.queryByText('21-15-9 Thrusters and Pull-ups')).not.toBeInTheDocument();
      }
    });
  });
});
