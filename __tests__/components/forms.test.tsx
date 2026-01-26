/**
 * Component Tests for Form and Utility Components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

// Mock the useLanguage hook to return English translations
jest.mock('@/components/providers/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: () => ({
    t: {
      common: {
        cancel: 'Cancel',
        delete: 'Delete',
      },
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}))

describe('FormInput Component', () => {
  test('renders input with label', () => {
    render(
      <FormInput
        label="Test Label"
        name="testInput"
        type="text"
        value=""
        onChange={() => {}}
      />
    )

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('displays error message', () => {
    render(
      <FormInput
        label="Test Label"
        name="testInput"
        type="text"
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  test('handles input changes', () => {
    const handleChange = jest.fn()
    render(
      <FormInput
        label="Test Label"
        name="testInput"
        type="text"
        value=""
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })

    expect(handleChange).toHaveBeenCalled()
  })

  test('renders different input types', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        value=""
        onChange={() => {}}
      />
    )

    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  test('shows required indicator', () => {
    render(
      <FormInput
        label="Required Field"
        name="required"
        type="text"
        value=""
        onChange={() => {}}
        required
      />
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

describe('FormSelect Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  test('renders select with options', () => {
    render(
      <FormSelect
        label="Test Select"
        name="testSelect"
        value=""
        onChange={() => {}}
        options={options}
      />
    )

    expect(screen.getByLabelText('Test Select')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  test('displays error message', () => {
    render(
      <FormSelect
        label="Test Select"
        name="testSelect"
        value=""
        onChange={() => {}}
        options={options}
        error="Please select an option"
      />
    )

    expect(screen.getByText('Please select an option')).toBeInTheDocument()
  })

  test('handles selection changes', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(
      <FormSelect
        label="Test Select"
        name="testSelect"
        value=""
        onChange={handleChange}
        options={options}
      />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'option1')

    expect(handleChange).toHaveBeenCalled()
  })

  test('shows selected value', () => {
    render(
      <FormSelect
        label="Test Select"
        name="testSelect"
        value="option2"
        onChange={() => {}}
        options={options}
      />
    )

    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument()
  })

  test('shows required indicator', () => {
    render(
      <FormSelect
        label="Required Select"
        name="required"
        value=""
        onChange={() => {}}
        options={options}
        required
      />
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

describe('LoadingSpinner Component', () => {
  test('renders spinner with default message', () => {
    render(<LoadingSpinner />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('renders spinner with custom message', () => {
    render(<LoadingSpinner text="Custom message" />)

    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  test('renders spinner with custom size', () => {
    render(<LoadingSpinner size="lg" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })
})

describe('ErrorMessage Component', () => {
  test('renders error message', () => {
    render(<ErrorMessage message="Test error message" />)

    const errorMessages = screen.getAllByText('Test error message')
    expect(errorMessages.length).toBeGreaterThan(0)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    render(<ErrorMessage message="Error" />)

    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveClass('rounded-xl')
  })

  test('handles empty message', () => {
    render(<ErrorMessage message="" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('DeleteConfirmModal Component', () => {
  const mockOnConfirm = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders modal when open', () => {
    render(
      <LanguageProvider>
        <DeleteConfirmModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Delete Item"
          message="Are you sure you want to delete this item?"
        />
      </LanguageProvider>
    )

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    render(
      <LanguageProvider>
        <DeleteConfirmModal
          isOpen={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Delete Item"
          message="Are you sure?"
        />
      </LanguageProvider>
    )

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })

  test('calls onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <DeleteConfirmModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Delete Item"
          message="Are you sure?"
        />
      </LanguageProvider>
    )

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <DeleteConfirmModal
          isOpen={true}
          onClose={mockOnCancel}
          onConfirm={mockOnConfirm}
          title="Delete Item"
          message="Are you sure?"
        />
      </LanguageProvider>
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})