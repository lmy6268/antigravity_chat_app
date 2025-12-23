// Jest 전역 설정
import '@testing-library/jest-dom';
import { createRequire } from 'module';
import { TextEncoder, TextDecoder } from 'util';

const require = createRequire(import.meta.url);
const { ReadableStream, WritableStream } = require('node:stream/web');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;

// Fetch API Polyfills
if (!global.Request) {
  const { Request, Response, Headers } = require('cross-fetch');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}

// Compression API Polyfills (Minimal mocks for testing)
if (!global.CompressionStream) {
  global.CompressionStream = class {
    constructor() {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
    }
  };
}
if (!global.DecompressionStream) {
  global.DecompressionStream = class {
    constructor() {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
    }
  };
}

// Polyfill Blob.stream (missing in some node environments during tests)
if (typeof Blob !== 'undefined' && !Blob.prototype.stream) {
  Blob.prototype.stream = function () {
    const blob = this;
    return new global.ReadableStream({
      async start(controller) {
        const buffer = await blob.arrayBuffer();
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });
  };
}

// Polyfill Response.json if missing (for NextResponse)
if (!global.Response.json) {
  global.Response.json = (data, init) => {
    return new global.Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init && init.headers),
      },
    });
  };
}

console.log('Jest setup loaded');

// Web Crypto API 모킹 (jsdom에는 없음)
if (typeof window !== 'undefined') {
  const crypto = require('crypto');

  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr) => crypto.randomBytes(arr.length),
      subtle: {
        importKey: jest.fn(),
        deriveKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    },
  });
}
