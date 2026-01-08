import { contextBridge, ipcRenderer } from 'electron';

// API exposed to renderer process
const api = {
  backend: {
    // Get backend URL
    getUrl: (): Promise<string> => ipcRenderer.invoke('backend:getUrl'),

    // Make API call to Python backend
    call: (endpoint: string, options?: RequestInit): Promise<any> =>
      ipcRenderer.invoke('backend:call', endpoint, options),

    // Convenience methods for common operations
    login: (email: string, password: string) =>
      ipcRenderer.invoke('backend:call', '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),

    getAuthStatus: () => ipcRenderer.invoke('backend:call', '/auth/status', { method: 'GET' }),

    startScrape: (memberId?: string, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('backend:call', '/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, start_date: startDate, end_date: endDate }),
      }),

    getScrapeStatus: () => ipcRenderer.invoke('backend:call', '/scrape/status', { method: 'GET' }),

    generateExports: (formats: string[], startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('backend:call', '/export/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats, start_date: startDate, end_date: endDate }),
      }),

    checkEntitlements: () =>
      ipcRenderer.invoke('backend:call', '/entitlements/check', { method: 'GET' }),
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', api);

// Type definitions for TypeScript
export type ElectronAPI = typeof api;
