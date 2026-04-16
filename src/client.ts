import { resolveEndpointUrl } from './endpoints.js';
import type { GraphQLResponse, GraphQLQueryVariables } from './types.js';
import { ApiKeyMissingError, NetworkError, GraphQLError } from './errors.js';

interface QueryOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  endpoint?: string;
}

function getApiKey(): string {
  const key = process.env.ONESOURCE_API_KEY || process.env.MACH10_API_KEY;
  if (!key) {
    throw new ApiKeyMissingError();
  }
  return key;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timeout', 408);
    }
    throw error;
  }
}

async function executeQuery<T>(
  gql: string, 
  variables?: GraphQLQueryVariables,
  options: QueryOptions = {}
): Promise<GraphQLResponse<T>> {
  const endpoint = options.endpoint ?? resolveEndpointUrl();
  const { timeout = 30000 } = options; // 30 second default timeout
  
  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bp-token': getApiKey(),
    },
    body: JSON.stringify({ query: gql, variables }),
  }, timeout);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new NetworkError(`HTTP ${res.status}: ${res.statusText}`, res.status, body);
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors) {
    throw new GraphQLError(json.errors);
  }

  return json;
}

export async function query<T = Record<string, unknown>>(
  gql: string,
  variables?: GraphQLQueryVariables,
  options: QueryOptions = {}
): Promise<GraphQLResponse<T>> {
  const { retries = 3, retryDelay = 1000 } = options;
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await executeQuery<T>(gql, variables, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation errors, GraphQL errors, or 4xx errors
      if (error instanceof GraphQLError || 
          error instanceof ApiKeyMissingError ||
          (error instanceof NetworkError && 
           error.statusCode && 
           error.statusCode >= 400 && 
           error.statusCode < 500)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
}