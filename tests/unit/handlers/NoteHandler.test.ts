import { describe, it, expect, vi } from 'vitest';
import { NoteHandler } from '../../../src/handlers/NoteHandler.js';

describe('NoteHandler', () => {
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
    it('should have name "note"', () => {
      const handler = new NoteHandler(createMockExecutor() as any);
      expect(handler.name).toBe('note');
    });

    it('should expose 4 tools', () => {
      const handler = new NoteHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(4);
    });

    it('should export all expected tools', () => {
      const handler = new NoteHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('note_addFootnote');
      expect(names).toContain('note_listFootnotes');
      expect(names).toContain('note_footnoteOptions');
      expect(names).toContain('note_addEndnote');
    });

    it('should have every tool with name, description, inputSchema, and handler', () => {
      const handler = new NoteHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });
  });

  describe('note_addFootnote', () => {
    it('should call executor with footnotes.add() and text content', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: 'See chapter 2 for details' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addFootnote')!;
      const result = await tool.handler({ storyIndex: 0, paragraphIndex: 1, text: 'See chapter 2 for details' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.stories[0]');
      expect(code).toContain('story.paragraphs[1]');
      expect(code).toContain('footnotes.add()');
      expect(code).toContain('texts[0].contents = "See chapter 2 for details"');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include prefix and suffix when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: 'Note text' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addFootnote')!;
      const result = await tool.handler({ storyIndex: 0, paragraphIndex: 0, text: 'Note text', prefix: 'p.', suffix: ')' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('fn.prefix = "p.";');
      expect(code).toContain('fn.suffix = ")";');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include startingNumber when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: 'Note' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addFootnote')!;
      await tool.handler({ storyIndex: 0, paragraphIndex: 0, text: 'Note', startingNumber: 5 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('fn.startingNumber = 5');
    });

    it('should escape special characters in text', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: '' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addFootnote')!;
      await tool.handler({ storyIndex: 0, paragraphIndex: 0, text: 'Line1\nLine2 with "quotes" and \\backslash' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('\\n');
      expect(code).toContain('\\"');
      expect(code).toContain('\\\\');
    });

    it('should return footnote info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 2, text: 'Hello' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addFootnote')!;
      const result = await tool.handler({ storyIndex: 0, paragraphIndex: 0, text: 'Hello' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.index).toBe(2);
      expect(parsed.text).toBe('Hello');
    });
  });

  describe('note_listFootnotes', () => {
    it('should call executor with doc.footnotes when no storyIndex given', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, text: 'Footnote 1', storyIndex: 0, paragraphIndex: 0 },
        ],
      });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_listFootnotes')!;
      const result = await tool.handler({}, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('var scope = doc;');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should call executor with doc.stories[i].footnotes when storyIndex given', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({
        result: [
          { index: 0, text: 'Footnote A', storyIndex: 1, paragraphIndex: 2 },
        ],
      });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_listFootnotes')!;
      const result = await tool.handler({ storyIndex: 1 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('var scope = doc.stories[1]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return footnotes array from executor', async () => {
      const mock = createMockExecutor();
      const footnotes = [
        { index: 0, text: 'First footnote', storyIndex: 0, paragraphIndex: 0 },
        { index: 1, text: 'Second footnote', storyIndex: 0, paragraphIndex: 3 },
      ];
      mock.execute.mockResolvedValue({ result: footnotes });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_listFootnotes')!;
      const result = await tool.handler({ storyIndex: 0 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].text).toBe('First footnote');
      expect(parsed[1].paragraphIndex).toBe(3);
    });
  });

  describe('note_footnoteOptions', () => {
    it('should set numbering style, starting number, separator, and layout', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      const result = await tool.handler({
        numberingType: 'lowerRoman',
        startingNumber: 1,
        separator: ':',
        layout: 'column',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('FootnoteNumberingStyle.LOWERROMAN_FOOTNOTE_NUMBERING');
      expect(code).toContain('opts.startingNumber = 1');
      expect(code).toContain('opts.separator = ":"');
      expect(code).toContain('FootnoteLayout.COLUMN_FOOTNOTE_LAYOUT');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should accept only partial options', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      await tool.handler({ separator: '—' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('opts.separator = "—"');
      expect(code).not.toContain('numberingStyle');
      expect(code).not.toContain('layout');
    });

    it('should return { updated: true } from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      const result = await tool.handler({ numberingType: 'decimal' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.updated).toBe(true);
    });

    it('should set prefix and suffix when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      await tool.handler({ prefix: 'Note ', suffix: '.' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('opts.prefix = "Note "');
      expect(code).toContain('opts.suffix = "."');
    });

    it('should set section layout when specified', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      await tool.handler({ layout: 'section' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('FootnoteLayout.SECTION_FOOTNOTE_LAYOUT');
    });

    it('should escape special characters in separator', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { updated: true } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_footnoteOptions')!;
      await tool.handler({ separator: 'tab\tsep "with" quotes' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('\\"');
    });
  });

  describe('note_addEndnote', () => {
    it('should call executor with endnotes.add() and text content', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: 'Endnote text here' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addEndnote')!;
      const result = await tool.handler({ storyIndex: 0, text: 'Endnote text here' }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('doc.stories[0]');
      expect(code).toContain('story.endnotes.add()');
      expect(code).toContain('texts[0].contents = "Endnote text here"');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should escape special characters in text', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 0, text: '' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addEndnote')!;
      await tool.handler({ storyIndex: 0, text: 'Line1\nLine2 with "quotes"' }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('\\n');
      expect(code).toContain('\\"');
    });

    it('should return endnote info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { index: 1, text: 'My endnote' } });
      const handler = new NoteHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'note_addEndnote')!;
      const result = await tool.handler({ storyIndex: 0, text: 'My endnote' }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed.index).toBe(1);
      expect(parsed.text).toBe('My endnote');
    });
  });
});
