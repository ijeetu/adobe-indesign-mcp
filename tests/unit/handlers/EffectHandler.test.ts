import { describe, it, expect, vi } from 'vitest';
import { EffectHandler } from '../../../src/handlers/EffectHandler.js';

describe('EffectHandler', () => {
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
    it('should have name "effect"', () => {
      const handler = new EffectHandler(createMockExecutor() as any);
      expect(handler.name).toBe('effect');
    });

    it('should expose 4 tools', () => {
      const handler = new EffectHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new EffectHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('effect_applyDropShadow');
      expect(names).toContain('effect_applyFeather');
      expect(names).toContain('effect_applyTransparency');
      expect(names).toContain('effect_applyGradientFeather');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new EffectHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('effect_applyDropShadow', () => {
    it('should call executor with drop shadow ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'dropShadow', distance: 10, angle: 90 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyDropShadow')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        distance: 10,
        angle: 90,
        blur: 3,
        opacity: 50,
        color: 'Red',
        mode: 'screen',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('transparencySettings.dropShadowSettings');
      expect(code).toContain('shadow.mode = true');
      expect(code).toContain('shadow.distance = 10');
      expect(code).toContain('shadow.angle = 90');
      expect(code).toContain('shadow.effectColor');
      expect(code).toContain('BlurMode.SCREEN');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return effect result with drop shadow properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'dropShadow', distance: 10, angle: 90 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyDropShadow')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        distance: 10,
        angle: 90,
        blur: 3,
        opacity: 50,
        color: 'Red',
        mode: 'screen',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ effect: 'dropShadow', distance: 10, angle: 90 });
    });
  });

  describe('effect_applyFeather', () => {
    it('should call executor with feather ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'feather', type: 'directional', width: 8 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyFeather')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        type: 'directional',
        width: 8,
        chamferWidth: 2,
        noise: 10,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('FeatherMode.DIRECTIONAL_FEATHER');
      expect(code).toContain('featherWidth = 8');
      expect(code).toContain('featherChamferWidth = 2');
      expect(code).toContain('featherNoise = 10');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return effect result with feather properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'feather', type: 'directional', width: 8 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyFeather')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        type: 'directional',
        width: 8,
        chamferWidth: 2,
        noise: 10,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ effect: 'feather' });
    });
  });

  describe('effect_applyTransparency', () => {
    it('should call executor with transparency ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'transparency', opacity: 60, blendMode: 'multiply' } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyTransparency')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        opacity: 60,
        blendMode: 'multiply',
        knockoutGroup: true,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('BlendMode.MULTIPLY');
      expect(code).toContain('opacity = 60');
      expect(code).toContain('knockoutGroup = true');
      expect(code).toContain('isolatedBlending = false');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return effect result with transparency properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'transparency', opacity: 60, blendMode: 'multiply' } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyTransparency')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        opacity: 60,
        blendMode: 'multiply',
        knockoutGroup: true,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ effect: 'transparency' });
    });
  });

  describe('effect_applyGradientFeather', () => {
    it('should call executor with gradient feather ExtendScript code', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'gradientFeather', type: 'radial', angle: 45 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyGradientFeather')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        type: 'radial',
        angle: 45,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('FeatherMode.GRADIENT_FEATHER');
      expect(code).toContain('GradientType.RADIAL');
      expect(code).toContain('angle = 45');
      expect(code).toContain('startPoint = [0, 0]');
      expect(code).toContain('endPoint = [100, 0]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return effect result with gradient feather properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { effect: 'gradientFeather', type: 'radial', angle: 45 } });
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyGradientFeather')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 1,
        type: 'radial',
        angle: 45,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toMatchObject({ effect: 'gradientFeather' });
    });
  });

  describe('error handling', () => {
    it('should return isError when executor rejects', async () => {
      const mock = createMockExecutor();
      mock.execute.mockRejectedValue(new Error('Failed to apply effect'));
      const handler = new EffectHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'effect_applyDropShadow')!;
      const result = await tool.handler({ pageIndex: 0, itemIndex: 0 }, {});

      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
