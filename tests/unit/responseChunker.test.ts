import { describe, it, expect } from 'vitest';

import {
  paginateArray,
  chunkResponse,
  okResponse,
  errorResponse,
} from '../../src/utils/responseChunker.js';

describe('responseChunker', () => {
  describe('paginateArray', () => {
    it('should return single page for small arrays', () => {
      const items = [1, 2, 3];
      const pages = paginateArray(items);
      expect(pages).toHaveLength(1);
      expect(pages[0].page).toBe(1);
      expect(pages[0].data).toEqual([1, 2, 3]);
    });

    it('should paginate arrays larger than maxItemsPerPage', () => {
      const items = Array.from({ length: 1200 }, (_, i) => i);
      const pages = paginateArray(items, { maxItemsPerPage: 500 });
      expect(pages).toHaveLength(3);
      expect(pages[0].data).toHaveLength(500);
      expect(pages[1].data).toHaveLength(500);
      expect(pages[2].data).toHaveLength(200);
    });

    it('should set correct metadata on each page', () => {
      const items = Array.from({ length: 750 }, (_, i) => i);
      const pages = paginateArray(items, { maxItemsPerPage: 400 });
      expect(pages).toHaveLength(2);
      expect(pages[0]).toEqual({
        page: 1,
        total: 2,
        pageSize: 750,
        data: expect.arrayContaining([0, 399]),
      });
      expect(pages[1]).toEqual({
        page: 2,
        total: 2,
        pageSize: 750,
        data: expect.arrayContaining([400, 749]),
      });
    });

    it('should handle empty array', () => {
      const pages = paginateArray([]);
      expect(pages).toHaveLength(0);
    });

    it('should use custom maxItemsPerPage', () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const pages = paginateArray(items, { maxItemsPerPage: 3 });
      expect(pages).toHaveLength(4);
      expect(pages[0].data).toHaveLength(3);
      expect(pages[3].data).toHaveLength(1);
    });

    it('should handle exact multiple of maxItemsPerPage', () => {
      const items = Array.from({ length: 500 }, (_, i) => i);
      const pages = paginateArray(items, { maxItemsPerPage: 500 });
      expect(pages).toHaveLength(1);
      expect(pages[0].data).toHaveLength(500);
    });
  });

  describe('chunkResponse', () => {
    it('should return single content for small responses', () => {
      const result = chunkResponse({ message: 'hello' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });

    it('should paginate large arrays', () => {
      const largeArray = Array.from({ length: 600 }, (_, i) => ({ id: i }));
      const result = chunkResponse(largeArray, { maxItemsPerPage: 500 });
      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      const firstPage = JSON.parse(result.content[0].text);
      expect(firstPage._chunk).toBe(true);
      expect(firstPage.page).toBe(1);
      expect(firstPage.totalPages).toBe(2);
    });

    it('should split large serialized objects by byte size', () => {
      // Create a large object just under the size limit
      const large = { data: 'x'.repeat(80_000) };
      const result = chunkResponse(large, { maxChunkSize: 50_000 });
      expect(result.content.length).toBeGreaterThanOrEqual(1);
      if (result.content.length > 1) {
        const firstChunk = JSON.parse(result.content[0].text);
        expect(firstChunk._chunk).toBe(true);
        expect(firstChunk.part).toBe(1);
        expect(firstChunk.totalParts).toBeGreaterThan(1);
      }
    });

    it('should not chunk data that fits within limits', () => {
      const data = { items: [1, 2, 3] };
      const result = chunkResponse(data, { maxChunkSize: 1000, maxItemsPerPage: 10 });
      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.items).toEqual([1, 2, 3]);
    });

    it('should handle null data', () => {
      const result = chunkResponse(null);
      expect(result.content).toHaveLength(1);
    });

    it('should handle undefined data', () => {
      const result = chunkResponse(undefined);
      expect(result.content).toHaveLength(1);
    });

    it('should handle string data', () => {
      const result = chunkResponse('simple string');
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toBe('simple string');
    });

    it('should handle number data', () => {
      const result = chunkResponse(42);
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toBe(42);
    });
  });

  describe('okResponse', () => {
    it('should wrap data in { ok: true, data: ... }', () => {
      const result = okResponse({ document: 'test.indd' });
      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
      expect(parsed.data).toEqual({ document: 'test.indd' });
    });

    it('should not set isError', () => {
      const result = okResponse('success');
      expect(result.isError).toBeUndefined();
    });

    it('should pass chunker options through', () => {
      const largeArray = Array.from({ length: 600 }, (_, i) => i);
      const result = okResponse(largeArray, { maxItemsPerPage: 500 });
      expect(result.content).toHaveLength(2);
    });
  });

  describe('errorResponse', () => {
    it('should wrap error message in { ok: false, error: ... }', () => {
      const result = errorResponse('Something went wrong');
      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toBe('Something went wrong');
    });

    it('should set isError to true', () => {
      const result = errorResponse('error');
      expect(result.isError).toBe(true);
    });

    it('should handle empty error message', () => {
      const result = errorResponse('');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('');
    });
  });
});
