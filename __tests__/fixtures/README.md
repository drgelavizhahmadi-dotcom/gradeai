# Test Fixtures

This directory should contain test files for E2E testing:

## Required Files:
- `sample-test.jpg` - A sample test paper image (JPG format, < 4MB)
- `sample-test.pdf` - A sample test paper PDF (< 4MB)
- `large-file.jpg` - A file exceeding 4MB limit for testing validation
- `invalid-file.txt` - A non-image file for testing file type validation

## Creating Test Files:
1. Use real test papers (with permission/anonymized)
2. Ensure files are representative of actual usage
3. Keep file sizes reasonable for testing
4. Include various formats that users might upload

## Note:
These files are not included in the repository for size reasons.
Add them locally when running E2E tests.