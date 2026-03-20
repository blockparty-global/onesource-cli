import { describe, it, expect, vi } from 'vitest';
import {
  OneSourceError,
  ApiKeyMissingError,
  NetworkError,
  GraphQLError,
  ValidationError,
  EndpointError,
  formatError,
  handleError,
} from '../errors.js';

describe('errors', () => {
  describe('OneSourceError', () => {
    it('should create error with message and code', () => {
      const error = new OneSourceError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('OneSourceError');
    });
  });

  describe('ApiKeyMissingError', () => {
    it('should create error with default message and code', () => {
      const error = new ApiKeyMissingError();
      expect(error.message).toContain('API key is required');
      expect(error.code).toBe('API_KEY_MISSING');
      expect(error.getSuggestion()).toContain('ONESOURCE_API_KEY');
    });
  });

  describe('NetworkError', () => {
    it('should create error with status code and response body', () => {
      const error = new NetworkError('HTTP 500', 500, 'Server error');
      expect(error.message).toBe('HTTP 500');
      expect(error.statusCode).toBe(500);
      expect(error.responseBody).toBe('Server error');
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should provide appropriate suggestions based on status code', () => {
      expect(new NetworkError('Unauthorized', 401).getSuggestion()).toContain('API key');
      expect(new NetworkError('Rate limited', 429).getSuggestion()).toContain('Rate limit');
      expect(new NetworkError('Server error', 500).getSuggestion()).toContain('Server error');
      expect(new NetworkError('Unknown', 999).getSuggestion()).toContain('Server error'); // 999 >= 500
      expect(new NetworkError('Network failed', 400).getSuggestion()).toContain('Check your internet connection');
    });
  });

  describe('GraphQLError', () => {
    it('should create error with GraphQL error details', () => {
      const graphqlErrors = [
        { message: 'Field not found', path: ['block', 'hash'] },
        { message: 'Invalid argument' },
      ];
      const error = new GraphQLError(graphqlErrors);
      
      expect(error.message).toContain('Field not found, Invalid argument');
      expect(error.code).toBe('GRAPHQL_ERROR');
      expect(error.errors).toEqual(graphqlErrors);
    });

    it('should provide appropriate suggestions based on error message', () => {
      const notFoundError = new GraphQLError([{ message: 'Block not found' }]);
      expect(notFoundError.getSuggestion()).toContain('resource exists');

      const permissionError = new GraphQLError([{ message: 'Permission denied' }]);
      expect(permissionError.getSuggestion()).toContain('API key has permission');

      const genericError = new GraphQLError([{ message: 'Something else' }]);
      expect(genericError.getSuggestion()).toContain('query parameters');
    });
  });

  describe('ValidationError', () => {
    it('should create error with field information', () => {
      const error = new ValidationError('Invalid address', 'address');
      expect(error.message).toBe('Invalid address');
      expect(error.field).toBe('address');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should provide field-specific suggestions', () => {
      const fieldError = new ValidationError('Invalid', 'blockNumber');
      expect(fieldError.getSuggestion()).toContain('blockNumber');

      const genericError = new ValidationError('Invalid');
      expect(genericError.getSuggestion()).toContain('check your input');
    });
  });

  describe('EndpointError', () => {
    it('should create error with endpoint-specific suggestion', () => {
      const error = new EndpointError('Unknown endpoint');
      expect(error.message).toBe('Unknown endpoint');
      expect(error.code).toBe('ENDPOINT_ERROR');
      expect(error.getSuggestion()).toContain('onesource endpoint --list');
    });
  });

  describe('formatError', () => {
    it('should format OneSource errors with suggestions', () => {
      const error = new ApiKeyMissingError();
      const formatted = formatError(error);
      
      expect(formatted.message).toContain('API key is required');
      expect(formatted.suggestion).toContain('ONESOURCE_API_KEY');
    });

    it('should format regular errors without suggestions', () => {
      const error = new Error('Regular error');
      const formatted = formatError(error);
      
      expect(formatted.message).toBe('Regular error');
      expect(formatted.suggestion).toBeUndefined();
    });

    it('should handle non-error values', () => {
      const formatted = formatError('String error');
      expect(formatted.message).toBe('String error');
      expect(formatted.suggestion).toBeUndefined();
    });

    it('should handle null/undefined', () => {
      expect(formatError(null).message).toBe('null');
      expect(formatError(undefined).message).toBe('undefined');
    });
  });

  describe('handleError', () => {
    it('should log error and exit with specified code', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      const error = new ValidationError('Test error', 'test');
      
      expect(() => handleError(error, 42)).toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('Error: Test error');
      expect(consoleSpy).toHaveBeenCalledWith('Suggestion: Please provide a valid test');
      expect(exitSpy).toHaveBeenCalledWith(42);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should use default exit code when not specified', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => handleError(new Error('test'))).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});