import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiKeyMissingError, NetworkError, GraphQLError } from '../errors.js';

// Mock fetch globally
global.fetch = vi.fn();

const { query } = await import('../client.js');

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ONESOURCE_API_KEY;
    delete process.env.MACH10_API_KEY;
    delete process.env.ONESOURCE_API_ENDPOINT;
  });

  afterEach(() => {
    delete process.env.ONESOURCE_API_KEY;
    delete process.env.MACH10_API_KEY;
    delete process.env.ONESOURCE_API_ENDPOINT;
  });

  describe('query', () => {
    it('should throw ApiKeyMissingError when no API key is set', async () => {
      await expect(query('query { test }')).rejects.toThrow(ApiKeyMissingError);
    });

    it('should use ONESOURCE_API_KEY when set', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { test: 'value' } }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await query('query { test }');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-bp-token': 'test-key',
          }),
        })
      );
    });

    it('should use MACH10_API_KEY as fallback', async () => {
      process.env.MACH10_API_KEY = 'mach10-key';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { test: 'value' } }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await query('query { test }');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-bp-token': 'mach10-key',
          }),
        })
      );
    });

    it('should send GraphQL query with variables', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { test: 'value' } }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const query_string = 'query Test($id: ID!) { test(id: $id) }';
      const variables = { id: '123' };

      await query(query_string, variables);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            query: query_string,
            variables,
          }),
        })
      );
    });

    it('should throw NetworkError on HTTP errors', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('Not found'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(query('query { test }')).rejects.toThrow(NetworkError);
    });

    it('should throw GraphQLError when response contains errors', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: null,
          errors: [{ message: 'Field not found' }],
        }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(query('query { test }')).rejects.toThrow(GraphQLError);
    });

    it('should return successful response data', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const responseData = { data: { block: { number: 123 } } };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(responseData),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await query('query { block }');

      expect(result).toEqual(responseData);
    });

    it('should handle empty variables gracefully', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: { test: 'value' } }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await query('query { test }', undefined);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            query: 'query { test }',
            variables: undefined,
          }),
        })
      );
    });

    it('should handle network errors during fetch', async () => {
      process.env.ONESOURCE_API_KEY = 'test-key';
      vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));

      await expect(query('query { test }', undefined, { retries: 0 })).rejects.toThrow('Network failure');
    });
  });
});