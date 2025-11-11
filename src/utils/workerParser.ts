/**
 * Wrapper for JSON parsing Web Worker
 * Provides Promise-based API for non-blocking JSON parsing
 */

import type {
  ParseRequest,
  ParseResponse,
  ParseSuccess,
} from '../workers/jsonParser.worker';
import { calculateJsonSize } from './fileSize';

export interface ParseResult {
  data: unknown;
  size: number;
  metadata: {
    nodeCount: number;
    maxDepth: number;
  };
}

export interface ParseOptions {
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Parse JSON text using a Web Worker (non-blocking)
 * Falls back to synchronous parsing if Web Workers are not supported
 */
export async function parseJSONAsync(
  text: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  // Check if Web Workers are supported
  if (typeof Worker === 'undefined') {
    return parseFallback(text, options);
  }

  return new Promise((resolve, reject) => {
    let worker: Worker;

    try {
      // Create worker
      worker = new Worker(
        new URL('../workers/jsonParser.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      worker.onmessage = (event: MessageEvent<ParseResponse>) => {
        const response = event.data;

        switch (response.type) {
          case 'progress':
            if (options.onProgress) {
              options.onProgress(response.progress, response.message);
            }
            break;

          case 'success': {
            const success = response as ParseSuccess;
            resolve({
              data: success.data,
              size: success.size,
              metadata: success.metadata,
            });
            worker.terminate();
            break;
          }

          case 'error':
            reject(new Error(response.error));
            worker.terminate();
            break;
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate();
      };

      // Send parse request to worker
      const request: ParseRequest = {
        type: 'parse',
        text,
      };
      worker.postMessage(request);
    } catch (error) {
      // If worker creation fails, fall back to synchronous parsing
      if (worker!) {
        worker.terminate();
      }
      return parseFallback(text, options);
    }
  });
}

/**
 * Fallback to synchronous parsing when Web Workers are not available
 */
function parseFallback(
  text: string,
  options: ParseOptions
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    try {
      if (options.onProgress) {
        options.onProgress(10, 'Parsing JSON...');
      }

      const data = JSON.parse(text);

      if (options.onProgress) {
        options.onProgress(50, 'Calculating file size...');
      }

      const size = calculateJsonSize(data);

      if (options.onProgress) {
        options.onProgress(75, 'Analyzing structure...');
      }

      // Calculate metadata
      const nodeCount = countNodesFallback(data);
      const maxDepth = calculateMaxDepthFallback(data);

      if (options.onProgress) {
        options.onProgress(100, 'Complete');
      }

      resolve({
        data,
        size,
        metadata: {
          nodeCount,
          maxDepth,
        },
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to parse JSON'));
    }
  });
}

/**
 * Count total nodes in JSON structure (fallback implementation)
 */
function countNodesFallback(value: unknown): number {
  if (value === null || typeof value !== 'object') {
    return 1;
  }

  let count = 1;

  if (Array.isArray(value)) {
    for (const item of value) {
      count += countNodesFallback(item);
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        count += countNodesFallback((value as Record<string, unknown>)[key]);
      }
    }
  }

  return count;
}

/**
 * Calculate maximum depth of JSON structure (fallback implementation)
 */
function calculateMaxDepthFallback(value: unknown, currentDepth = 0): number {
  if (value === null || typeof value !== 'object') {
    return currentDepth;
  }

  let maxDepth = currentDepth;

  if (Array.isArray(value)) {
    for (const item of value) {
      maxDepth = Math.max(maxDepth, calculateMaxDepthFallback(item, currentDepth + 1));
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        maxDepth = Math.max(
          maxDepth,
          calculateMaxDepthFallback((value as Record<string, unknown>)[key], currentDepth + 1)
        );
      }
    }
  }

  return maxDepth;
}
