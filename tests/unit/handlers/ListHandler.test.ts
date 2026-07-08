import { describe, it, expect, vi } from 'vitest';
import { ListHandler } from '../../../src/handlers/ListHandler.js';

describe('ListHandler', () => {
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
    it('should have name "list"', () => {
      const handler = new ListHandler(createMockExecutor() as any);
      expect(handler.name).toBe('list');
    });

    it('should expose 6 tools', () => {
      const handler = new ListHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(6);
    });

    it('should export all expected tools', () => {
      const handler = new ListHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('list_define');
      expect(names).toContain('list_applyToParagraph');
      expect(names).toContain('list_applyToSelection');
      expect(names).toContain('list_removeFromParagraph');
      expect(names).toContain('list_list');
      expect(names).toContain('list_restartNumbering');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new ListHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('list_define', () => {
    it('should call executor with define list ExtendScript code for numbered list', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'defineList', name: 'MyList', type: 'numbered' } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_define')!;
      const result = await tool.handler({
        name: 'MyList',
        type: 'numbered',
        continueNumbering: true,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.lists.add({name: "MyList", listType: ListType.NUMBERED_LIST})');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should call executor with define list code for bulleted list', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'defineList', name: 'Bullets', type: 'bulleted' } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_define')!;
      const result = await tool.handler({
        name: 'Bullets',
        type: 'bulleted',
        continueNumbering: true,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('ListType.BULLET_LIST');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return list result with define list properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'defineList', name: 'MyList', type: 'numbered' } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_define')!;
      const result = await tool.handler({
        name: 'MyList',
        type: 'numbered',
        continueNumbering: true,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ action: 'defineList', name: 'MyList', type: 'numbered' });
    });
  });

  describe('list_applyToParagraph', () => {
    it('should call executor with apply list to paragraph ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'applyList', name: 'MyList', level: 2 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_applyToParagraph')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
        listName: 'MyList',
        level: 2,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.pages[0].textFrames[1].paragraphs[2]');
      expect(code).toContain('doc.lists.item("MyList")');
      expect(code).toContain('paragraph.appliedList = list');
      expect(code).toContain('paragraph.listLevel = 2');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should use default level 1 when level is omitted', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'applyList', name: 'MyList', level: 1 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_applyToParagraph')!;
      await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
        listName: 'MyList',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('paragraph.listLevel = 1');
    });

    it('should return apply list result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'applyList', name: 'MyList', level: 2 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_applyToParagraph')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
        listName: 'MyList',
        level: 2,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ action: 'applyList', name: 'MyList' });
    });
  });

  describe('list_applyToSelection', () => {
    it('should call executor with apply list to selection ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'applyListToSelection', name: 'MyList', level: 1 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_applyToSelection')!;
      const result = await tool.handler({
        listName: 'MyList',
        level: 1,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('app.selection.length');
      expect(code).toContain('app.selection[0]');
      expect(code).toContain('doc.lists.item("MyList")');
      expect(code).toContain('paragraphs[i].appliedList = list');
      expect(code).toContain('paragraphs[i].listLevel = 1');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return apply to selection result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'applyListToSelection', name: 'MyList', level: 1 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_applyToSelection')!;
      const result = await tool.handler({
        listName: 'MyList',
        level: 1,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ action: 'applyListToSelection', name: 'MyList' });
    });
  });

  describe('list_removeFromParagraph', () => {
    it('should call executor with remove list ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'removeList', pageIndex: 0, frameIndex: 1, paragraphIndex: 2 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_removeFromParagraph')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.pages[0].textFrames[1].paragraphs[2]');
      expect(code).toContain('NothingEnum.NOTHING');
      expect(code).toContain('paragraph.appliedList = NothingEnum.NOTHING');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return remove list result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'removeList', pageIndex: 0, frameIndex: 1, paragraphIndex: 2 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_removeFromParagraph')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ action: 'removeList' });
    });
  });

  describe('list_list', () => {
    it('should call executor with list all lists ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: [] });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.lists');
      expect(code).toContain('lists.length');
      expect(code).toContain('lists[i].name');
      expect(code).toContain('lists[i].listType');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return list of defined lists', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { name: 'Bullets', type: 'ListType.BULLET_LIST' },
          { name: 'Numbers', type: 'ListType.NUMBERED_LIST' },
        ],
      });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({ name: 'Bullets' });
      expect(parsed[1]).toMatchObject({ name: 'Numbers' });
    });
  });

  describe('list_restartNumbering', () => {
    it('should call executor with restart numbering ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'restartNumbering', pageIndex: 0, frameIndex: 1, paragraphIndex: 2, startNumber: 5 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_restartNumbering')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
        startNumber: 5,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.pages[0].textFrames[1].paragraphs[2]');
      expect(code).toContain('paragraph.numberingRestart = true');
      expect(code).toContain('paragraph.numberingStartAt = 5');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return restart numbering result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { action: 'restartNumbering', pageIndex: 0, frameIndex: 1, paragraphIndex: 2, startNumber: 5 } });
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_restartNumbering')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 1,
        paragraphIndex: 2,
        startNumber: 5,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ action: 'restartNumbering', startNumber: 5 });
    });
  });

  describe('error handling', () => {
    it('should return isError when executor rejects', async () => {
      const mock = createMockExecutor();
      mock.execute.mockRejectedValue(new Error('Failed to apply list'));
      const handler = new ListHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'list_define')!;
      const result = await tool.handler({ name: 'Test', type: 'numbered' }, {});

      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
