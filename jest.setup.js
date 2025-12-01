// Jest 전역 설정
import '@testing-library/jest-dom'

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
