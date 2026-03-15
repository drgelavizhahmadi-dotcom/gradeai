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

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user', name: 'Test User' } },
    status: 'authenticated',
    update: jest.fn(),
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next-auth (server side)
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(() => Promise.resolve(null)),
}))
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock LanguageProvider
jest.mock('@/components/providers/LanguageProvider', () => {
  const { getTranslation } = require('@/lib/translations');
  const enTranslations = getTranslation('en');

  return {
    LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
    useLanguage: () => ({
      language: 'en',
      setLanguage: jest.fn(),
      t: enTranslations,
    }),
  };
});

// Mock environment variables
;(process.env as any).NODE_ENV = 'test'
;(process.env as any).DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
;(process.env as any).NEXTAUTH_SECRET = 'test-secret'
;(process.env as any).NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
;(global as any).fetch = jest.fn()
;(global as any).Request = jest.fn()
;(global as any).Response = jest.fn()
import { TextEncoder, TextDecoder } from 'util'
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

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