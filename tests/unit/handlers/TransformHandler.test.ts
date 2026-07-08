import { describe, it, expect, vi } from 'vitest';
import { TransformHandler } from '../../../src/handlers/TransformHandler.js';

describe('TransformHandler', () => {
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
    it('should have name "transform"', () => {
      const handler = new TransformHandler(createMockExecutor() as any);
      expect(handler.name).toBe('transform');
    });

    it('should expose 5 tools', () => {
      const handler = new TransformHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(5);
    });

    it('should export all expected tools', () => {
      const handler = new TransformHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('transform_align');
      expect(names).toContain('transform_distribute');
      expect(names).toContain('transform_rotate');
      expect(names).toContain('transform_scale');
      expect(names).toContain('transform_flip');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new TransformHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('transform_align', () => {
    it('should call executor with align ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { aligned: true, mode: 'center', count: 2 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_align')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndices: [0, 1],
        alignMode: 'center',
        relativeTo: 'page',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('AlignOptions.HORIZONTAL_CENTERS');
      expect(code).toContain('AlignDistributeBounds.ALIGN_DISTRIBUTE_TO_PAGE');
      expect(code).toContain('items.push(pageItems[0])');
      expect(code).toContain('items.push(pageItems[1])');
      expect(code).toContain('items[i].select(true)');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should use ALIGN_DISTRIBUTE_TO_MARGINS when relativeTo is margins', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { aligned: true, mode: 'left', count: 1 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_align')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndices: [0],
        alignMode: 'left',
        relativeTo: 'margins',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('AlignDistributeBounds.ALIGN_DISTRIBUTE_TO_MARGINS');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return align result from executor', async () => {
      const mock = createMockExecutor();
      const response = { aligned: true, mode: 'center', count: 2 };
      mock.execute.mockResolvedValue({ result: response });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_align')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndices: [0, 1],
        alignMode: 'center',
        relativeTo: 'page',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ aligned: true, mode: 'center', count: 2 });
    });
  });

  describe('transform_distribute', () => {
    it('should call executor with distribute ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { distributed: true, mode: 'horizontalSpace', count: 3 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_distribute')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndices: [0, 1, 2],
        distributeMode: 'horizontalSpace',
        bounds: 'page',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('DistributeOptions.DISTRIBUTE_HORIZONTAL_SPACE');
      expect(code).toContain('AlignDistributeBounds.ALIGN_DISTRIBUTE_TO_PAGE');
      expect(code).toContain('pageItems[0].select(true)');
      expect(code).toContain('pageItems[1].select(true)');
      expect(code).toContain('pageItems[2].select(true)');

      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return distribute result from executor', async () => {
      const mock = createMockExecutor();
      const response = { distributed: true, mode: 'horizontalSpace', count: 3 };
      mock.execute.mockResolvedValue({ result: response });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_distribute')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndices: [0, 1, 2],
        distributeMode: 'horizontalSpace',
        bounds: 'page',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ distributed: true, mode: 'horizontalSpace', count: 3 });
    });
  });

  describe('transform_rotate', () => {
    it('should call executor with rotate ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { rotated: true, angle: 45 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_rotate')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        angle: 45,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.pages[0].allPageItems[0]');
      expect(code).toContain('rotate((45 * -1))');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include layer assignment when layerIndex is provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { rotated: true, angle: 90 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_rotate')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        angle: 90,
        layerIndex: 1,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('item.itemLayer = doc.layers[1]');
      expect(code).toContain('rotate((90 * -1))');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return rotate result from executor', async () => {
      const mock = createMockExecutor();
      const response = { rotated: true, angle: 45 };
      mock.execute.mockResolvedValue({ result: response });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_rotate')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        angle: 45,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ rotated: true, angle: 45 });
    });
  });

  describe('transform_scale', () => {
    it('should call executor with scale ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { scaled: true, scaleX: 150, scaleY: 75 } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_scale')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        scaleX: 150,
        scaleY: 75,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('item.scale(150, 75)');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return scale result from executor', async () => {
      const mock = createMockExecutor();
      const response = { scaled: true, scaleX: 150, scaleY: 75 };
      mock.execute.mockResolvedValue({ result: response });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_scale')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        scaleX: 150,
        scaleY: 75,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ scaled: true, scaleX: 150, scaleY: 75 });
    });
  });

  describe('transform_flip', () => {
    it('should call executor with flipItem Flip.HORIZONTAL for horizontal axis', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { flipped: true, axis: 'horizontal' } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_flip')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        axis: 'horizontal',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('flipItem(Flip.HORIZONTAL)');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should call executor with flipItem Flip.VERTICAL for vertical axis', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { flipped: true, axis: 'vertical' } });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_flip')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        axis: 'vertical',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('flipItem(Flip.VERTICAL)');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return flip result from executor', async () => {
      const mock = createMockExecutor();
      const response = { flipped: true, axis: 'horizontal' };
      mock.execute.mockResolvedValue({ result: response });
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_flip')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        axis: 'horizontal',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ flipped: true, axis: 'horizontal' });
    });
  });

  describe('error handling', () => {
    it('should return isError when executor rejects', async () => {
      const mock = createMockExecutor();
      mock.execute.mockRejectedValue(new Error('Transform operation failed'));
      const handler = new TransformHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'transform_align')!;
      const result = await tool.handler({ pageIndex: 0, itemIndices: [0], alignMode: 'center' }, {});

      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
