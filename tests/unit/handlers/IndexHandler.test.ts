import { describe, it, expect, vi } from 'vitest';
import { IndexHandler } from '../../../src/handlers/IndexHandler.js';

describe('IndexHandler', () => {
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
    it('should have name "index"', () => {
      const handler = new IndexHandler(createMockExecutor() as any);
      expect(handler.name).toBe('index');
    });

    it('should expose 4 tools', () => {
      const handler = new IndexHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new IndexHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('index_addEntry');
      expect(names).toContain('index_generate');
      expect(names).toContain('index_listTopics');
      expect(names).toContain('index_createTopic');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new IndexHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('index_addEntry', () => {
    it('should call executor with code adding an index entry', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { topic: 'Apple', created: true } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_addEntry')!;
      const result = await tool.handler({ topic: 'Apple', pageReferenceType: 'bold' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('topics.add');
      expect(code).toContain('idx.topics.item(topicName)');
      expect(code).toContain('PageReferenceType.BOLD_PAGE_REFERENCE');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle subTopic and sortBy parameters', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { topic: 'Fruit:Apple', created: true } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_addEntry')!;
      const result = await tool.handler({ topic: 'Fruit', subTopic: 'Apple', sortBy: 'A' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('Fruit');
      expect(code).toContain('sortBy');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });

  describe('index_generate', () => {
    it('should call executor with code generating index on a page', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { generated: true, pageIndex: 5 } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_generate')!;
      const result = await tool.handler(
        { pageIndex: 5, title: 'Index', bounds: { top: 10, left: 10, bottom: 100, right: 200 } },
        {},
      );

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('page.textFrames.add()');
      expect(code).toContain('geometricBounds = [10, 10, 100, 200]');
      expect(code).toContain('generate(tf)');
      expect(code).toContain('contents = "Index"');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return generated response from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { generated: true, pageIndex: 3 } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_generate')!;
      const result = await tool.handler({ pageIndex: 3 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.generated).toBe(true);
      expect(parsed.pageIndex).toBe(3);
    });
  });

  describe('index_listTopics', () => {
    it('should call executor with code iterating index topics', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: [{ name: 'Apple', pageReferenceCount: 3, sortBy: '' }] });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_listTopics')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('idx.topics');
      expect(code).toContain('topics[i].name');
      expect(code).toContain('pageReferences.length');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return topics list from executor', async () => {
      const mock = createMockExecutor();
      const topics = [
        { name: 'Apple', pageReferenceCount: 3, sortBy: '' },
        { name: 'Banana', pageReferenceCount: 1, sortBy: '' },
      ];
      mock.execute.mockResolvedValue({ result: topics });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_listTopics')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Apple');
      expect(parsed[0].pageReferenceCount).toBe(3);
    });
  });

  describe('index_createTopic', () => {
    it('should call executor with code creating a topic', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'Banana', created: true } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_createTopic')!;
      const result = await tool.handler({ name: 'Banana' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('topics.add({ name: "Banana" })');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should create topic with parent name prefix', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { name: 'Apple:Fuji', created: true } });
      const handler = new IndexHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'index_createTopic')!;
      const result = await tool.handler({ name: 'Fuji', parent: 'Apple' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('"Apple:Fuji"');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });
  });
});
