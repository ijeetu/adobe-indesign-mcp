import { describe, it, expect, vi } from 'vitest';
import { MasterHandler } from '../../../src/handlers/MasterHandler.js';

describe('MasterHandler', () => {
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
    it('should have name "master"', () => {
      const handler = new MasterHandler(createMockExecutor() as any);
      expect(handler.name).toBe('master');
    });

    it('should expose 6 tools', () => {
      const handler = new MasterHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(6);
    });

    it('should export all expected tools', () => {
      const handler = new MasterHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('master_create');
      expect(names).toContain('master_duplicate');
      expect(names).toContain('master_apply');
      expect(names).toContain('master_delete');
      expect(names).toContain('master_list');
      expect(names).toContain('master_getPages');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new MasterHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('master_create', () => {
    it('should call executor.execute with masterSpreads.add', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'A-Master', pageCount: 2 } });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_create')!;
      const result = await tool.handler({ name: 'A-Master', pageCount: 2 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('masterSpreads.add');
      expect(code).toContain('A-Master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('master_duplicate', () => {
    it('should call executor with duplicate() and new name', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'B-Master', pageCount: 1 } });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_duplicate')!;
      const result = await tool.handler({ name: 'A-Master', newName: 'B-Master' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('duplicate()');
      expect(code).toContain('B-Master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle invalid source master via error middleware', async () => {
      const mock = createMockExecutor();
      mock.execute.mockRejectedValue(new Error("Master spread 'X-Master' not found"));
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_duplicate')!;
      const result = await tool.handler({ name: 'X-Master', newName: 'Y-Master' }, {});

      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('master_apply', () => {
    it('should pass pageIndex and masterName to ExtendScript', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'applied' });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_apply')!;
      const result = await tool.handler({ pageIndex: 0, masterName: 'A-Master' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[0]');
      expect(code).toContain('appliedMaster');
      expect(code).toContain('A-Master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('master_delete', () => {
    it('should call executor with remove() on master spread', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'deleted' });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_delete')!;
      const result = await tool.handler({ name: 'A-Master' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('remove()');
      expect(code).toContain('A-Master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('master_list', () => {
    it('should return array of master spreads', async () => {
      const mock = createMockExecutor();
      const masters = [
        { name: 'A-Master', pageCount: 2 },
        { name: 'B-Master', pageCount: 1 },
      ];
      mock.execute.mockResolvedValue({ result: masters });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('A-Master');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('master_getPages', () => {
    it('should return pages of a master spread', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: '1', bounds: [0, 0, 100, 50] },
          { index: 1, name: '2', bounds: [0, 50, 100, 100] },
        ],
      });
      const handler = new MasterHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'master_getPages')!;
      const result = await tool.handler({ name: 'A-Master' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('1');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
