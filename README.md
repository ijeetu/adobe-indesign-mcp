# indesign-nutria-mcp

**Control Adobe InDesign from any AI agent via the Model Context Protocol.**

Create documents, place text, draw shapes, apply styles, export PDFs — all through natural language. No CEP panels, no ExtendScript console, no manual steps.

![InDesign](https://img.shields.io/badge/InDesign-2022%2B-blue) ![MCP](https://img.shields.io/badge/MCP-1.0-green) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ What it does

indesign-nutria-mcp is an MCP server that bridges AI agents (Claude, OpenCode, etc.) to Adobe InDesign. It speaks two protocols:

| Transport | Connects | Used by |
|-----------|----------|---------|
| **STDIO** | MCP client ↔ Server | AI agents (OpenCode, Claude Desktop) |
| **WebSocket** (port 8120) | Server ↔ InDesign | UXP plugin running inside InDesign |

The server exposes **31 handlers** with **183 tools** covering the full InDesign DOM.

### What's new in v1.1.0

| Feature | Tools | What it solves |
|---------|-------|----------------|
| **Text formatting read** | `text_getFormatting` | Returns font, size, style, characterStyle per text range. No more custom scripts to check formatting. |
| **Character style apply** | `text_applyCharStyle` | Apply character style to a range in one call. No more indexOf + itemByRange + set boilerplate. |
| **Font apply** | `text_applyFont` | Apply font family/style/size to a text range. |
| **Text search** | `text_search`, `text_searchFormatting` | GREP search + format-aware search returning paragraphIndex, charStart, charEnd for each match. |
| **Story–Page navigation** | `document_getPageStories`, `document_getStoryPages` | Map which stories live on which pages and vice versa. |
| **Undo groups** | `undo_beginGroup`, `undo_endGroup` | Group multiple tool calls into a single undo step. |
| **Debug mode** | `script_run(code, debug=true)` | Returns ExtendScript error line number, fileName, and stack trace on failure. |
| **Timeout / maxResults** | Added to `text_getStories`, `text_getTextFrames`, `text_getContent` | Custom timeout and result limit for large documents. |
| **BOM filtering** | Added to text reads | Filters `\ufeff` (BOM) and `\u0004` (InDesign internal) by default. Use `includeControlChars: true` to get raw content. |
| **MCP resources** | `mcp://tools/inventory`, `mcp://document/active` | Agent auto-discovery, session tracking. |

---

## 🚀 Quick start

### Prerequisites

- Node.js ≥ 18
- Adobe InDesign 2022 or later
- [UXP Developer Tool](https://developer.adobe.com/uxp/) (once, to load the plugin)

### Install

```bash
git clone https://github.com/nutriandrea/adobe-indesign-mcp
cd indesign-nutria-mcp
npm install
npm run build
```

### 1. Start the server

```bash
node dist/index.js opencode-indesign.json
```

### 2. Open InDesign + load the plugin

1. Launch **Adobe InDesign**
2. Open **UXP Developer Tool**
3. Load the `plugin/` directory
4. Click the **•••** menu → **MCP Bridge**
5. Click **Connect** (default: `ws://localhost:8120`)

### 3. Connect your AI

Configure your MCP client with:

```json
{
  "mcpServers": {
    "indesign": {
      "command": "node",
      "args": ["dist/index.js", "opencode-indesign.json"]
    }
  }
}
```

Now you can say things like:

> *"Create an A4 document with 5 pages. Add a red circle on page 3 and the text 'Hello' in Arial Bold 24pt."*

> *"Check what font is used in the first paragraph of story 0."*

> *"Find all text in Bold in the document."*

---

## 🛠️ New declarative tools

### Text formatting (read)

```typescript
text_getFormatting(storyIndex, paragraphIndex)
// Returns: [{ start, end, font, fontStyle, pointSize, characterStyle, fillColor, capitalization, tracking, ... }]
```

No more writing custom ExtendScript just to check what font or style is applied. Each text style range is returned with full formatting properties, using paragraph-relative character indices.

### Text formatting (write)

```typescript
text_applyCharStyle(storyIndex, paragraphIndex, startChar, endChar, styleName)
text_applyFont(storyIndex, paragraphIndex, startChar, endChar, fontFamily?, fontStyle?, pointSize?)
```

Apply character styles or font changes to a range within a paragraph in a single tool call. Uses `itemByRange` internally — no manual index math.

### Search

```typescript
text_search(storyIndex, pattern, maxResults?, timeout?)
// Returns: { totalFound, matches: [{ paragraphIndex, charStart, charEnd, text }] }

text_searchFormatting(storyIndex, fontFamily?, fontStyle?, pointSize?, maxResults?, timeout?)
// Returns: { totalFound, matches: [{ paragraphIndex, charStart, charEnd, text }] }
```

GREP-powered text search and format-aware search. Returns paragraph-relative character positions so you can immediately pipe results into `text_applyCharStyle` or `text_applyFont`.

### Document navigation

```typescript
document_getPageStories(pageIndex)
// Returns: [{ storyIndex, length, textFrames, textFrameIndices, contentPreview }]

document_getStoryPages(storyIndex)
// Returns: [{ pageIndex, pageName }]
```

Map stories to pages and vice versa. Essential for understanding document layout without manual exploration.

### Safety

```typescript
undo_beginGroup()  // All subsequent tool calls become a single undo step
undo_endGroup()    // Restore normal undo granularity
```

### Debug

```typescript
script_run(code, debug: true, timeout?)
```

When `debug: true`, ExtendScript errors include line number, fileName, and full stack trace. No more opaque "Script execution failed" messages.

### BOM filtering

All text-reading tools (`text_getContent`, `text_getStories`, `text_getTextFrames`, `text_getFormatting`) filter `\ufeff` (BOM) and `\u0004` (InDesign internal control char) by default. Pass `includeControlChars: true` to get raw content.

### Timeout / maxResults

`text_getStories`, `text_getTextFrames`, `text_search`, `text_searchFormatting` accept optional `timeout` (ms) and `maxResults` params. Default timeout is 30s; increase for large documents.

---

## 🧠 AI Skills (`.opencode/skills/`)

Ten skills ship with this repo. They are **auto-loaded by trigger keywords** when you talk to the AI agent:

| # | Skill | Purpose |
|---|-------|---------|
| 1 | **Aesthetic Preference** | 8 questions before any creative work — font, palette, style, margins, constraints. Builds a persistent JSON profile. |
| 2 | **Layout Readability** | Validates overlays, contrast, orphans/widows, hierarchy, spacing, overflow before delivery. |
| 3 | **Export & Verify** | Mandatory **modify → export JPG → analyze pixels → fix → repeat** cycle. |
| 4 | **Import Word** | Imports `.docx`, maps Word styles (Heading 1/Normal/List) to InDesign paragraph styles. |
| 5 | **Batch Operations** | Applies the same modification across N pages (bulk text, master apply, export all). |
| 6 | **Image Optimize** | Place, resize, DPI check, relink images. Profiles for print (300dpi CMYK) vs web (72dpi RGB). |
| 7 | **Table Format** | Creates and styles tables — columns, rows, borders, fills, text alignment, merge cells. |
| 8 | **Template Manager** | Save/load reusable page templates as `.indd` files or `.indt` library. |
| 9 | **Export Batch** | Exports the same document to **multiple formats at once** (PDF + JPG + PNG), each with its own profile. |
| 10 | **Style Extractor** | Scans a folder of `.indd` files, **extracts full style profile** (fonts, colors, paragraph/character styles, master spreads, margins), saves as JSON, then replicates it on a new book layout. |

---

## 🏗️ Architecture

```
┌────────────────┐     STDIO      ┌──────────────────┐    WebSocket     ┌──────────────┐
│   AI Agent     │ ◄──────────►   │  MCP Server      │ ◄─────────────► │  InDesign    │
│  (OpenCode,    │                │  (node)           │    port 8120    │  + UXP plugin│
│   Claude, ...) │                │                   │                 │              │
└────────────────┘                └──────────────────┘                 └──────────────┘
                                          │
                                     ┌─────┴─────┐
                                     │ 31 handlers│
                                     │ 183 tools  │
                                     └───────────┘
```

### MCP Resources

| Resource URI | Description |
|---|---|
| `mcp://session/status` | Active document session state |
| `mcp://bridge/status` | WebSocket bridge connection status + queue depth |
| `mcp://tools/inventory` | Full list of all 183 tools with descriptions (agent auto-discovery) |
| `mcp://document/active` | Currently active document info |

### Handlers at a glance

| Handler | Tools | Notable |
|---------|-------|---------|
| **AnchoredObject** | 5 | create, getSettings, release, setPosition, setProperties |
| **Book** | 4 | list, open, getDocuments, synchronize |
| **Color** | 6 | swatch list/create/delete, ink list, gradient create, apply |
| **DataMerge** | 5 | selectDataSource, listFields, mergeRecords, export, removeDataSource |
| **Document** | **8** | create/open/save/close, getInfo, listOpen, **getPageStories, getStoryPages** |
| **Effect** | 4 | drop shadow, feather, transparency, gradient feather |
| **Export** | **9** | export (PDF/EPUB/HTML/JPG/PNG/package), preflight, fonts/swatches/tables, **script_run** |
| **Font** | 5 | list, find, change, missing check, glyph insert |
| **Grep** | 4 | find, replace, findFormat, replaceFormat |
| **Image** | 5 | place, info, adjust, fit, relink |
| **Index** | 4 | addEntry, createTopic, generate, listTopics |
| **Interactive** | 5 | list/add/delete hyperlinks, list buttons, list anchors |
| **Layer** | 5 | create, list, setProperties, reorder, delete |
| **List** | 6 | define, list, applyToParagraph/Selection, removeFromParagraph, restartNumbering |
| **Master** | 6 | create, duplicate, apply, delete, list, getPages |
| **Note** | 4 | addFootnote/Endnote, listFootnotes, footnoteOptions |
| **Object** | 6 | shape list/create, group list/ungroup, image getLinks/list |
| **Page** | 7 | add, delete, duplicate, move, getInfo, listAll, applyMaster |
| **Resources** | 6 | list/update/embed/unembed links, getLinkInfo |
| **Section** | 4 | create, list, setNumbering, delete |
| **Shape** | 6 | rectangle/ellipse/line/polygon create, delete, modify |
| **Style** | 7 | list/create paragraph/character/object styles, duplicate, delete |
| **Table** | 16 | create, setCell, addRow/Column, deleteRow/Column, merge/split cells, getInfo/list, header/footer, alignment, fills, strokes |
| **TableStyle** | 4 | tableStyle create/list, cellStyle create/list |
| **Text** | 7 | addFrame, setContent, **getContent (BOM filter, timeout)**, getTextFrames, **getStories (maxResults, timeout)**, findReplace, applyParagraphStyle |
| **TextAdvanced** | **20** | link/unlink frames, columns, wrap, drop caps, keep opts, inset, auto-size, vert just, baseline, rules, tabs, hyphenation, **getFormatting, applyCharStyle, applyFont, search, searchFormatting** |
| **Toc** | 4 | createStyle, generate, listStyles, update |
| **Transform** | 5 | align, distribute, rotate, scale, flip |
| **Undo** | **5** | undo, redo, history, **beginGroup, endGroup** |
| **Xml** | 6 | listTags, addTag, deleteTag, tagPageItem, export, import |
| **Xref** | 3 | create, list, updateFormat |

---

## 📁 Project structure

```
├── src/
│   ├── server/          # MCP server (STDIO transport)
│   ├── bridge/          # WebSocket bridge + ExtendScript executor
│   ├── handlers/        # 31 handler modules (183 tools)
│   ├── schemas/         # Zod schemas for tool parameters
│   ├── core/            # Session tracking
│   ├── types/           # TypeScript definitions
│   └── utils/           # Config loader, logger, JSON polyfill, security
├── plugin/              # UXP panel source (index.html, index.js, manifest.json)
├── tests/               # 747+ tests (vitest)
├── .opencode/skills/    # 10 AI agent skills
├── .sisyphus/context/   # Persistent aesthetic profile storage
├── dist/                # Compiled JavaScript
├── opencode.json        # OpenCode MCP configuration
└── bridge-proxy.mjs     # Alternative WebSocket→JXA bridge (fallback)
```

---

## 🧪 Testing

```bash
# All tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Build
npm run build

# Lint
npm run lint
```

---

## 📋 Requirements

- **Adobe InDesign** 2022 or later (2024/2025/2026 recommended)
- **macOS** (Windows support via CEP planned)
- **Node.js** 18+

---

## 🤝 Contributing

PRs welcome. The handler pattern is straightforward:

1. Create `src/handlers/YourHandler.ts`
2. Implement tools with Zod parameter schemas
3. Register in `IndesignMcpServer.ts`
4. Add tests in `tests/`

---

## 📄 License

MIT
