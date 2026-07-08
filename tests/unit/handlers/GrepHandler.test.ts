import { describe, it, expect, vi } from 'vitest';
import { GrepHandler } from '../../../src/handlers/GrepHandler.js';

describe('GrepHandler', () => {
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
    it('should have name "grep"', () => {
      const handler = new GrepHandler(createMockExecutor() as any);
      expect(handler.name).toBe('grep');
    });

    it('should expose 4 tools', () => {
      const handler = new GrepHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new GrepHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('grep_find');
      expect(names).toContain('grep_replace');
      expect(names).toContain('grep_findFormat');
      expect(names).toContain('grep_replaceFormat');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new GrepHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('grep_find', () => {
    it('should call executor with findGrep code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { totalFound: 3, matches: [{ index: 0, text: '123', storyIndex: 0 }] },
      });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_find')!;
      const result = await tool.handler({
        grepWhat: '\\d+',
        scope: 'document',
        includeFootnotes: true,
        includeMasterPages: true,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('findGrepPreferences.findWhat = "\\\\d+"');
      expect(code).toContain('findGrepPreferences.includeFootnotes = true');
      expect(code).toContain('findGrepPreferences.includeMasterPages = true');
      expect(code).toContain('findGrep()');
      const nothingCount = (code.match(/NothingEnum\.nothing/g) || []).length;
      expect(nothingCount).toBe(2);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return find results from executor', async () => {
      const mock = createMockExecutor();
      const data = {
        totalFound: 3,
        matches: [
          { index: 0, text: '123', storyIndex: 0 },
          { index: 1, text: '456', storyIndex: 0 },
        ],
      };
      mock.execute.mockResolvedValue({ result: data });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_find')!;
      const result = await tool.handler({ grepWhat: '\\d+' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.totalFound).toBe(3);
      expect(parsed.matches).toHaveLength(2);
      expect(parsed.matches[0].text).toBe('123');
    });

    it('should escape special characters in grepWhat', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { totalFound: 0, matches: [] } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_find')!;
      await tool.handler({ grepWhat: '\\(test\\)' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      // Each \ in input becomes \\ after escape, so \(test\) -> \\(test\\)
      expect(code).toContain('"\\\\(test\\\\)"');
    });
  });

  describe('grep_replace', () => {
    it('should call executor with changeGrep code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { occurrencesChanged: 2 } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_replace')!;
      const result = await tool.handler({
        grepWhat: 'foo',
        replaceWith: 'bar',
        scope: 'document',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('findGrepPreferences.findWhat = "foo"');
      expect(code).toContain('changeGrepPreferences.changeTo = "bar"');
      expect(code).toContain('changeGrep()');
      const nothingCount = (code.match(/NothingEnum\.nothing/g) || []).length;
      expect(nothingCount).toBe(4);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return occurrence count from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { occurrencesChanged: 5 } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_replace')!;
      const result = await tool.handler({
        grepWhat: 'old',
        replaceWith: 'new',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.occurrencesChanged).toBe(5);
    });
  });

  describe('grep_findFormat', () => {
    it('should call executor with findText and format lines', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { totalFound: 1, matches: [{ index: 0, text: 'hello', storyIndex: 0 }] },
      });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_findFormat')!;
      const result = await tool.handler({
        findWhat: 'hello',
        format: { font: 'Arial', bold: true, color: 'Red' },
        scope: 'document',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('findTextPreferences.findWhat = "hello"');
      expect(code).toContain('findTextPreferences.appliedFont = "Arial"');
      expect(code).toContain('findTextPreferences.fontStyle = "Bold"');
      expect(code).toContain('findTextPreferences.fillColor = doc.swatches.item("Red")');
      expect(code).toContain('findText()');
      const nothingCount = (code.match(/NothingEnum\.nothing/g) || []).length;
      expect(nothingCount).toBe(2);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return find results from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { totalFound: 2, matches: [{ index: 0, text: 'hello', storyIndex: 0 }, { index: 1, text: 'hello again', storyIndex: 1 }] },
      });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_findFormat')!;
      const result = await tool.handler({ findWhat: 'hello' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.totalFound).toBe(2);
      expect(parsed.matches).toHaveLength(2);
    });
  });

  describe('grep_replaceFormat', () => {
    it('should call executor with changeText and format lines', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { occurrencesChanged: 3 } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_replaceFormat')!;
      const result = await tool.handler({
        findWhat: 'hello',
        replaceWith: 'world',
        format: { color: 'Blue', allCaps: true },
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('findTextPreferences.findWhat = "hello"');
      expect(code).toContain('changeTextPreferences.changeTo = "world"');
      expect(code).toContain('changeTextPreferences.fillColor = doc.swatches.item("Blue")');
      expect(code).toContain('changeTextPreferences.capitalization = Capitalization.ALL_CAPS');
      expect(code).toContain('changeText()');
      const nothingCount = (code.match(/NothingEnum\.nothing/g) || []).length;
      expect(nothingCount).toBe(4);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should work without format param (plain find/replace)', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { occurrencesChanged: 1 } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_replaceFormat')!;
      const result = await tool.handler({
        findWhat: 'foo',
        replaceWith: 'bar',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('findTextPreferences.findWhat = "foo"');
      expect(code).toContain('changeTextPreferences.changeTo = "bar"');
      expect(code).toContain('changeText()');
      expect(code).not.toContain('appliedFont');
      expect(code).not.toContain('fillColor');
      expect(code).not.toContain('capitalization');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return occurrence count from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { occurrencesChanged: 7 } });
      const handler = new GrepHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'grep_replaceFormat')!;
      const result = await tool.handler({
        findWhat: 'test',
        replaceWith: 'done',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.occurrencesChanged).toBe(7);
    });
  });
});
