import { supabase } from '@/integrations/supabase/client';

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Retryable error status codes
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Check if error is retryable
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors (no response)
  if (!error.response && !error.status) {
    return true;
  }

  // Specific status codes
  if (error.status && RETRYABLE_STATUS_CODES.includes(error.status)) {
    return true;
  }

  // Supabase-specific errors
  if (error.code) {
    const retryableCodes = [
      'PGRST116', // Insufficient storage
      'PGRST122', // Too many requests
      '57014', // Connection pool exhausted
    ];
    return retryableCodes.includes(error.code);
  }

  return false;
}

// Calculate exponential backoff delay
export function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
    RETRY_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

// Generic retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<typeof RETRY_CONFIG> = {}
): Promise<T> {
  const config = { ...RETRY_CONFIG, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't wait after last attempt
      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(`Attempt ${attempt}/${config.maxRetries} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Supabase query with retry
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: Partial<typeof RETRY_CONFIG> = {}
): Promise<T> {
  return withRetry(async () => {
    const result = await queryFn();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error('Query returned no data');
    }

    return result.data;
  }, options);
}

// Supabase mutation with retry
export async function mutateWithRetry<T>(
  mutateFn: () => Promise<{ data: T | null; error: any }>,
  options: Partial<typeof RETRY_CONFIG> = {}
): Promise<T> {
  return withRetry(async () => {
    const result = await mutateFn();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error('Mutation returned no data');
    }

    return result.data;
  }, options);
}

// Safe query wrapper with error handling
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  defaultValue: T,
  onError?: (error: any) => void
): Promise<T> {
  try {
    const result = await queryFn();

    if (result.error) {
      if (onError) {
        onError(result.error);
      } else {
        console.error('Query error:', result.error);
      }
      return defaultValue;
    }

    return result.data ?? defaultValue;
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Unexpected query error:', error);
    }
    return defaultValue;
  }
}

// Rate limiting helper
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;

    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter(t => t > windowStart);

    // Check if under limit
    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now);
      this.requests.set(key, validTimestamps);
      return true;
    }

    return false;
  }

  async waitForAvailability(key: string = 'default'): Promise<void> {
    const timestamps = this.requests.get(key) || [];
    const oldestTimestamp = timestamps[0];

    if (oldestTimestamp) {
      const waitTime = oldestTimestamp + this.windowMs - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// Throttle helper
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (!inThrottle) {
      fn(...lastArgs!);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private threshold: number;
  private timeout: number;

  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success - reset
      this.failureCount = 0;
      this.state = 'closed';

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = 'open';
        console.error('Circuit breaker opened after', this.failureCount, 'failures');
      }

      throw error;
    }
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();

// Connection health check
export async function checkConnectionHealth(): Promise<{
  healthy: boolean;
  latency?: number;
}> {
  const start = Date.now();

  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    const latency = Date.now() - start;

    return {
      healthy: !error,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
    };
  }
}

// Batch multiple queries
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<Array<T | Error>> {
  const results = await Promise.allSettled(queries);

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return result.reason;
  });
}

// Transaction helper with rollback
export async function withTransaction<T>(
  fn: () => Promise<T>,
  onRollback?: (error: any) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (onRollback) {
      onRollback(error);
    }
    throw error;
  }
}

// Error type utilities
export function isNetworkError(error: any): boolean {
  return (
    !error.response &&
    !error.status &&
    (error.message?.includes('network') ||
     error.message?.includes('fetch') ||
     error.message?.includes('timeout'))
  );
}

export function isAuthError(error: any): boolean {
  return (
    error?.status === 401 ||
    error?.code === 'PGRST301' || // JWT expired
    error?.message?.includes('Unauthorized')
  );
}

export function isPermissionError(error: any): boolean {
  return (
    error?.status === 403 ||
    error?.code === '42501' || // Insufficient privilege
    error?.message?.includes('Permission denied')
  );
}

export function isValidationError(error: any): boolean {
  return (
    error?.status === 400 ||
    error?.code?.startsWith('PGRST204') ||
    error?.message?.includes('validation')
  );
}
