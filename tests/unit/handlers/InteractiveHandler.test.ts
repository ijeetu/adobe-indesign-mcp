import { describe, it, expect, vi } from 'vitest';
import { InteractiveHandler } from '../../../src/handlers/InteractiveHandler.js';

describe('InteractiveHandler', () => {
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
    it('should have name "interactive"', () => {
      const handler = new InteractiveHandler(createMockExecutor() as any);
      expect(handler.name).toBe('interactive');
    });

    it('should expose 5 tools', () => {
      const handler = new InteractiveHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(5);
    });

    it('should export all expected tools', () => {
      const handler = new InteractiveHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('interactive_listHyperlinks');
      expect(names).toContain('interactive_addHyperlink');
      expect(names).toContain('interactive_deleteHyperlink');
      expect(names).toContain('interactive_listButtons');
      expect(names).toContain('interactive_listAnchors');
    });

    it('should have inputSchema as plain object', () => {
      const handler = new InteractiveHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
      }
    });
  });

  describe('interactive_listHyperlinks', () => {
    it('should return list of hyperlinks', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: 'Link 1', url: 'https://example.com' },
        ],
      });
      const handler = new InteractiveHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'interactive_listHyperlinks')!;
      const result = await tool.handler({}, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('hyperlinks');
      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].url).toBe('https://example.com');
    });
  });

  describe('interactive_addHyperlink', () => {
    it('should call executor with hyperlinkURLDestinations.add', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: { name: 'MyLink', url: 'https://example.com' },
      });
      const handler = new InteractiveHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'interactive_addHyperlink')!;
      const result = await tool.handler({
        name: 'MyLink',
        url: 'https://example.com',
        pageIndex: 0,
        itemIndex: 1,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('hyperlinkURLDestinations.add');
      expect(code).toContain('MyLink');
      expect(code).toContain('https://example.com');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('interactive_deleteHyperlink', () => {
    it('should call executor with remove() on hyperlink', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'deleted' });
      const handler = new InteractiveHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'interactive_deleteHyperlink')!;
      const result = await tool.handler({ index: 0 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('remove()');
      expect(code).toContain('hyperlinks[0]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('interactive_listButtons', () => {
    it('should return list of buttons', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: 'Button 1', id: 1, visible: true },
        ],
      });
      const handler = new InteractiveHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'interactive_listButtons')!;
      const result = await tool.handler({}, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('buttons');
      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed[0].name).toBe('Button 1');
    });
  });

  describe('interactive_listAnchors', () => {
    it('should return list of cross-reference anchors', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, name: 'Anchor 1' },
        ],
      });
      const handler = new InteractiveHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'interactive_listAnchors')!;
      const result = await tool.handler({}, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('crossReferenceSources');
      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed[0].name).toBe('Anchor 1');
    });
  });
});
