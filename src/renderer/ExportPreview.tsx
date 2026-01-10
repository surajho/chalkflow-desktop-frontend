import React, { useState, useMemo } from 'react';
import { WorkoutSession, SortConfig, SortField } from '../types/workout';
import './ExportPreview.css';

interface ExportPreviewProps {
  workouts: WorkoutSession[];
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ workouts }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'date',
    direction: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Get unique workout types for filter dropdown
  const workoutTypes = useMemo(() => {
    const types = new Set<string>();
    workouts.forEach((workout) => {
      if (workout.workout_type) {
        types.add(workout.workout_type);
      }
    });
    return Array.from(types).sort();
  }, [workouts]);

  // Filter workouts
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.results?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || workout.workout_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [workouts, searchTerm, typeFilter]);

  // Sort workouts
  const sortedWorkouts = useMemo(() => {
    const sorted = [...filteredWorkouts];
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.field) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'workout_type':
          aValue = (a.workout_type || '').toLowerCase();
          bValue = (b.workout_type || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredWorkouts, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev: SortConfig) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  const workoutCount = filteredWorkouts.length;
  const workoutText = workoutCount === 1 ? 'workout' : 'workouts';

  if (workouts.length === 0) {
    return (
      <div className="export-preview">
        <div className="empty-state">
          <p>No workouts available. Start by scraping your BTWB data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="export-preview">
      <div className="preview-header">
        <h2>Workout Preview</h2>
        <span className="workout-count">
          {workoutCount} {workoutText}
        </span>
      </div>

      <div className="preview-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {(searchTerm || typeFilter !== 'all') && (
            <button onClick={clearSearch} className="clear-button" aria-label="Clear filters">
              Clear
            </button>
          )}
        </div>

        <div className="filter-box">
          <label htmlFor="type-filter">Filter by type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="type-filter"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            {workoutTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="workout-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortConfig.field === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('title')} className="sortable">
                Title {sortConfig.field === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('workout_type')} className="sortable">
                Type{' '}
                {sortConfig.field === 'workout_type' &&
                  (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {sortedWorkouts.map((workout, index) => (
              <React.Fragment key={index}>
                <tr
                  onClick={() => handleRowClick(index)}
                  className={`workout-row ${expandedRows.has(index) ? 'expanded' : ''}`}
                >
                  <td className="date-cell">{formatDate(workout.date)}</td>
                  <td className="title-cell">{workout.title}</td>
                  <td className="type-cell">{workout.workout_type || '-'}</td>
                  <td className="results-cell">{workout.results || '-'}</td>
                </tr>
                {expandedRows.has(index) && (
                  <tr className="detail-row">
                    <td colSpan={4}>
                      <div className="workout-details">
                        {workout.description && (
                          <div className="detail-section">
                            <strong>Description:</strong>
                            <p>{workout.description}</p>
                          </div>
                        )}
                        {workout.notes && (
                          <div className="detail-section">
                            <strong>Notes:</strong>
                            <p>{workout.notes}</p>
                          </div>
                        )}
                        {workout.session_url && (
                          <div className="detail-section">
                            <a
                              href={workout.session_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="workout-link"
                            >
                              View on BTWB →
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExportPreview;
