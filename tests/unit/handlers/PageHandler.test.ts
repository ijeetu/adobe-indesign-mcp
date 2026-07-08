import { describe, it, expect, vi } from 'vitest';
import { PageHandler } from '../../../src/handlers/PageHandler.js';

describe('PageHandler', () => {
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
    it('should have name "page"', () => {
      const handler = new PageHandler(createMockExecutor() as any);
      expect(handler.name).toBe('page');
    });

    it('should expose 7 tools', () => {
      const handler = new PageHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(7);
    });

    it('should export all expected tools', () => {
      const handler = new PageHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('page_add');
      expect(names).toContain('page_delete');
      expect(names).toContain('page_duplicate');
      expect(names).toContain('page_move');
      expect(names).toContain('page_getInfo');
      expect(names).toContain('page_listAll');
      expect(names).toContain('page_applyMaster');
    });

    it('should have inputSchema as a plain object', () => {
      const handler = new PageHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('page_add', () => {
    it('should call executor.execute with code containing pages.add', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 3, name: '4' } });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_add')!;
      const result = await tool.handler({ position: 'atEnd' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages.add');
      expect(code).toContain('LocationOptions.atEnd');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should pass referencePage when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 1, name: '2' } });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_add')!;
      await tool.handler({ position: 'after', referencePage: 0 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.pages[0]');
      expect(code).toContain('LocationOptions.after');
    });

    it('should return page info from executor result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 1, name: '2' } });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_add')!;
      const result = await tool.handler({ position: 'atBeginning' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.index).toBe(1);
      expect(parsed.name).toBe('2');
    });
  });

  describe('page_delete', () => {
    it('should call executor with remove() code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'deleted' });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_delete')!;
      const result = await tool.handler({ index: 2 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[2].remove()');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle index 0', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'deleted' });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_delete')!;
      await tool.handler({ index: 0 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[0].remove()');
    });
  });

  describe('page_duplicate', () => {
    it('should call executor with duplicate() code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 3, name: '4' } });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_duplicate')!;
      const result = await tool.handler({ index: 1 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('duplicate()');
      expect(code).toContain('pages[1]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return duplicated page info', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 4, name: '5' } });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_duplicate')!;
      const result = await tool.handler({ index: 2 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.index).toBe(4);
      expect(parsed.name).toBe('5');
    });
  });

  describe('page_move', () => {
    it('should pass index and toIndex to ExtendScript', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'moved' });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_move')!;
      const result = await tool.handler({ index: 2, toIndex: 0 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[2].move');
      expect(code).toContain('LocationOptions.atBeginning');
      expect(code).toContain('pages[0]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('page_getInfo', () => {
    it('should call executor with code reading page properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { index: 0, name: '1', bounds: { top: 0, left: 0, bottom: 297, right: 210 }, side: 'rightHand', masterSpread: 'A-Master', label: '' },
      });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_getInfo')!;
      const result = await tool.handler({ index: 0 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('page.bounds');
      expect(code).toContain('page.side');
      expect(code).toContain('page.appliedMaster');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return page info from executor', async () => {
      const mock = createMockExecutor();
      const info = { index: 1, name: '2', bounds: { top: 0, left: 210, bottom: 297, right: 420 }, side: 'leftHand', masterSpread: null, label: '' };
      mock.execute.mockResolvedValue({ result: info });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_getInfo')!;
      const result = await tool.handler({ index: 1 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.index).toBe(1);
      expect(parsed.side).toBe('leftHand');
      expect(parsed.masterSpread).toBeNull();
    });
  });

  describe('page_listAll', () => {
    it('should call executor with code iterating all pages', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: '1', side: 'rightHand', masterSpread: 'A-Master' },
          { index: 1, name: '2', side: 'leftHand', masterSpread: 'A-Master' },
        ],
      });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_listAll')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages.length');
      expect(code).toContain('JSON.stringify(result)');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return list of all pages from executor', async () => {
      const mock = createMockExecutor();
      const pages = [
        { index: 0, name: '1', side: 'rightHand', masterSpread: 'A-Master' },
        { index: 1, name: '2', side: 'leftHand', masterSpread: 'A-Master' },
        { index: 2, name: '3', side: 'rightHand', masterSpread: 'None' },
      ];
      mock.execute.mockResolvedValue({ result: pages });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_listAll')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(3);
      expect(parsed[2].masterSpread).toBe('None');
    });
  });

  describe('page_applyMaster', () => {
    it('should apply master spread to page', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'applied' });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_applyMaster')!;
      const result = await tool.handler({ pageIndex: 0, masterName: 'B-Master' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('masterSpreads.item("B-Master")');
      expect(code).toContain('appliedMaster = master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should escape master name with special characters', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'applied' });
      const handler = new PageHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'page_applyMaster')!;
      await tool.handler({ pageIndex: 1, masterName: 'Test-Master' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('masterSpreads.item("Test-Master")');
    });
  });
});
