import { describe, it, expect, vi } from 'vitest';
import { XrefHandler } from '../../../src/handlers/XrefHandler.js';

describe('XrefHandler', () => {
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
    it('should have name "xref"', () => {
      const handler = new XrefHandler(createMockExecutor() as any);
      expect(handler.name).toBe('xref');
    });

    it('should expose 3 tools', () => {
      const handler = new XrefHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(3);
    });

    it('should export all expected tools', () => {
      const handler = new XrefHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('xref_create');
      expect(names).toContain('xref_list');
      expect(names).toContain('xref_updateFormat');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new XrefHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('xref_create', () => {
    it('should call executor with crossReferenceSources.add() and escaped name', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { created: true, name: 'See chapter 1' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_create')!;
      const result = await tool.handler({ sourceText: 'See chapter 1', targetType: 'paragraph', targetName: 'Chapter 1' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('crossReferenceSources.add()');
      expect(code).toContain('xref.name = "See chapter 1"');
      expect(code).toContain('crossReferenceFormats.item("Full Paragraph & Page Number")');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should use provided appliedFormat when specified', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { created: true, name: 'Ref A' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_create')!;
      await tool.handler({ sourceText: 'Ref A', targetType: 'paragraph', targetName: 'Intro', appliedFormat: 'Paragraph Number Only' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('crossReferenceFormats.item("Paragraph Number Only")');
    });

    it('should escape special characters in sourceText', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { created: true, name: 'See "Chapter 1"' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_create')!;
      await tool.handler({ sourceText: 'See "Chapter 1"', targetType: 'paragraph', targetName: 'Chapter 1' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('\\"');
    });

    it('should return created info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { created: true, name: 'See chapter 1' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_create')!;
      const result = await tool.handler({ sourceText: 'See chapter 1', targetType: 'paragraph', targetName: 'Chapter 1' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.created).toBe(true);
      expect(parsed.name).toBe('See chapter 1');
    });
  });

  describe('xref_list', () => {
    it('should call executor with crossReferenceSources loop', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: 'See chapter 1', source: 'See chapter 1', format: 'Full Paragraph & Page Number' },
        ],
      });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('crossReferenceSources.length');
      expect(code).toContain('crossReferenceSources[i]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return list of cross-references from executor', async () => {
      const mock = createMockExecutor();
      const refs = [
        { index: 0, name: 'See chapter 1', source: 'See chapter 1', format: 'Full Paragraph & Page Number' },
        { index: 1, name: 'See figure 2', source: 'See figure 2', format: 'Page Number Only' },
      ];
      mock.execute.mockResolvedValue({ result: refs });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].index).toBe(0);
      expect(parsed[0].name).toBe('See chapter 1');
      expect(parsed[0].source).toBe('See chapter 1');
      expect(parsed[0].format).toBe('Full Paragraph & Page Number');
      expect(parsed[1].name).toBe('See figure 2');
    });
  });

  describe('xref_updateFormat', () => {
    it('should call executor with crossReferenceSources[index].appliedFormat', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true, index: 0, format: 'Paragraph Number Only' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_updateFormat')!;
      const result = await tool.handler({ index: 0, appliedFormat: 'Paragraph Number Only' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('crossReferenceSources[0]');
      expect(code).toContain('appliedFormat = doc.crossReferenceFormats.item("Paragraph Number Only")');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should escape special characters in appliedFormat', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true, index: 0, format: '' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_updateFormat')!;
      await tool.handler({ index: 0, appliedFormat: 'Format with "quotes"' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('\\"');
    });

    it('should return updated info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true, index: 1, format: 'Paragraph Number Only' } });
      const handler = new XrefHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'xref_updateFormat')!;
      const result = await tool.handler({ index: 1, appliedFormat: 'Paragraph Number Only' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.updated).toBe(true);
      expect(parsed.index).toBe(1);
      expect(parsed.format).toBe('Paragraph Number Only');
    });
  });
});
