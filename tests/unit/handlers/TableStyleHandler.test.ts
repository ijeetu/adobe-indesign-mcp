import { describe, it, expect, vi } from 'vitest';
import { TableStyleHandler } from '../../../src/handlers/TableStyleHandler.js';

describe('TableStyleHandler', () => {
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
    it('should have name "tableStyle"', () => {
      const handler = new TableStyleHandler(createMockExecutor() as any);
      expect(handler.name).toBe('tableStyle');
    });

    it('should expose 4 tools', () => {
      const handler = new TableStyleHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new TableStyleHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('tableStyle_create');
      expect(names).toContain('tableStyle_list');
      expect(names).toContain('cellStyle_create');
      expect(names).toContain('cellStyle_list');
    });

    it('should have inputSchema as a plain object', () => {
      const handler = new TableStyleHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('tableStyle_create', () => {
    it('should call executor with tableStyles.add() and basic properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'tableStyle_create')!;
      const result = await tool.handler({ name: 'MyTableStyle', fillColor: 'Black', strokeWeight: 1 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tableStyles.add({ name: "MyTableStyle" })');
      expect(code).toContain('style.fillColor = doc.swatches.item("Black")');
      expect(code).toContain('style.strokeWeight = 1');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include basedOn when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'tableStyle_create')!;
      await tool.handler({ name: 'Child', basedOn: 'Parent' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('basedOn');
      expect(code).toContain('doc.tableStyles.item("Parent")');
    });

    it('should include strokeColor and spaceBefore/spaceAfter when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'tableStyle_create')!;
      await tool.handler({ name: 'Styled', strokeColor: 'Red', spaceBefore: 6, spaceAfter: 12 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('style.strokeColor = doc.swatches.item("Red")');
      expect(code).toContain('style.spaceBefore = 6');
      expect(code).toContain('style.spaceAfter = 12');
    });
  });

  describe('tableStyle_list', () => {
    it('should call executor with code iterating tableStyles', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [{ name: '[Basic Table]', basedOn: '', fillColor: '', strokeColor: '', strokeWeight: 0 }],
      });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'tableStyle_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tableStyles');
      expect(code).toContain('JSON.stringify');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return table style list from executor', async () => {
      const mock = createMockExecutor();
      const styles = [
        { name: '[Basic Table]', basedOn: '', fillColor: '', strokeColor: '', strokeWeight: 0 },
        { name: 'My Table', basedOn: '[Basic Table]', fillColor: 'Black', strokeColor: 'Gray', strokeWeight: 1 },
      ];
      mock.execute.mockResolvedValue({ result: styles });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'tableStyle_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[1].name).toBe('My Table');
      expect(parsed[1].fillColor).toBe('Black');
    });
  });

  describe('cellStyle_create', () => {
    it('should call executor with cellStyles.add() and style properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'cellStyle_create')!;
      const result = await tool.handler({ name: 'MyCell', fillColor: 'Yellow', topInset: 5, bottomInset: 5, paragraphStyle: 'Body' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('cellStyles.add({ name: "MyCell" })');
      expect(code).toContain('style.fillColor = doc.swatches.item("Yellow")');
      expect(code).toContain('style.topInset = 5');
      expect(code).toContain('style.bottomInset = 5');
      expect(code).toContain('style.appliedParagraphStyle = doc.paragraphStyles.item("Body")');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include basedOn when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'cellStyle_create')!;
      await tool.handler({ name: 'ChildCell', basedOn: 'BaseCell' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('basedOn');
      expect(code).toContain('doc.cellStyles.item("BaseCell")');
    });

    it('should include leftInset, rightInset, strokeWeight, strokeColor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: 'ok' });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'cellStyle_create')!;
      await tool.handler({ name: 'InsetCell', leftInset: 3, rightInset: 4, strokeWeight: 2, strokeColor: 'Blue' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('style.leftInset = 3');
      expect(code).toContain('style.rightInset = 4');
      expect(code).toContain('style.strokeWeight = 2');
      expect(code).toContain('style.strokeColor = doc.swatches.item("Blue")');
    });
  });

  describe('cellStyle_list', () => {
    it('should call executor with code iterating cellStyles', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [{ name: '[None]', basedOn: '', fillColor: '', strokeColor: '', strokeWeight: 0 }],
      });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'cellStyle_list')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('cellStyles');
      expect(code).toContain('JSON.stringify');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return cell style list from executor', async () => {
      const mock = createMockExecutor();
      const styles = [
        { name: '[None]', basedOn: '', fillColor: '', strokeColor: '', strokeWeight: 0 },
        { name: 'My Cell', basedOn: '', fillColor: 'Yellow', strokeColor: 'Black', strokeWeight: 0.5 },
      ];
      mock.execute.mockResolvedValue({ result: styles });
      const handler = new TableStyleHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'cellStyle_list')!;
      const result = await tool.handler({}, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[1].name).toBe('My Cell');
      expect(parsed[1].fillColor).toBe('Yellow');
    });
  });
});
