[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Server-000000)](https://modelcontextprotocol.io/)
[![InDesign](https://img.shields.io/badge/InDesign-2024+-007396)](https://www.adobe.com/products/indesign.html)
[![UXP](https://img.shields.io/badge/UXP-Plugin-FF3366)](https://developer.adobe.com/uxp/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

# indesign-nutria-mcp

**Control Adobe InDesign from any AI agent via the Model Context Protocol (MCP).**

Create documents, place text, draw shapes, apply styles, manage layers, build tables, export PDFs — all through natural language. No CEP panels, no ExtendScript console, no manual steps.

## Overview

This MCP server bridges AI agents (Claude, GPT, Gemini, etc.) to Adobe InDesign's full DOM through 177 tools organized across 28 handler modules. Communication happens via a UXP panel plugin that executes ExtendScript and returns results.

| Metric | Value |
|---|---|
| **Total Tools** | 177 |
| **Handler Modules** | 28 |
| **DOM Coverage** | Full (documents, pages, layers, text, shapes, tables, images, styles, effects, colors, TOC, XML, books, cross-refs, hyperlinks, anchors, index, undo/redo) |
| **Protocol** | MCP (stdio transport) |
| **Bridge** | UXP Plugin + Express + WebSocket |

## Architecture

```
AI Agent (Claude/GPT/etc.)
  │  MCP stdio
  ▼
indesign-nutria-mcp (Node.js server)
  │  HTTP/WebSocket
  ▼
bridge-proxy.mjs (Express proxy)
  │  HTTP
  ▼
UXP Plugin (runs inside InDesign)
  │  ExtendScript
  ▼
Adobe InDesign DOM
```

The flow:
1. Agent calls an MCP tool (e.g., `shape_rectangle_create`)
2. Server validates parameters with Zod schemas
3. Server sends command to the UXP bridge via HTTP/WebSocket
4. UXP plugin executes the corresponding ExtendScript in InDesign
5. Result flows back through the same chain

## Tool Catalog (177 tools)

### Document & Pages (15 tools)

| Tool | Description |
|---|---|
| `document_create` | Create new document with dimensions, margins, bleed, slug |
| `document_open` | Open existing .indd file |
| `document_close` | Close with save options (yes/no/ask) |
| `document_save` | Save to current or new path |
| `document_getInfo` | Get page count, dimensions, margins |
| `document_listOpen` | List all open documents |
| `page_add` | Add page at position (atEnd, atBeginning, before, after) |
| `page_delete` | Delete page by index |
| `page_duplicate` | Duplicate page |
| `page_move` | Move page to new index |
| `page_getInfo` | Get page details |
| `page_listAll` | List all pages with properties |
| `page_applyMaster` | Apply master spread to page |
| `section_create` | Create section with numbering options |
| `section_list` | List all sections |

### Text & Typography (18 tools)

| Tool | Description |
|---|---|
| `text_addFrame` | Add text frame with content |
| `text_getContent` | Get text frame content |
| `text_setContent` | Set text frame content |
| `text_getTextFrames` | List text frames on a page |
| `text_getStories` | List all stories in document |
| `text_linkFrames` | Thread two text frames together |
| `text_unlinkFrames` | Unlink from thread |
| `text_setColumns` | Set column count and gutter |
| `text_setInsetSpacing` | Set inset spacing (top/left/bottom/right) |
| `text_setVerticalJustification` | Set vertical alignment |
| `text_setAutoSize` | Set auto-sizing (off/height/width) |
| `text_setFirstBaseline` | Set first baseline offset |
| `text_setIgnoreWrap` | Set text wrap ignore |
| `text_setTextWrap` | Set text wrap preferences |
| `text_applyParagraphStyle` | Apply paragraph style |
| `text_setDropCap` | Set drop cap options |
| `text_setKeepOptions` | Set widow/orphan control |
| `text_setHyphenation` | Set hyphenation settings |
| `text_setTabs` | Set tab stops |
| `text_setParagraphRuleAbove` | Add rule above paragraph |
| `text_setParagraphRuleBelow` | Add rule below paragraph |

### Fonts (4 tools)

| Tool | Description |
|---|---|
| `font_list` | List all available fonts |
| `font_find` | Search fonts by name |
| `font_change` | Change font of selected text |
| `font_missing_check` | Check for missing fonts |
| `font_glyph_insert` | Insert special glyph |

### Shapes & Objects (12 tools)

| Tool | Description |
|---|---|
| `shape_create` | Create rectangle, ellipse, polygon, or line |
| `shape_rectangle_create` | Create rectangle with position/size |
| `shape_ellipse_create` | Create ellipse/circle |
| `shape_polygon_create` | Create polygon (3-100 sides) |
| `shape_line_create` | Create graphic line |
| `shape_modify` | Modify shape properties |
| `shape_delete` | Delete shape |
| `shape_list` | List shapes on page |
| `group_list` | List groups on page |
| `group_ungroup` | Ungroup a group |
| `anchoredObject_create` | Create anchored object at insertion point |
| `anchoredObject_getSettings` | Get anchored object settings |
| `anchoredObject_setPosition` | Reposition anchored object |
| `anchoredObject_setProperties` | Set anchored object properties |
| `anchoredObject_release` | Release anchored object |

### Images (9 tools)

| Tool | Description |
|---|---|
| `image_place` | Place image from file path |
| `image_info` | Get image metadata |
| `image_list` | List images on page |
| `image_fit` | Fit content to frame (fill, proportional, etc.) |
| `image_adjust` | Adjust brightness/contrast |
| `image_relink` | Relink/replace image |
| `image_getLinks` | Get link status for all images |

### Colors & Swatches (6 tools)

| Tool | Description |
|---|---|
| `color_swatch_create` | Create CMYK/RGB/LAB/spot swatch |
| `color_swatch_delete` | Delete swatch by name |
| `color_swatch_list` | List all swatches |
| `color_apply` | Apply swatch to fill/stroke/both |
| `color_gradient_create` | Create linear/radial gradient |
| `color_ink_list` | List all inks |

### Effects (5 tools)

| Tool | Description |
|---|---|
| `effect_applyDropShadow` | Apply drop shadow (distance, angle, blur, opacity) |
| `effect_applyFeather` | Apply basic/directional/gradient feather |
| `effect_applyGradientFeather` | Apply gradient feather |
| `effect_applyTransparency` | Set opacity and blend mode |

### Layers (5 tools)

| Tool | Description |
|---|---|
| `layer_create` | Create layer (visible, locked, printable) |
| `layer_delete` | Delete layer |
| `layer_list` | List all layers |
| `layer_reorder` | Move layer in stack |
| `layer_setProperties` | Set layer visibility/lock/print |

### Styles (10 tools)

| Tool | Description |
|---|---|
| `style_createParagraph` | Create paragraph style |
| `style_createCharacter` | Create character style |
| `style_listParagraph` | List paragraph styles |
| `style_listCharacter` | List character styles |
| `style_listObject` | List object styles |
| `style_delete` | Delete a style |
| `style_duplicate` | Duplicate a style |

### Tables (18 tools)

| Tool | Description |
|---|---|
| `table_create` | Create table at bounds |
| `table_getInfo` | Get table info (rows, columns, cells) |
| `table_list` | List all tables |
| `table_addRow` | Add row at index |
| `table_addColumn` | Add column at index |
| `table_deleteRow` | Delete row |
| `table_deleteColumn` | Delete column |
| `table_setCell` | Set cell content |
| `table_setCellAlignment` | Set cell text alignment |
| `table_setCellFill` | Set cell fill color/tint |
| `table_setCellStroke` | Set cell edge stroke |
| `table_setCellInset` | Set cell inset spacing |
| `table_mergeCells` | Merge cell range |
| `table_splitCell` | Split merged cell |
| `table_setRowColumnSize` | Set row height or column width |
| `table_setHeaderFooter` | Set header/footer rows |
| `tableStyle_create` | Create table style |
| `tableStyle_list` | List table styles |
| `cellStyle_create` | Create cell style |
| `cellStyle_list` | List cell styles |

### Masters & Books (10 tools)

| Tool | Description |
|---|---|
| `master_create` | Create master spread |
| `master_list` | List master spreads |
| `master_apply` | Apply master to page |
| `master_delete` | Delete master |
| `master_duplicate` | Duplicate master |
| `master_getPages` | List pages on master |
| `book_list` | List open books |
| `book_open` | Open .indb book file |
| `book_getDocuments` | List documents in book |
| `book_synchronize` | Sync with style source |

### Export & Preflight (7 tools)

| Tool | Description |
|---|---|
| `export_document` | Export to PDF/EPUB/HTML/JPG/PNG/package |
| `export_getFonts` | Get all fonts in document |
| `export_getSwatches` | Get all swatches |
| `export_getTables` | Get all tables |
| `export_getMasterSpreads` | Get master spreads |
| `export_getXmlTags` | Get XML tags |
| `export_preflight` | Run preflight check |

### Find/Replace & GREP (5 tools)

| Tool | Description |
|---|---|
| `text_findReplace` | Find and replace text |
| `grep_find` | GREP pattern search |
| `grep_findFormat` | Find with formatting |
| `grep_replace` | GREP find and replace |
| `grep_replaceFormat` | GREP replace with formatting |

### Transform (5 tools)

| Tool | Description |
|---|---|
| `transform_rotate` | Rotate object by angle |
| `transform_scale` | Scale by percentages |
| `transform_flip` | Flip horizontally/vertically |
| `transform_align` | Align objects (left/center/right/top/middle/bottom) |
| `transform_distribute` | Distribute objects evenly |

### Interactive (5 tools)

| Tool | Description |
|---|---|
| `interactive_addHyperlink` | Add URL hyperlink |
| `interactive_deleteHyperlink` | Delete hyperlink |
| `interactive_listHyperlinks` | List hyperlinks |
| `interactive_listAnchors` | List cross-ref anchors |
| `interactive_listButtons` | List buttons |

### Notes & References (10 tools)

| Tool | Description |
|---|---|
| `note_addFootnote` | Add footnote to paragraph |
| `note_addEndnote` | Add endnote to story |
| `note_listFootnotes` | List footnotes |
| `note_footnoteOptions` | Set footnote numbering/layout |
| `xref_create` | Create cross-reference |
| `xref_list` | List cross-references |
| `xref_updateFormat` | Update cross-reference format |
| `index_addEntry` | Add index entry |
| `index_createTopic` | Create index topic |
| `index_listTopics` | List index topics |
| `index_generate` | Generate index on page |

### TOC (4 tools)

| Tool | Description |
|---|---|
| `toc_createStyle` | Create/update TOC style |
| `toc_generate` | Generate TOC on page |
| `toc_update` | Regenerate existing TOC |
| `toc_listStyles` | List TOC styles |

### XML (6 tools)

| Tool | Description |
|---|---|
| `xml_addTag` | Create XML tag |
| `xml_deleteTag` | Delete XML tag |
| `xml_listTags` | List XML tags |
| `xml_tagPageItem` | Tag page item |
| `xml_import` | Import XML |
| `xml_export` | Export XML |

### Resources & Links (6 tools)

| Tool | Description |
|---|---|
| `resources_listLinks` | List all links |
| `resources_getLinkInfo` | Get link details |
| `resources_updateLink` | Relink to new file |
| `resources_updateAllLinks` | Fix all broken links |
| `resources_embedLink` | Embed linked file |
| `resources_unembedLink` | Unembed to external file |

### Data Merge (4 tools)

| Tool | Description |
|---|---|
| `dataMerge_selectDataSource` | Select CSV/TSV/XML source |
| `dataMerge_listFields` | List merge fields |
| `dataMerge_mergeRecords` | Merge records |
| `dataMerge_removeDataSource` | Remove data source |
| `dataMerge_export` | Export merged output |

### Undo/Redo (3 tools)

| Tool | Description |
|---|---|
| `undo` | Undo last operation |
| `redo` | Redo last undone |
| `undo_history` | Get undo/redo state |

## Quick Start

### Prerequisites

- Adobe InDesign 2024+ (with UXP support)
- Node.js 18+
- UXP Developer Tool (UDT)

### Install & Run

```bash
# Clone
git clone https://github.com/nutriandrea/adobe-indesign-mcp.git
cd adobe-indesign-mcp

# Install dependencies
npm install

# Build
npm run build

# Load UXP plugin via UDT:
# 1. Open UXP Developer Tool
# 2. Add plugin -> select plugin/manifest.json
# 3. Click "Load" — plugin appears in InDesign

# Start MCP server
npm start
```

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "indesign-nutria-mcp": {
      "command": "node",
      "args": ["/path/to/indesign-nutria-mcp/dist/index.js"]
    }
  }
}
```

## Project Structure

```
├── src/
│   ├── index.ts              # Entry point, config loading
│   ├── server/               # MCP server core (IndesignMcpServer)
│   ├── handlers/             # 28 handler modules (one per feature area)
│   ├── core/                 # Core ExtendScript commands
│   ├── bridge/               # UXP bridge communication
│   ├── schemas/              # Zod validation schemas
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Logger, config loader
│   └── ...
├── plugin/                   # UXP panel plugin files
├── bridge-proxy.mjs          # Express proxy for UXP<->MCP communication
├── tests/                    # Vitest test suite
└── package.json
```

## Development

```bash
# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT
