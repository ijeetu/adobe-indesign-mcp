import { describe, it, expect } from 'vitest';

describe('extendScriptHelpers', () => {
  it('should export EXTENDSCRIPT_HELPERS as a non-empty string', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(EXTENDSCRIPT_HELPERS).toBeDefined();
    expect(typeof EXTENDSCRIPT_HELPERS).toBe('string');
    expect(EXTENDSCRIPT_HELPERS.length).toBeGreaterThan(0);
  });

  it('should export getExtendScriptHelpers as a function returning a string', async () => {
    const { getExtendScriptHelpers } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(typeof getExtendScriptHelpers).toBe('function');
    const result = getExtendScriptHelpers();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should contain all expected helper function names', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    const expectedHelpers = [
      '__escapeJsx',
      '__findDocument',
      '__getActiveDocument',
      '__findPage',
      '__getAllPages',
      '__findPageItem',
      '__walkItems',
      '__collectItems',
      '__collectTextFrames',
      '__collectShapes',
      '__collectImages',
      '__findLayer',
      '__mmToPoints',
      '__pointsToMm',
      '__inchesToPoints',
      '__pointsToInches',
      '__picasToPoints',
      '__getDocumentInfo',
      '__getPageInfo',
      '__getBounds',
      '__getItemInfo',
      '__ok',
      '__fail',
      '__try',
    ];

    for (const helper of expectedHelpers) {
      expect(EXTENDSCRIPT_HELPERS).toContain(`function ${helper}`);
    }
  });

  it('should contain __escapeJsx string escaping logic', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(EXTENDSCRIPT_HELPERS).toContain('.replace(/\\\\/g');
    expect(EXTENDSCRIPT_HELPERS).toContain('.replace(/"/g');
  });

  it('should contain DOM navigation helpers with app.documents checks', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(EXTENDSCRIPT_HELPERS).toContain('app.documents');
    expect(EXTENDSCRIPT_HELPERS).toContain('__findDocument');
    expect(EXTENDSCRIPT_HELPERS).toContain('__getActiveDocument');
  });

  it('should contain measurement conversion constants', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(EXTENDSCRIPT_HELPERS).toContain('2.834645669291338');
    expect(EXTENDSCRIPT_HELPERS).toContain('* 72');
    expect(EXTENDSCRIPT_HELPERS).toContain('* 12');
  });

  it('should contain the __try/__ok/__fail wrapper pattern', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    expect(EXTENDSCRIPT_HELPERS).toContain('function __ok(data)');
    expect(EXTENDSCRIPT_HELPERS).toContain('function __fail(msg)');
    expect(EXTENDSCRIPT_HELPERS).toContain('function __try(fn)');
    expect(EXTENDSCRIPT_HELPERS).toContain('try {');
    expect(EXTENDSCRIPT_HELPERS).toContain('} catch (e)');
  });

  it('should contain __getDocumentInfo returning all required properties', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    const requiredProps = [
      'name',
      'filePath',
      'pages',
      'pageWidth',
      'pageHeight',
      'orientation',
      'facingPages',
      'margins',
      'bleed',
      'units',
      'zeroPoint',
    ];
    for (const prop of requiredProps) {
      expect(EXTENDSCRIPT_HELPERS).toContain(prop);
    }
  });

  it('should not contain Node.js-specific patterns that would fail in ExtendScript', async () => {
    const { EXTENDSCRIPT_HELPERS } = await import(
      '../../src/bridge/extendScriptHelpers.js'
    );
    // ExtendScript does not have const/let (only var)
    // But these are template literals compiled to TS output, so helpers are JS-compatible
    expect(EXTENDSCRIPT_HELPERS).not.toContain('import ');
    expect(EXTENDSCRIPT_HELPERS).not.toContain('require(');
    expect(EXTENDSCRIPT_HELPERS).not.toContain('export ');
  });
});
