import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Poll scrape status when scraping
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (scrapeStatus?.is_scraping) {
      interval = setInterval(async () => {
        const result = await window.electronAPI.backend.getScrapeStatus();
        if (result.success && result.data) {
          setScrapeStatus(result.data as ScrapeStatus);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scrapeStatus?.is_scraping]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      const result = await window.electronAPI.backend.login(email, password);
      if (result.success && result.data) {
        const loginData = result.data as LoginResponseData;
        if (loginData.success) {
          setIsAuthenticated(true);
          setMemberId(loginData.member_id || '');
          setMessage('Login successful!');
          setPassword('');
        } else {
          setMessage(loginData.message || 'Login failed');
        }
      } else {
        setMessage(result.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Error during login');
      console.error(error);
    }
  };

  const handleStartScrape = async () => {
    setMessage('Starting scrape...');

    try {
      const result = await window.electronAPI.backend.startScrape(memberId);
      if (result.success && result.data) {
        const scrapeData = result.data as ScrapeResponseData;
        if (scrapeData.success) {
          setMessage('Scraping started!');
          // Fetch initial status
          const statusResult = await window.electronAPI.backend.getScrapeStatus();
          if (statusResult.success && statusResult.data) {
            setScrapeStatus(statusResult.data as ScrapeStatus);
          }
        } else {
          setMessage(scrapeData.message || 'Failed to start scrape');
        }
      } else {
        setMessage(result.error || 'Failed to start scrape');
      }
    } catch (error) {
      setMessage('Error starting scrape');
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
        {message && <div className="message">{message}</div>}

        {!isAuthenticated ? (
          <section className="login-section">
            <h2>Login to BTWB</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </form>
          </section>
        ) : (
          <section className="scrape-section">
            <h2>Extract Workouts</h2>

            <div className="form-group">
              <label htmlFor="memberId">Member ID:</label>
              <input
                type="text"
                id="memberId"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter BTWB member ID"
              />
            </div>

            <button
              onClick={handleStartScrape}
              className="btn btn-primary"
              disabled={scrapeStatus?.is_scraping}
            >
              {scrapeStatus?.is_scraping ? 'Scraping...' : 'Start Scrape'}
            </button>

            {scrapeStatus && (
              <div className="scrape-status">
                <h3>Scrape Progress</h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(scrapeStatus.progress / scrapeStatus.total) * 100}%`,
                    }}
                  />
                </div>
                <p>
                  {scrapeStatus.progress} / {scrapeStatus.total} workouts ({scrapeStatus.status})
                </p>
              </div>
            )}

            {scrapeStatus?.status === 'completed' && (
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
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
