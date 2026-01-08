// Global type definitions for Electron API
export {};

declare global {
  interface Window {
    electronAPI: {
      backend: {
        getUrl: () => Promise<string>;
        call: (endpoint: string, options?: RequestInit) => Promise<any>;
        login: (email: string, password: string) => Promise<any>;
        getAuthStatus: () => Promise<any>;
        startScrape: (memberId?: string, startDate?: string, endDate?: string) => Promise<any>;
        getScrapeStatus: () => Promise<any>;
        generateExports: (formats: string[], startDate?: string, endDate?: string) => Promise<any>;
        checkEntitlements: () => Promise<any>;
      };
    };
  }
}
