import type { ToolResult } from '../types/index.js';

export class InDesignError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(message: string, code: string = 'INDESIGN_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'InDesignError';
    this.code = code;
    this.originalError = originalError;
  }
}

function parseResult(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function isExtendScriptError(obj: unknown): obj is { __extendscript_error: true; message: string; line: number; fileName?: string; stack?: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as Record<string, unknown>).__extendscript_error === true
  );
}

export function formatResponse(data: unknown): ToolResult {
  const parsed = parseResult(data);

  if (isExtendScriptError(parsed)) {
    const parts = [`ExtendScript error: ${parsed.message}`, `Line: ${parsed.line}`];
    if (parsed.fileName) parts.push(`File: ${parsed.fileName}`);
    if (parsed.stack) parts.push(`Stack:\n${parsed.stack}`);
    return {
      content: [{ type: 'text', text: parts.join('\n') }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(parsed ?? 'ok') }],
  };
}

export function formatErrorResponse(error: Error | string): ToolResult {
  const message = error instanceof Error ? error.message : error;
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
