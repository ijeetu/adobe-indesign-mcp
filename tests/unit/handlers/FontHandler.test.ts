import { describe, it, expect, vi } from 'vitest';
import { FontHandler } from '../../../src/handlers/FontHandler.js';

describe('FontHandler', () => {
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
    it('should have name "font"', () => {
      const handler = new FontHandler(createMockExecutor() as any);
      expect(handler.name).toBe('font');
    });

    it('should expose 5 tools', () => {
      const handler = new FontHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(5);
    });

    it('should export all expected tools', () => {
      const handler = new FontHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('font_list');
      expect(names).toContain('font_find');
      expect(names).toContain('font_change');
      expect(names).toContain('font_glyph_insert');
      expect(names).toContain('font_missing_check');
    });

    it('should have inputSchema as a plain object (not a ZodSchema)', () => {
      const handler = new FontHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('font_list', () => {
    it('should call executor.execute with code containing app.fonts iteration', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: JSON.stringify([
          { fontFamily: 'Arial', fontStyle: 'Regular', postscriptName: 'ArialMT', fontType: 'TrueType' },
        ]),
      });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('app.fonts');
      expect(code).toContain('fontFamily');
      expect(code).toContain('fontStyle');
      expect(code).toContain('postscriptName');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return font list from executor', async () => {
      const mock = createMockExecutor();
      const fonts = [
        { fontFamily: 'Arial', fontStyle: 'Regular', postscriptName: 'ArialMT', fontType: 'TrueType' },
        { fontFamily: 'Times New Roman', fontStyle: 'Bold', postscriptName: 'TimesNewRomanPS-BoldMT', fontType: 'TrueType' },
      ];
      mock.execute.mockResolvedValue({ result: fonts });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].fontFamily).toBe('Arial');
      expect(parsed[1].fontStyle).toBe('Bold');
    });
  });

  describe('font_find', () => {
    it('should call executor.execute with code searching fonts by name', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: JSON.stringify([]) });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_find')!;
      const result = await tool.handler({ query: 'Arial' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('indexOf');
      expect(code).toContain('arial');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return matching fonts', async () => {
      const mock = createMockExecutor();
      const matches = [{ fontFamily: 'Arial', fontStyle: 'Regular', postscriptName: 'ArialMT' }];
      mock.execute.mockResolvedValue({ result: matches });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_find')!;
      const result = await tool.handler({ query: 'Arial' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].fontFamily).toBe('Arial');
    });
  });

  describe('font_change', () => {
    it('should call executor.execute with code to change font', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: JSON.stringify({ font: 'Arial', style: 'Bold', size: 24 }) });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_change')!;
      const result = await tool.handler({ fontName: 'Arial', fontStyle: 'Bold', size: 24 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('appliedFont');
      expect(code).toContain('Arial');
      expect(code).toContain('fontStyle');
      expect(code).toContain('pointSize');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should work with only fontName', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: JSON.stringify({ font: 'Times', style: 'default', size: 'unchanged' }) });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_change')!;
      const result = await tool.handler({ fontName: 'Times' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('appliedFont');
      expect(code).not.toContain('pointSize');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should reject negative size', async () => {
      const mock = createMockExecutor();
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_change')!;
      const result = await tool.handler({ fontName: 'Arial', size: -1 }, {});

      expect(result.isError).toBe(true);
    });
  });

  describe('font_glyph_insert', () => {
    it('should call executor.execute with code containing insertSpecialChar', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: JSON.stringify({ glyphId: 123 }) });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_glyph_insert')!;
      const result = await tool.handler({ glyphId: 123 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('insertSpecialChar');
      expect(code).toContain('123');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should reject negative glyphId', async () => {
      const mock = createMockExecutor();
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_glyph_insert')!;
      const result = await tool.handler({ glyphId: -1 }, {});

      expect(result.isError).toBe(true);
    });
  });

  describe('font_missing_check', () => {
    it('should call executor.execute with code to check missing fonts', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: JSON.stringify({ missing: [], count: 0 }) });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_missing_check')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.fonts');
      expect(code).toContain('isValid');
      expect(code).toContain('missing');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return missing fonts list when fonts are missing', async () => {
      const mock = createMockExecutor();
      const resultData = {
        missing: [{ fontFamily: 'MissingFont', fontStyle: 'Regular' }],
        count: 1,
      };
      mock.execute.mockResolvedValue({ result: resultData });
      const handler = new FontHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'font_missing_check')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.count).toBe(1);
      expect(parsed.missing[0].fontFamily).toBe('MissingFont');
    });
  });
});
