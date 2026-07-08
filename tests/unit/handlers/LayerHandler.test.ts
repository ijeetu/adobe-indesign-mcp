import { describe, it, expect, vi } from 'vitest';
import { LayerHandler } from '../../../src/handlers/LayerHandler.js';

describe('LayerHandler', () => {
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
    it('should have name "layer"', () => {
      const handler = new LayerHandler(createMockExecutor() as any);
      expect(handler.name).toBe('layer');
    });

    it('should expose 5 tools', () => {
      const handler = new LayerHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(5);
    });

    it('should export all expected tools', () => {
      const handler = new LayerHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('layer_create');
      expect(names).toContain('layer_list');
      expect(names).toContain('layer_reorder');
      expect(names).toContain('layer_setProperties');
      expect(names).toContain('layer_delete');
    });

    it('should have inputSchema as a plain object (not a ZodSchema)', () => {
      const handler = new LayerHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('layer_create', () => {
    it('should call executor.execute with ExtendScript code containing layer.add', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'MyLayer', index: 0 } });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_create')!;
      const result = await tool.handler({ name: 'MyLayer', visible: true, locked: false, printable: true, guideLayer: false }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('layers.add');
      expect(code).toContain('MyLayer');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return created layer info from executor result', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'Layer 1', index: 0 } });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_create')!;
      const result = await tool.handler({ name: 'Layer 1' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.name).toBe('Layer 1');
      expect(parsed.index).toBe(0);
    });
  });

  describe('layer_list', () => {
    it('should call executor.execute with code containing layers iteration', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [{ name: 'Layer 1', index: 0, visible: true, locked: false, printable: true }],
      });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('layers');
      expect(code).toContain('JSON.stringify');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return layer list from executor', async () => {
      const mock = createMockExecutor();
      const layers = [
        { name: 'Layer 1', index: 0, visible: true, locked: false, printable: true },
        { name: 'Layer 2', index: 1, visible: true, locked: true, printable: true },
      ];
      mock.execute.mockResolvedValue({ result: layers });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Layer 1');
      expect(parsed[1].locked).toBe(true);
    });
  });

  describe('layer_reorder', () => {
    it('should pass layerIndex and newIndex to ExtendScript', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { layerIndex: 1, newIndex: 0 } });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_reorder')!;
      const result = await tool.handler({ layerIndex: 1, newIndex: 0 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('layerIndex: 1');
      expect(code).toContain('newIndex: 0');
      expect(code).toContain('layers[1]');
      expect(code).toContain('layers[0]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('layer_setProperties', () => {
    it('should set visible and locked properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, visible: false, locked: true } });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_setProperties')!;
      const result = await tool.handler({ layerIndex: 0, visible: false, locked: true }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('visible = false');
      expect(code).toContain('locked = true');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should only include setStr for provided properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, visible: true, locked: false } });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_setProperties')!;
      await tool.handler({ layerIndex: 0, visible: true }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('visible = true');
      // Only visible should be in the setStr (assignment lines)
      const lines = code.split('\n').map((l) => l.trim());
      const assignmentLines = lines.filter((l) => l.startsWith('layer.'));
      expect(assignmentLines).toHaveLength(1);
      expect(assignmentLines[0]).toBe('layer.visible = true;');
    });

    it('should handle layer not found via error middleware', async () => {
      const mock = createMockExecutor();
      mock.execute.mockRejectedValue(new Error('Layer not found'));
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_setProperties')!;
      const result = await tool.handler({ layerIndex: 99, visible: false }, {});

      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('layer_delete', () => {
    it('should call executor with remove() code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'deleted' });
      const handler = new LayerHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'layer_delete')!;
      const result = await tool.handler({ layerIndex: 0 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('remove()');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
