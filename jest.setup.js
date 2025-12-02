// Jest 전역 설정
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Fetch API Polyfills
if (!global.Request) {
  const { Request, Response, Headers } = require('cross-fetch')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}

// Polyfill Response.json if missing (for NextResponse)
if (!global.Response.json) {
  global.Response.json = (data, init) => {
    return new global.Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init && init.headers)
      }
    })
  }
}

console.log('Jest setup loaded')

// Web Crypto API 모킹 (jsdom에는 없음)
if (typeof window !== 'undefined') {
  const crypto = require('crypto')
  
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr) => crypto.randomBytes(arr.length),
      subtle: {
        importKey: jest.fn(),
        deriveKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
      },
    },
  })
}
