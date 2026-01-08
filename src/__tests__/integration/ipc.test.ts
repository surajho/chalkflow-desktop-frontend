import { describe, it, expect } from 'vitest';

describe('Integration Test Example: IPC Communication', () => {
  it('should have electronAPI exposed on window', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.backend).toBeDefined();
  });

  it('should have all required backend methods', () => {
    const { backend } = window.electronAPI;

    expect(backend.getUrl).toBeDefined();
    expect(backend.call).toBeDefined();
    expect(backend.login).toBeDefined();
    expect(backend.getAuthStatus).toBeDefined();
    expect(backend.startScrape).toBeDefined();
    expect(backend.getScrapeStatus).toBeDefined();
    expect(backend.generateExports).toBeDefined();
    expect(backend.checkEntitlements).toBeDefined();
  });

  it('should call backend methods and return expected structure', async () => {
    const result = await window.electronAPI.backend.getAuthStatus();

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(typeof result.success).toBe('boolean');
  });
});
