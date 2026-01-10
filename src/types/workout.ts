/**
 * Type definitions for workout data structures
 * Matches the backend WorkoutSession model
 */

export interface WorkoutSession {
  date: string; // ISO 8601 datetime string
  title: string;
  description?: string | null;
  results?: string | null;
  notes?: string | null;
  workout_type?: string | null;
  session_url?: string | null;
}

export interface MemberInfo {
  member_id: string;
  name: string;
  gym?: string | null;
  profile_url?: string | null;
}

export interface WorkoutExport {
  user: MemberInfo;
  workouts: WorkoutSession[];
  pr_table?: Record<string, unknown>;
  movements?: Record<string, unknown>;
}

export type SortField = 'date' | 'title' | 'workout_type';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
