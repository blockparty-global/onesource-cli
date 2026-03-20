/**
 * Custom error classes for better error handling
 */

export class OneSourceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'OneSourceError';
  }
}

export class ApiKeyMissingError extends OneSourceError {
  constructor() {
    super('API key is required. Set ONESOURCE_API_KEY environment variable.', 'API_KEY_MISSING');
  }

  getSuggestion(): string {
    return 'Set your API key: export ONESOURCE_API_KEY=your_key_here';
  }
}

export class NetworkError extends OneSourceError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: string
  ) {
    super(message, 'NETWORK_ERROR');
  }

  getSuggestion(): string {
    if (this.statusCode === 401) {
      return 'Check your API key is valid and has necessary permissions';
    }
    if (this.statusCode === 429) {
      return 'Rate limit exceeded. Please wait and try again';
    }
    if (this.statusCode && this.statusCode >= 500) {
      return 'Server error. Please try again later';
    }
    return 'Check your internet connection and try again';
  }
}

export class GraphQLError extends OneSourceError {
  constructor(public readonly errors: Array<{ message: string; path?: (string | number)[] }>) {
    const message = errors.map((e) => e.message).join(', ');
    super(`GraphQL errors: ${message}`, 'GRAPHQL_ERROR');
  }

  getSuggestion(): string {
    const firstError = this.errors[0];
    const message = firstError?.message.toLowerCase() || '';
    if (message.includes('not found')) {
      return 'Check that the resource exists and your parameters are correct';
    }
    if (message.includes('permission')) {
      return 'Check that your API key has permission to access this resource';
    }
    return 'Check your query parameters and try again';
  }
}

export class ValidationError extends OneSourceError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR');
  }

  getSuggestion(): string {
    if (this.field) {
      return `Please provide a valid ${this.field}`;
    }
    return 'Please check your input and try again';
  }
}

export class EndpointError extends OneSourceError {
  constructor(message: string) {
    super(message, 'ENDPOINT_ERROR');
  }

  getSuggestion(): string {
    return 'Use "onesource endpoint --list" to see available endpoints';
  }
}

/**
 * Format error for display to user
 */
interface ErrorWithSuggestion {
  getSuggestion(): string;
}

export function formatError(error: unknown): { message: string; suggestion?: string } {
  if (error instanceof OneSourceError) {
    const hasGetSuggestion = 'getSuggestion' in error && typeof error.getSuggestion === 'function';
    return {
      message: error.message,
      suggestion: hasGetSuggestion ? (error as ErrorWithSuggestion).getSuggestion() : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: String(error) };
}

/**
 * Handle error and exit gracefully
 */
export function handleError(error: unknown, exitCode: number = 1): never {
  const { message, suggestion } = formatError(error);
  
  console.error(`Error: ${message}`);
  if (suggestion) {
    console.error(`Suggestion: ${suggestion}`);
  }
  
  process.exit(exitCode);
}
