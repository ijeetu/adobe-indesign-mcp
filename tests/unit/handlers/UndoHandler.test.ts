import { describe, it, expect, vi } from 'vitest';
import { UndoHandler } from '../../../src/handlers/UndoHandler.js';

describe('UndoHandler', () => {
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
    it('should have name "undo"', () => {
      const handler = new UndoHandler(createMockExecutor() as any);
      expect(handler.name).toBe('undo');
    });

    it('should expose 5 tools', () => {
      const handler = new UndoHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(5);
    });

    it('should export all expected tools', () => {
      const handler = new UndoHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('undo');
      expect(names).toContain('redo');
      expect(names).toContain('undo_history');
    });

    it('should have inputSchema as a plain object (not a ZodSchema)', () => {
      const handler = new UndoHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('undo', () => {
    it('should call executor.execute with ExtendScript code containing undo()', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'undone' });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'undo')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('undo()');
      expect(code).toContain('undoable');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return result from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'undone' });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'undo')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      expect(text.text).toBe('"undone"');
    });
  });

  describe('redo', () => {
    it('should call executor.execute with code containing redo()', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'redone' });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'redo')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('redo()');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return result from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'redone' });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'redo')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      expect(text.text).toBe('"redone"');
    });
  });

  describe('undo_history', () => {
    it('should call executor.execute with code containing undoable and redoable properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { undoable: true, redoable: false } });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'undo_history')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('undoable');
      expect(code).toContain('redoable');
      expect(code).toContain('JSON.stringify');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return parsed undo/redo state', async () => {
      const mock = createMockExecutor();
      const state = { undoable: true, redoable: false };
      mock.execute.mockResolvedValue({ result: state });
      const handler = new UndoHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'undo_history')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.undoable).toBe(true);
      expect(parsed.redoable).toBe(false);
    });
  });
});
