import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ExportPreview from './ExportPreview';
import { WorkoutSession } from '../types/workout';

interface ScrapeStatus {
  is_scraping: boolean;
  progress: number;
  total: number;
  status: string;
  error: string | null;
  member_id: string | null;
}

interface AuthStatusData {
  is_logged_in: boolean;
  member_id?: string;
}

interface LoginResponseData {
  success: boolean;
  member_id?: string;
  message?: string;
}

interface ScrapeResponseData {
  success: boolean;
  message?: string;
}

interface ExportResponseData {
  success: boolean;
  workout_count?: number;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memberId, setMemberId] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const result = await window.electronAPI.backend.getAuthStatus();
      if (result.success && result.data) {
        const authData = result.data as AuthStatusData;
        setIsAuthenticated(authData.is_logged_in);
        if (authData.member_id) {
          setMemberId(authData.member_id);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const fetchWorkouts = useCallback(async () => {
    try {
      const result = await window.electronAPI.backend.getWorkouts();
      if (result.success && result.data) {
        const data = result.data as { workouts: WorkoutSession[]; total: number };
        setWorkouts(data.workouts || []);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  }, []);

  // Poll scrape status when scraping
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (scrapeStatus?.is_scraping) {
      interval = setInterval(async () => {
        const result = await window.electronAPI.backend.getScrapeStatus();
        if (result.success && result.data) {
          const status = result.data as ScrapeStatus;
          setScrapeStatus(status);

          // If scraping just completed, fetch workouts
          if (status.status === 'completed' && scrapeStatus.status !== 'completed') {
            await fetchWorkouts();
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scrapeStatus?.is_scraping, scrapeStatus?.status, fetchWorkouts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Logging in to BTWB...');
    setMessageType('info');
    setIsLoggingIn(true);

    try {
      const result = await window.electronAPI.backend.login(email, password);
      if (result.success && result.data) {
        const loginData = result.data as LoginResponseData;
        if (loginData.success) {
          setIsAuthenticated(true);
          setMemberId(loginData.member_id || '');
          setMessage('Login successful! You can now extract your workouts.');
          setMessageType('success');
          setPassword('');
        } else {
          setMessage(loginData.message || 'Login failed. Please check your credentials.');
          setMessageType('error');
        }
      } else {
        setMessage(result.error || 'Login failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Connection error. Please check your internet connection.');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setMemberId('');
    setScrapeStatus(null);
    setWorkouts([]);
    setMessage('');
  };

  const handleStartScrape = async () => {
    if (!memberId) {
      setMessage('Please provide a member ID');
      setMessageType('error');
      return;
    }

    setMessage('Starting workout extraction...');
    setMessageType('info');

    try {
      const result = await window.electronAPI.backend.startScrape(memberId);
      if (result.success && result.data) {
        const scrapeData = result.data as ScrapeResponseData;
        if (scrapeData.success) {
          setMessage('Extracting workouts from BTWB...');
          setMessageType('info');
          // Fetch initial status
          const statusResult = await window.electronAPI.backend.getScrapeStatus();
          if (statusResult.success && statusResult.data) {
            setScrapeStatus(statusResult.data as ScrapeStatus);
          }
        } else {
          setMessage(scrapeData.message || 'Failed to start extraction');
          setMessageType('error');
        }
      } else {
        setMessage(result.error || 'Failed to start extraction');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error starting extraction. Please try again.');
      setMessageType('error');
      console.error(error);
    }
  };

  const handleExport = async (formats: string[]) => {
    setMessage('Generating exports...');

    try {
      const result = await window.electronAPI.backend.generateExports(formats);
      if (result.success && result.data) {
        const exportData = result.data as ExportResponseData;
        if (exportData.success) {
          setMessage(`Exported ${exportData.workout_count || 0} workouts!`);
        } else {
          setMessage('Export failed');
        }
      } else {
        setMessage(result.error || 'Export failed');
      }
    } catch (error) {
      setMessage('Error generating exports');
      console.error(error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chalkflow</h1>
        <p>BTWB Workout Extractor</p>
      </header>

      <main className="app-main">
        {message && (
          <div className={`message message-${messageType}`} role="alert">
            {message}
          </div>
        )}

        {!isAuthenticated ? (
          <section className="login-section">
            <h2>Login to BTWB</h2>
            <p className="section-description">
              Enter your Beyond the Whiteboard credentials to extract your workout history.
            </p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoggingIn}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </section>
        ) : (
          <section className="scrape-section">
            <div className="section-header">
              <h2>Extract Workouts</h2>
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="memberId">Member ID:</label>
              <input
                type="text"
                id="memberId"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter BTWB member ID"
                disabled={scrapeStatus?.is_scraping}
              />
              <small className="form-hint">Your member ID from your BTWB profile</small>
            </div>

            <button
              onClick={handleStartScrape}
              className="btn btn-primary"
              disabled={scrapeStatus?.is_scraping || !memberId}
            >
              {scrapeStatus?.is_scraping ? 'Extracting...' : 'Start Extraction'}
            </button>

            {scrapeStatus && scrapeStatus.total > 0 && (
              <div className="scrape-status">
                <h3>Extraction Progress</h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((scrapeStatus.progress / scrapeStatus.total) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="progress-text">
                  {scrapeStatus.progress} / {scrapeStatus.total} workouts
                  <span className="progress-percentage">
                    ({Math.round((scrapeStatus.progress / scrapeStatus.total) * 100)}%)
                  </span>
                </p>
                <p className="status-text">{scrapeStatus.status}</p>
              </div>
            )}

            {scrapeStatus?.error && (
              <div className="error-box">
                <p>
                  <strong>Error:</strong> {scrapeStatus.error}
                </p>
              </div>
            )}

            {scrapeStatus?.status === 'completed' && (
              <>
                <ExportPreview workouts={workouts} />

                <div className="export-section">
                  <h3>Export Options</h3>
                  <div className="export-buttons">
                    <button onClick={() => handleExport(['json'])} className="btn btn-secondary">
                      Export JSON
                    </button>
                    <button onClick={() => handleExport(['csv'])} className="btn btn-secondary">
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport(['json', 'csv'])}
                      className="btn btn-secondary"
                    >
                      Export Both
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
