import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron API for tests
global.window = global.window || {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.window as any).electronAPI = {
  backend: {
    getUrl: async () => 'http://localhost:8000',
    call: async () => ({ success: true, data: {} }),
    login: async () => ({ success: true, data: { success: true } }),
    getAuthStatus: async () => ({ success: true, data: { is_logged_in: false } }),
    startScrape: async () => ({ success: true, data: { success: true } }),
    getScrapeStatus: async () => ({
      success: true,
      data: { is_scraping: false, progress: 0, total: 0, status: 'idle', error: null },
    }),
    generateExports: async () => ({ success: true, data: { success: true, workout_count: 0 } }),
    checkEntitlements: async () => ({ success: true, data: {} }),
  },
};
