import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fs and os modules before any imports
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/home/test'),
}));

const { readFileSync, writeFileSync, mkdirSync } = await import('node:fs');
const { homedir } = await import('node:os');
const { join } = await import('node:path');

const {
  KNOWN_ENDPOINTS,
  DEFAULT_ENDPOINT,
  getActiveEndpointName,
  resolveEndpointUrl,
  setEndpoint,
} = await import('../endpoints.js');

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockHomedir = vi.mocked(homedir);

describe('endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHomedir.mockReturnValue('/home/test');
    delete process.env.ONESOURCE_API_ENDPOINT;
  });

  afterEach(() => {
    delete process.env.ONESOURCE_API_ENDPOINT;
  });

  describe('constants', () => {
    it('should have known endpoints', () => {
      expect(KNOWN_ENDPOINTS).toHaveProperty('ethereum');
      expect(KNOWN_ENDPOINTS).toHaveProperty('blockticity');
      expect(KNOWN_ENDPOINTS.ethereum.url).toBe('https://api-sre-dash.onesource.io/graphql');
      expect(KNOWN_ENDPOINTS.blockticity.url).toBe('https://api-blockticity.onesource.io/graphql');
    });

    it('should have default endpoint', () => {
      expect(DEFAULT_ENDPOINT).toBe('ethereum');
    });
  });

  describe('getActiveEndpointName', () => {
    it('should return env var when set', () => {
      process.env.ONESOURCE_API_ENDPOINT = 'https://custom.example.com/graphql';
      const result = getActiveEndpointName();
      expect(result).toBe('custom (env)');
    });

    it('should return config value when no env var', () => {
      mockReadFileSync.mockReturnValue('{"endpoint":"blockticity"}');
      const result = getActiveEndpointName();
      expect(result).toBe('blockticity');
    });

    it('should return default when no config', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      const result = getActiveEndpointName();
      expect(result).toBe(DEFAULT_ENDPOINT);
    });
  });

  describe('resolveEndpointUrl', () => {
    it('should return env var URL when set', () => {
      const customUrl = 'https://custom.example.com/graphql';
      process.env.ONESOURCE_API_ENDPOINT = customUrl;
      const result = resolveEndpointUrl();
      expect(result).toBe(customUrl);
    });

    it('should resolve known endpoint name', () => {
      mockReadFileSync.mockReturnValue('{"endpoint":"blockticity"}');
      const result = resolveEndpointUrl();
      expect(result).toBe(KNOWN_ENDPOINTS.blockticity.url);
    });

    it('should treat unknown name as custom URL', () => {
      const customUrl = 'https://custom.example.com/graphql';
      mockReadFileSync.mockReturnValue(`{"endpoint":"${customUrl}"}`);
      const result = resolveEndpointUrl();
      expect(result).toBe(customUrl);
    });

    it('should use default when no config', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      const result = resolveEndpointUrl();
      expect(result).toBe(KNOWN_ENDPOINTS[DEFAULT_ENDPOINT].url);
    });
  });

  describe('setEndpoint', () => {
    it('should save endpoint to config file', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      setEndpoint('blockticity');

      expect(mockMkdirSync).toHaveBeenCalledWith(join('/home/test', '.onesource'), {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join('/home/test', '.onesource', 'config.json'),
        '{\n  "endpoint": "blockticity"\n}\n'
      );
    });

    it('should preserve existing config when updating', () => {
      mockReadFileSync.mockReturnValue('{"other":"value"}');

      setEndpoint('ethereum');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '{\n  "other": "value",\n  "endpoint": "ethereum"\n}\n'
      );
    });
  });
});
