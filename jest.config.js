const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로 제공
  dir: './',
})

// Jest에 전달할 커스텀 설정
const customJestConfig = {
  // 각 테스트 전에 실행할 설정 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 테스트 환경 설정
  testEnvironment: 'jest-environment-jsdom',
  
  // 모듈 경로 별칭 (tsconfig.json과 동일하게)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.test.tsx',
  ],
  
  // 커버리지 수집 대상
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  
  // 무시할 경로
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  
  // 변환 설정
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
}

// createJestConfig는 비동기로 Next.js 설정을 로드하므로 export
module.exports = createJestConfig(customJestConfig)
