/**
 * Component Tests for React Components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadZone from '@/components/UploadZone'
import ErrorBoundary from '@/components/ErrorBoundary'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

// Mock pdfjs-dist to avoid ES module issues
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 100, height: 100 })),
        render: jest.fn(() => ({
          promise: Promise.resolve()
        }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  version: '3.11.174'
}))

// Mock childId for UploadZone tests
const mockChildId = 'test-child-id'

describe('UploadZone Component', () => {
  const mockOnFileSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders upload zone initially', () => {
    render(<UploadZone childId={mockChildId} />)

    expect(screen.getByText('Upload Test Pages')).toBeInTheDocument()
    expect(screen.getByText(/Accepts JPG, PNG, PDF/)).toBeInTheDocument()
  })

  test('handles file drop', async () => {
    const user = userEvent.setup()
    render(<UploadZone childId={mockChildId} />)

    const dropZone = screen.getByText('Upload Test Pages').closest('div')

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [file],
      },
    }

    fireEvent.drop(dropZone!, dropEvent as any)

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
  })

  test('validates file types', async () => {
    const user = userEvent.setup()
    render(<UploadZone childId={mockChildId} />)

    const dropZone = screen.getByText('Upload Test Pages').closest('div')

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [invalidFile],
      },
    }

    fireEvent.drop(dropZone!, dropEvent as any)

    await waitFor(() => {
      expect(screen.getByText(/Only JPG, PNG, and PDF files are allowed/)).toBeInTheDocument()
    })
  })

  test('validates file size', async () => {
    const user = userEvent.setup()
    render(<UploadZone childId={mockChildId} />)

    const dropZone = screen.getByText('Upload Test Pages').closest('div')

    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [largeFile],
      },
    }

    fireEvent.drop(dropZone!, dropEvent as any)

    await waitFor(() => {
      expect(screen.getByText(/File must be less than 4.5MB/)).toBeInTheDocument()
    })
  })

  test('handles file input change', async () => {
    render(<UploadZone childId={mockChildId} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
  })

  test('removes files', async () => {
    const user = userEvent.setup()
    render(<UploadZone childId={mockChildId} />)

    const dropZone = screen.getByText('Upload Test Pages').closest('div')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    fireEvent.drop(dropZone!, {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [file] },
    } as any)

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })

    const removeButton = screen.getByLabelText('Remove file')
    await user.click(removeButton)

    expect(screen.queryByText('test.jpg')).not.toBeInTheDocument()
  })
})

describe('ErrorBoundary Component', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  test('catches and displays errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>No error here</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('No error here')).toBeInTheDocument()
  })

  test('renders custom fallback', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})

describe('LanguageProvider', () => {
  test('provides language context', () => {
    const TestComponent = () => {
      return <div>Language context works</div>
    }

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    expect(screen.getByText('Language context works')).toBeInTheDocument()
  })
})