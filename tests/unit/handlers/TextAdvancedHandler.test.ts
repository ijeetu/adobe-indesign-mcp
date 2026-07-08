import { describe, it, expect, vi } from 'vitest';
import { TextAdvancedHandler } from '../../../src/handlers/TextAdvancedHandler.js';

describe('TextAdvancedHandler', () => {
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
    it('should have name "textAdvanced"', () => {
      const handler = new TextAdvancedHandler(createMockExecutor() as any);
      expect(handler.name).toBe('textAdvanced');
    });

    it('should expose 20 tools', () => {
      const handler = new TextAdvancedHandler(createMockExecutor() as any);
      expect(handler.tools).toHaveLength(20);
    });

    it('should export all expected tools', () => {
      const handler = new TextAdvancedHandler(createMockExecutor() as any);
      const names = handler.tools.map((t) => t.name);
      expect(names).toContain('text_linkFrames');
      expect(names).toContain('text_unlinkFrames');
      expect(names).toContain('text_setColumns');
      expect(names).toContain('text_setTextWrap');
      expect(names).toContain('text_setDropCap');
      expect(names).toContain('text_setKeepOptions');
      expect(names).toContain('text_setInsetSpacing');
      expect(names).toContain('text_setAutoSize');
      expect(names).toContain('text_setVerticalJustification');
      expect(names).toContain('text_setFirstBaseline');
      expect(names).toContain('text_setIgnoreWrap');
      expect(names).toContain('text_setParagraphRuleAbove');
      expect(names).toContain('text_setParagraphRuleBelow');
      expect(names).toContain('text_setTabs');
      expect(names).toContain('text_setHyphenation');
    });

    it('should have inputSchema as a plain object', () => {
      const handler = new TextAdvancedHandler(createMockExecutor() as any);
      for (const tool of handler.tools) {
        expect(typeof tool.inputSchema).toBe('object');
        expect(tool.inputSchema).not.toBeNull();
      }
    });
  });

  describe('text_linkFrames', () => {
    it('should call executor with code linking two text frames', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linked: true, source: 0, target: 0 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_linkFrames')!;
      const result = await tool.handler({
        sourcePageIndex: 0,
        sourceFrameIndex: 0,
        targetPageIndex: 1,
        targetFrameIndex: 0,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[0].textFrames[0]');
      expect(code).toContain('pages[1].textFrames[0]');
      expect(code).toContain('nextTextFrame = tgtFrame');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return link info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linked: true, source: 0, target: 0 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_linkFrames')!;
      const result = await tool.handler({
        sourcePageIndex: 0,
        sourceFrameIndex: 0,
        targetPageIndex: 1,
        targetFrameIndex: 0,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ linked: true, source: 0, target: 0 });
    });
  });

  describe('text_unlinkFrames', () => {
    it('should call executor with code unlinking a text frame', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { unlinked: true, frame: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_unlinkFrames')!;
      const result = await tool.handler({ pageIndex: 0, frameIndex: 1 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('pages[0].textFrames[1]');
      expect(code).toContain('nextTextFrame = null');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return unlink info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { unlinked: true, frame: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_unlinkFrames')!;
      const result = await tool.handler({ pageIndex: 0, frameIndex: 1 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ unlinked: true, frame: 1 });
    });
  });

  describe('text_setColumns', () => {
    it('should call executor with code setting column count and gutter', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { columns: 3, gutter: 8 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setColumns')!;
      const result = await tool.handler({ pageIndex: 0, frameIndex: 0, count: 3, gutter: 8 }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('textColumnCount = 3');
      expect(code).toContain('textColumnGutter = 8');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should default gutter to 12', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { columns: 2, gutter: 12 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setColumns')!;
      await tool.handler({ pageIndex: 0, frameIndex: 0, count: 2 }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('textColumnGutter = 12');
    });

    it('should return column info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { columns: 3, gutter: 8 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setColumns')!;
      const result = await tool.handler({ pageIndex: 0, frameIndex: 0, count: 3, gutter: 8 }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ columns: 3, gutter: 8 });
    });
  });

  describe('text_setTextWrap', () => {
    it('should call executor with code setting text wrap mode, side, and offset', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { mode: 'boundingBox', side: 'right', offset: 10 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTextWrap')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        mode: 'boundingBox',
        side: 'right',
        offset: 10,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('TextWrapPreferences.TEXT_WRAP_BOUNDING_BOX');
      expect(code).toContain('TextWrapSide.RIGHT_SIDE');
      expect(code).toContain('textWrapOffset = 10');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should map contour mode to TextWrapPreferences.TEXT_WRAP_CONTOUR', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { mode: 'contour', side: 'both', offset: 7.055 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTextWrap')!;
      await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        mode: 'contour',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('TextWrapPreferences.TEXT_WRAP_CONTOUR');
    });

    it('should default side to both and offset to 7.055', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { mode: 'boundingBox', side: 'both', offset: 7.055 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTextWrap')!;
      await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        mode: 'boundingBox',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('TextWrapSide.BOTH_SIDES');
      expect(code).toContain('textWrapOffset = 7.055');
    });

    it('should return text wrap info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { mode: 'boundingBox', side: 'right', offset: 10 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTextWrap')!;
      const result = await tool.handler({
        pageIndex: 0,
        itemIndex: 0,
        mode: 'boundingBox',
        side: 'right',
        offset: 10,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ mode: 'boundingBox', side: 'right', offset: 10 });
    });
  });

  describe('text_setDropCap', () => {
    it('should call executor with code setting drop cap properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { lines: 2, characters: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setDropCap')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
        lines: 2,
        characters: 1,
        characterStyle: 'DropCap Style',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('dropCapCharacters = 1');
      expect(code).toContain('dropCapLines = 2');
      expect(code).toContain('characterStyles.item("DropCap Style")');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should not set dropCapStyle when characterStyle is not provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { lines: 3, characters: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setDropCap')!;
      await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('dropCapCharacters = 1');
      expect(code).toContain('dropCapLines = 3');
      expect(code).not.toContain('dropCapStyle');
    });

    it('should default lines to 3 and characters to 1', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { lines: 3, characters: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setDropCap')!;
      await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('dropCapCharacters = 1');
      expect(code).toContain('dropCapLines = 3');
    });

    it('should return drop cap info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { lines: 2, characters: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setDropCap')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
        lines: 2,
        characters: 1,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ lines: 2, characters: 1 });
    });
  });

  describe('text_setKeepOptions', () => {
    it('should call executor with code setting keep options', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linesTogether: true, startParagraph: 'nextPage' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setKeepOptions')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
        linesTogether: 3,
        startParagraph: 'nextPage',
        keepWithNext: 2,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('keepLinesTogether = true');
      expect(code).toContain('keepWithNext = 2');
      expect(code).toContain('StartParagraph.NEXT_PAGE');
      expect(code).toContain('keepAllLinesTogether = true');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should default linesTogether to 2 and startParagraph to anywhere', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linesTogether: true, startParagraph: 'anywhere' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setKeepOptions')!;
      await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('keepLinesTogether = true');
      expect(code).toContain('keepAllLinesTogether = true');
      expect(code).toContain('StartParagraph.ANYWHERE');
      expect(code).toContain('keepWithNext = 0');
    });

    it('should default paragraphIndex to 0 when not provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linesTogether: true, startParagraph: 'anywhere' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setKeepOptions')!;
      await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('paragraphs[0]');
    });

    it('should return keep options info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { linesTogether: true, startParagraph: 'nextPage' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setKeepOptions')!;
      const result = await tool.handler({
        pageIndex: 0,
        frameIndex: 0,
        paragraphIndex: 0,
        linesTogether: 3,
        startParagraph: 'nextPage',
        keepWithNext: 2,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ linesTogether: true, startParagraph: 'nextPage' });
    });
  });

  describe('text_setInsetSpacing', () => {
    it('should call executor with code setting inset spacing', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { insetSpacing: [10, 5, 10, 5] } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setInsetSpacing')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, top: 10, left: 5, bottom: 10, right: 5,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('insetSpacing = [10, 5, 10, 5]');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return inset spacing info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { insetSpacing: [10, 5, 10, 5] } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setInsetSpacing')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, top: 10, left: 5, bottom: 10, right: 5,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ insetSpacing: [10, 5, 10, 5] });
    });
  });

  describe('text_setAutoSize', () => {
    it('should call executor with code setting autoSizingType', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { autoSizingType: 'heightAndWidth', referencePoint: 'center' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setAutoSize')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 1, autoSizingType: 'heightAndWidth', referencePoint: 'center',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('AutoSizingTypeEnum.AUTO_SIZING_HEIGHT_AND_WIDTH');
      expect(code).toContain('AnchorPoint.CENTER_ANCHOR');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should omit referencePoint when not provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { autoSizingType: 'off' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setAutoSize')!;
      await tool.handler({
        pageIndex: 0, frameIndex: 0, autoSizingType: 'off',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('AUTO_SIZING_OFF');
      expect(code).not.toContain('autoSizingReferencePoint');
    });
  });

  describe('text_setVerticalJustification', () => {
    it('should call executor with code setting vertical justification', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { justification: 'center' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setVerticalJustification')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, justification: 'center',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('VerticalJustification.CENTER_ALIGN');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return justification info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { justification: 'bottom' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setVerticalJustification')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, justification: 'bottom',
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ justification: 'bottom' });
    });
  });

  describe('text_setFirstBaseline', () => {
    it('should call executor with code setting first baseline offset', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { offsetType: 'capHeight' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setFirstBaseline')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, offsetType: 'capHeight',
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('FirstBaseline.CAP_HEIGHT');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include minOffset when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { offsetType: 'fixedHeight', minOffset: 12 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setFirstBaseline')!;
      await tool.handler({
        pageIndex: 0, frameIndex: 0, offsetType: 'fixedHeight', minOffset: 12,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('minimumFirstBaseline = 12');
    });
  });

  describe('text_setIgnoreWrap', () => {
    it('should call executor with code setting ignoreWrap', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ignoreWrap: true } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setIgnoreWrap')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, ignoreWrap: true,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('ignoreWrap = true');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return ignoreWrap info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ignoreWrap: false } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setIgnoreWrap')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, ignoreWrap: false,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ ignoreWrap: false });
    });
  });

  describe('text_setParagraphRuleAbove', () => {
    it('should call executor with code setting rule above properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ruleAbove: true, ruleColor: 'Black' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setParagraphRuleAbove')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        ruleOn: true, ruleWeight: 1, ruleColor: 'Black', ruleWidth: 'column',
        ruleOffset: 2, ruleLeftIndent: 0, ruleRightIndent: 0,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('ruleAbove = true');
      expect(code).toContain('ruleAboveWeight = 1');
      expect(code).toContain('ruleAboveColor = doc.colors.item("Black")');
      expect(code).toContain('RuleWidth.COLUMN_WIDTH');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include ruleType when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ruleAbove: true, ruleColor: 'Red' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setParagraphRuleAbove')!;
      await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 1,
        ruleOn: true, ruleWeight: 2, ruleColor: 'Red', ruleWidth: 'text',
        ruleOffset: 1, ruleLeftIndent: 5, ruleRightIndent: 5, ruleType: 'Solid',
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('ruleAboveType = "Solid"');
    });
  });

  describe('text_setParagraphRuleBelow', () => {
    it('should call executor with code setting rule below properties', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ruleBelow: true, ruleColor: 'Blue' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setParagraphRuleBelow')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        ruleOn: true, ruleWeight: 0.5, ruleColor: 'Blue', ruleWidth: 'custom',
        ruleOffset: 3, ruleLeftIndent: 2, ruleRightIndent: 2,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('ruleBelow = true');
      expect(code).toContain('ruleBelowWeight = 0.5');
      expect(code).toContain('ruleBelowColor = doc.colors.item("Blue")');
      expect(code).toContain('RuleWidth.CUSTOM_WIDTH');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should return rule below info from executor', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { ruleBelow: true, ruleColor: 'Blue' } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setParagraphRuleBelow')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        ruleOn: true, ruleWeight: 0.5, ruleColor: 'Blue', ruleWidth: 'custom',
        ruleOffset: 3, ruleLeftIndent: 2, ruleRightIndent: 2,
      }, {});

      const text = result.content[0] as any;
      const parsed = JSON.parse(text.text);
      expect(parsed).toEqual({ ruleBelow: true, ruleColor: 'Blue' });
    });
  });

  describe('text_setTabs', () => {
    it('should call executor with code setting tab list', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { tabCount: 1 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTabs')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        tabStops: [{ position: 10, alignment: 'left', leader: '', character: '' }],
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('tabList');
      expect(code).toContain('TabAlignment.LEFT_ALIGN');
      expect(code).toContain('position:10');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle multiple tab stops with different alignments', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { tabCount: 2 } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setTabs')!;
      await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        tabStops: [
          { position: 10, alignment: 'left', leader: '', character: '' },
          { position: 50, alignment: 'right', leader: '.', character: '' },
        ],
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('TabAlignment.LEFT_ALIGN');
      expect(code).toContain('TabAlignment.RIGHT_ALIGN');
      expect(code).toContain('leader:"."');
    });
  });

  describe('text_setHyphenation', () => {
    it('should call executor with code setting hyphenation', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { hyphenation: true } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setHyphenation')!;
      const result = await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0, hyphenation: true,
      }, {});

      expect(mock.execute).toHaveBeenCalledTimes(1);
      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('hyphenation = true');
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should include optional hyphenation params when provided', async () => {
      const mock = createMockExecutor();
      mock.execute.mockResolvedValue({ result: { hyphenation: true } });
      const handler = new TextAdvancedHandler(mock as any);

      const tool = handler.tools.find((t) => t.name === 'text_setHyphenation')!;
      await tool.handler({
        pageIndex: 0, frameIndex: 0, paragraphIndex: 0,
        hyphenation: true, wordSpacing: 85, letterSpacing: 0,
        minWordLength: 4, maxConsecutiveHyphens: 2,
      }, {});

      const code = mock.execute.mock.calls[0][0] as string;
      expect(code).toContain('desiredWordSpacing = 85');
      expect(code).toContain('desiredLetterSpacing = 0');
      expect(code).toContain('hyphenationMinWordSize = 4');
      expect(code).toContain('hyphenateLadderLimit = 2');
    });
  });
});
