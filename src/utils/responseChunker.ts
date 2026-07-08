/**
 * Response chunker for large InDesign results.
 *
 * Inspired by Blender MCP's response chunking pattern.
 * InDesign documents can have hundreds of pages, thousands of items.
 * Without chunking, JSON responses exceed MCP message size limits.
 */

import type { ToolResult, TextContent } from '../types/index.js';

/** Default max bytes per chunk (MCP recommended limit) */
const DEFAULT_MAX_CHUNK_SIZE = 100_000;

/** Max items before paginating array results */
const DEFAULT_MAX_ITEMS_PER_PAGE = 500;

export interface ChunkerOptions {
  maxChunkSize?: number;
  maxItemsPerPage?: number;
}

/**
 * Splits a large array into pages of manageable size.
 * Useful for handlers returning page lists, item collections, etc.
 */
export function paginateArray<T>(
  items: T[],
  options: ChunkerOptions = {},
): { page: number; total: number; pageSize: number; data: T[] }[] {
  const { maxItemsPerPage = DEFAULT_MAX_ITEMS_PER_PAGE } = options;
  const pages: { page: number; total: number; pageSize: number; data: T[] }[] = [];
  const totalPages = Math.ceil(items.length / maxItemsPerPage);

  for (let i = 0; i < totalPages; i++) {
    const start = i * maxItemsPerPage;
    const end = start + maxItemsPerPage;
    pages.push({
      page: i + 1,
      total: totalPages,
      pageSize: items.length,
      data: items.slice(start, end),
    });
  }

  return pages;
}

/**
 * Chunks a large JSON-serializable value into multiple ToolResult entries.
 * If the value is an array with > maxItemsPerPage items, paginates it.
 * If the serialized string exceeds maxChunkSize, splits it into parts.
 */
export function chunkResponse(
  data: unknown,
  options: ChunkerOptions = {},
): ToolResult {
  const { maxChunkSize = DEFAULT_MAX_CHUNK_SIZE } = options;

  // Handle arrays that need pagination
  if (Array.isArray(data) && data.length > (options.maxItemsPerPage ?? DEFAULT_MAX_ITEMS_PER_PAGE)) {
    const pages = paginateArray(data, options);
    const content: TextContent[] = pages.map((page) => ({
      type: 'text' as const,
      text: JSON.stringify({
        _chunk: true,
        page: page.page,
        totalPages: page.total,
        totalItems: page.pageSize,
        data: page.data,
      }),
    }));
    return { content };
  }

  const serialized = JSON.stringify(data);
  const encoder = new TextEncoder();
  const serializedBytes = encoder.encode(serialized);

  if (serializedBytes.length <= maxChunkSize) {
    return {
      content: [{ type: 'text', text: serialized }],
    };
  }

  const chunks: TextContent[] = [];
  const totalBytes = serializedBytes.length;
  const totalChunks = Math.ceil(totalBytes / maxChunkSize);
  const decoder = new TextDecoder('utf-8', { fatal: false });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * maxChunkSize;
    const end = Math.min(start + maxChunkSize, totalBytes);
    const isLast = i === totalChunks - 1;

    // Decode at byte boundary; trailing bytes of a split multi-byte char
    // become U+FFFD — strip them so concatenation reconstructs correctly
    let fragment = decoder.decode(serializedBytes.slice(start, end));
    if (!isLast) {
      while (fragment.length > 0 && fragment.charCodeAt(fragment.length - 1) === 0xFFFD) {
        fragment = fragment.slice(0, -1);
      }
    }

    chunks.push({
      type: 'text',
      text: JSON.stringify({
        _chunk: true,
        part: i + 1,
        totalParts: totalChunks,
        data: fragment,
      }),
    });
  }

  return { content: chunks };
}

/**
 * Creates a success ToolResult with optional chunking.
 *
 * When data is a large array, paginates the inner array directly so each
 * chunk carries the full { ok, data, _chunk } envelope.
 */
export function okResponse(data: unknown, options?: ChunkerOptions): ToolResult {
  const maxItemsPerPage = options?.maxItemsPerPage ?? DEFAULT_MAX_ITEMS_PER_PAGE;
  if (Array.isArray(data) && data.length > maxItemsPerPage) {
    const pages = paginateArray(data, options);
    const content: TextContent[] = pages.map((page) => ({
      type: 'text' as const,
      text: JSON.stringify({
        ok: true,
        _chunk: true,
        page: page.page,
        totalPages: page.total,
        totalItems: page.pageSize,
        data: page.data,
      }),
    }));
    return { content };
  }
  return chunkResponse({ ok: true, data }, options);
}

/**
 * Creates an error ToolResult.
 */
export function errorResponse(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message }) }],
    isError: true,
  };
}
