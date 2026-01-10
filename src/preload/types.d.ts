// Global type definitions for Electron API
export {};

// Backend API response types
interface BackendResponse<T = unknown> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: {
      backend: {
        getUrl: () => Promise<string>;
        call: (endpoint: string, options?: RequestInit) => Promise<BackendResponse>;
        login: (email: string, password: string) => Promise<BackendResponse>;
        getAuthStatus: () => Promise<BackendResponse>;
        startScrape: (
          memberId?: string,
          startDate?: string,
          endDate?: string
        ) => Promise<BackendResponse>;
        getScrapeStatus: () => Promise<BackendResponse>;
        getWorkouts: (startDate?: string, endDate?: string) => Promise<BackendResponse>;
        generateExports: (
          formats: string[],
          startDate?: string,
          endDate?: string
        ) => Promise<BackendResponse>;
        checkEntitlements: () => Promise<BackendResponse>;
      };
    };
  }
}
