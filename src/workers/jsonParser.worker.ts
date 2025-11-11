/**
 * Web Worker for parsing JSON files in a background thread
 * Prevents UI blocking when loading large files
 */

export interface ParseRequest {
  type: 'parse';
  text: string;
}

export interface ParseProgress {
  type: 'progress';
  progress: number; // 0-100
  message: string;
}

export interface ParseSuccess {
  type: 'success';
  data: unknown;
  size: number;
  metadata: {
    nodeCount: number;
    maxDepth: number;
  };
}

export interface ParseError {
  type: 'error';
  error: string;
}

export type ParseResponse = ParseProgress | ParseSuccess | ParseError;

/**
 * Count total nodes in JSON structure
 */
function countNodes(value: unknown): number {
  if (value === null || typeof value !== 'object') {
    return 1;
  }

  let count = 1; // Count current node

  if (Array.isArray(value)) {
    for (const item of value) {
      count += countNodes(item);
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        count += countNodes((value as Record<string, unknown>)[key]);
      }
    }
  }

  return count;
}

/**
 * Calculate maximum depth of JSON structure
 */
function calculateMaxDepth(value: unknown, currentDepth = 0): number {
  if (value === null || typeof value !== 'object') {
    return currentDepth;
  }

  let maxDepth = currentDepth;

  if (Array.isArray(value)) {
    for (const item of value) {
      maxDepth = Math.max(maxDepth, calculateMaxDepth(item, currentDepth + 1));
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        maxDepth = Math.max(
          maxDepth,
          calculateMaxDepth((value as Record<string, unknown>)[key], currentDepth + 1)
        );
      }
    }
  }

  return maxDepth;
}

/**
 * Calculate file size in bytes
 */
function calculateSize(data: unknown): number {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
}

// Worker message handler
self.onmessage = (event: MessageEvent<ParseRequest>) => {
  try {
    const { text } = event.data;

    // Send progress: Starting parse
    self.postMessage({
      type: 'progress',
      progress: 10,
      message: 'Parsing JSON...',
    } as ParseProgress);

    // Parse JSON (this is the blocking operation we're offloading)
    const data = JSON.parse(text);

    // Send progress: Parse complete
    self.postMessage({
      type: 'progress',
      progress: 40,
      message: 'Calculating file size...',
    } as ParseProgress);

    // Calculate file size
    const size = calculateSize(data);

    // Send progress: Size calculated
    self.postMessage({
      type: 'progress',
      progress: 60,
      message: 'Analyzing structure...',
    } as ParseProgress);

    // Calculate metadata
    const nodeCount = countNodes(data);

    self.postMessage({
      type: 'progress',
      progress: 80,
      message: 'Computing depth...',
    } as ParseProgress);

    const maxDepth = calculateMaxDepth(data);

    // Send success with all data
    self.postMessage({
      type: 'success',
      data,
      size,
      metadata: {
        nodeCount,
        maxDepth,
      },
    } as ParseSuccess);
  } catch (error) {
    // Send error
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
    } as ParseError);
  }
};
