import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock environment variables
;(process.env as any).NODE_ENV = 'test'
;(process.env as any).DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
;(process.env as any).NEXTAUTH_SECRET = 'test-secret'
;(process.env as any).NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
;(global as any).fetch = jest.fn()
;(global as any).Request = jest.fn()
;(global as any).Response = jest.fn()

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})