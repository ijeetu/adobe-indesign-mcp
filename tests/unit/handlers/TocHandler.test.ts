import { describe, it, expect, vi } from 'vitest';
import { TocHandler } from '../../../src/handlers/TocHandler.js';

describe('TocHandler', () => {
  function createMockExecutor() {
    return {
      execute: vi.fn().mockResolvedValue({ result: 'ok' }),
      on: vi.fn(),
      handleResponse: vi.fn(),
      cancelAll: vi.fn(),
      getStatus: vi.fn().mockReturnValue({ connected: true, queueDepth: 0 }),
    };
  }

  describe('handler structure', () => {
    it('should have name "toc"', () => {
      const handler = new TocHandler(createMockExecutor() as any);
      expect(handler.name).toBe('toc');
    });

    it('should expose 4 tools', () => {
      const handler = new TocHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new TocHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('toc_createStyle');
      expect(names).toContain('toc_generate');
      expect(names).toContain('toc_listStyles');
      expect(names).toContain('toc_update');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new TocHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('toc_createStyle', () => {
    it('should call executor with tocStyles code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { name: 'My TOC', created: true },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_createStyle')!;
      const result = await tool.handler({
        name: 'My TOC',
        title: 'Table of Contents',
        includeParagraphStyles: ['Heading 1', 'Heading 2'],
        replaceExisting: true,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tocStyles.add');
      expect(code).toContain('My TOC');
      expect(code).toContain('Heading 1');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle optional parameters', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { name: 'Simple TOC', created: true },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_createStyle')!;
      await tool.handler({ name: 'Simple TOC' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tocStyles.add');
      expect(code).not.toContain('tocStyle.title');
      expect(code).not.toContain('includeParagraphStyles');
    });
  });

  describe('toc_generate', () => {
    it('should call executor with generateTOC', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { pageIndex: 0, storyIndex: 1 },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_generate')!;
      const result = await tool.handler({ styleName: 'My TOC', pageIndex: 0 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('generateTOC');
      expect(code).toContain('textFrames.add');
      expect(code).toContain('tocStyle');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include bounds and layer when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { pageIndex: 0, storyIndex: 1 },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_generate')!;
      await tool.handler({
        styleName: 'My TOC',
        pageIndex: 0,
        bounds: { top: 10, left: 10, bottom: 100, right: 200 },
        title: 'Contents',
        layerIndex: 0,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('geometricBounds');
      expect(code).toContain('itemLayer');
      expect(code).toContain('Contents');
    });
  });

  describe('toc_listStyles', () => {
    it('should return list of TOC styles', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { name: 'My TOC', title: 'Contents', entryStyle: 'HeadingStyle', includeParagraphStyles: ['Heading 1'] },
        ],
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_listStyles')!;
      const result = await tool.handler({}, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tocStyles');
      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('My TOC');
    });
  });

  describe('toc_update', () => {
    it('should call executor with generateTOC for a specific story', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { updated: true, storyIndex: 0 },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_update')!;
      const result = await tool.handler({ storyIndex: 0, styleName: 'My TOC' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('generateTOC');
      expect(code).toContain('stories[0]');
      expect(code).toContain('textContainers');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should use first TOC style when styleName not provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { updated: true, storyIndex: 0 },
      });
      const handler = new TocHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'toc_update')!;
      await tool.handler({ storyIndex: 0 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tocStyles[0]');
    });
  });
});
