# Testing Guide

This document outlines the comprehensive test suite for the GradeAI application.

## Test Structure

```
__tests__/
├── unit/                 # Unit tests for utilities and pure functions
│   ├── utils.test.ts    # Tests for utility functions
├── integration/         # Integration tests for API endpoints
│   ├── api.test.ts      # Tests for API routes
├── components/          # Component tests for React components
│   ├── ui.test.tsx      # Tests for basic UI components
│   ├── GradeAIParentReport.test.tsx  # Tests for main report component
│   ├── analysis.test.tsx # Tests for analysis display components
│   └── forms.test.tsx   # Tests for form components
└── e2e/                 # End-to-end tests for user flows
    └── user-flows.test.ts
```

## Test Types

### Unit Tests
- Test individual functions and utilities
- Mock external dependencies
- Focus on logic and edge cases

### Integration Tests
- Test API endpoints with mocked database/auth
- Verify request/response handling
- Test error scenarios

### Component Tests
- Test React components in isolation
- Verify rendering and user interactions
- Mock child components and hooks

### End-to-End Tests
- Test complete user workflows
- Run against real application
- Verify cross-component interactions

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Set up test database (if needed)
3. Configure environment variables for testing

### Unit and Integration Tests
```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Component Tests
```bash
# Component tests are included in the main test suite
npm test
```

### End-to-End Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

## Test Configuration

### Jest Configuration
- Located in `jest.config.ts`
- Configured for TypeScript and React
- Includes coverage thresholds
- Uses jsdom for DOM simulation

### Playwright Configuration
- Located in `playwright.config.ts`
- Tests against multiple browsers
- Includes mobile testing
- Runs dev server automatically

## Test Data

### Mock Data
- Mock analysis results in `utils.test.ts`
- Mock API responses in `api.test.ts`
- Mock component props in component tests

### Test Fixtures
- Sample test images in `__tests__/fixtures/`
- Use realistic data that matches production schemas

## Writing Tests

### Unit Tests
```typescript
describe('convertGermanGrade', () => {
  test('converts numeric grades correctly', () => {
    expect(convertGermanGrade(1)).toBe('A+')
    expect(convertGermanGrade(4)).toBe('C')
  })
})
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'

test('renders component correctly', () => {
  render(<MyComponent prop="value" />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### API Integration Tests
```typescript
import request from 'supertest'

test('POST /api/upload returns 200', async () => {
  const response = await request(app)
    .post('/api/upload')
    .send(testData)
  expect(response.status).toBe(200)
})
```

### E2E Tests
```typescript
test('user can upload file', async ({ page }) => {
  await page.goto('/upload')
  await page.setInputFiles('input[type="file"]', 'test-file.jpg')
  await expect(page.locator('.success')).toBeVisible()
})
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical API endpoints
- **Component Tests**: All major UI components
- **E2E Tests**: All primary user flows

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Unit tests run on every commit
- E2E tests run on main branch and releases
- Coverage reports generated automatically

## Debugging Tests

### Common Issues
1. **Async tests**: Use `await` and `waitFor`
2. **Mocking**: Ensure all dependencies are properly mocked
3. **DOM queries**: Use appropriate query methods from Testing Library

### Debugging Tools
- `console.log` in tests (will appear in test output)
- `screen.debug()` to see DOM structure
- `--verbose` flag for detailed test output

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should explain what they verify
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Don't rely on real APIs/databases
5. **Test Edge Cases**: Include error states and boundary conditions
6. **Keep Tests Fast**: Avoid slow operations in unit tests