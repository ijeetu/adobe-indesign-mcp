import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';

// ── Hoisted mocks ──

const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── SUT ──

import { loadConfig } from '../../src/utils/configLoader.js';

describe('configLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return defaults when no config path provided and default file missing', () => {
      mockExistsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config).toEqual({
        bridge: { port: 8120, host: '127.0.0.1', maxPayload: 1048576, timeout: 30000 },
        httpBridge: { enabled: false, port: 3000, host: '127.0.0.1', token: '' },
        server: { transport: 'stdio', name: 'indesign-nutria-mcp', version: '1.0.0' },
        logging: { level: 'info' },
      });
    });

    it('should load and validate config from provided path', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          bridge: { port: 9000, timeout: 60000 },
          logging: { level: 'debug' },
        }),
      );

      const config = loadConfig('/custom/path/config.json');

      expect(config.bridge.port).toBe(9000);
      expect(config.bridge.timeout).toBe(60000);
      expect(config.logging.level).toBe('debug');
      // Defaults for unspecified fields
      expect(config.bridge.host).toBe('127.0.0.1');
      expect(config.server.transport).toBe('stdio');
    });

    it('should try indesign-nutria-mcp.json when no path and default exists', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('indesign-nutria-mcp.json');
      });
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          bridge: { host: '0.0.0.0' },
          httpBridge: { enabled: true, token: 'abc123' },
        }),
      );

      const config = loadConfig();

      expect(config.bridge.host).toBe('0.0.0.0');
      expect(config.httpBridge.enabled).toBe(true);
      expect(config.httpBridge.token).toBe('abc123');
      expect(config.httpBridge.port).toBe(3000); // default
    });

    it('should fall back to defaults when config file is invalid JSON', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not valid json');

      const config = loadConfig('/bad/config.json');

      // Falls back to defaults on parse error
      expect(config.bridge.port).toBe(8120);
      expect(config.logging.level).toBe('info');
    });

    it('should fall back to defaults when config fails Zod validation', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ bridge: { port: 'not-a-number' } }),
      );

      const config = loadConfig('/invalid/config.json');

      expect(config.bridge.port).toBe(8120); // default
    });

    it('should handle all bridge config overrides', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          bridge: { port: 9090, host: '0.0.0.0', maxPayload: 2097152, timeout: 120000 },
        }),
      );

      const config = loadConfig('/full/config.json');

      expect(config.bridge).toEqual({
        port: 9090,
        host: '0.0.0.0',
        maxPayload: 2097152,
        timeout: 120000,
      });
    });

    it('should handle server config overrides', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          server: { transport: 'websocket', name: 'custom', version: '2.0.0' },
        }),
      );

      const config = loadConfig('/server/config.json');

      expect(config.server).toEqual({
        transport: 'websocket',
        name: 'custom',
        version: '2.0.0',
      });
    });

    it('should reject invalid transport value', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ server: { transport: 'invalid' } }),
      );

      const config = loadConfig('/bad-transport.json');

      // Falls back to defaults due to Zod validation failure
      expect(config.server.transport).toBe('stdio');
    });

    it('should reject invalid logging level', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ logging: { level: 'trace' } }),
      );

      const config = loadConfig('/bad-log-level.json');

      expect(config.logging.level).toBe('info'); // default
    });

    it('should call existsSync with resolved absolute path', () => {
      const absolutePath = resolve('/resolved/path.json');
      mockExistsSync.mockReturnValue(false);

      loadConfig('/resolved/path.json');

      expect(mockExistsSync).toHaveBeenCalledWith(absolutePath);
    });
  });
});
