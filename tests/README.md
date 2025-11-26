# Jump to Recipe - Test Scripts

This directory contains test scripts for debugging and validating various functionality.

## API Testing

- `test-api.js` - General API endpoint testing
- `test-import-api.js` - Recipe import API testing
- `test-import-api.mjs` - ES module version of import API tests
- `validate-import.js` - Validate import API endpoint

## Recipe Import Testing

- `test-import-debug.js` - Debug recipe import functionality
- `test-joyfood-parsing.js` - Test parsing of JoyFood Sunshine recipes
- `test-scraper.js` - Test web scraping functionality

## Cookbook Testing

- `test-cookbook-api.js` - Cookbook API endpoint testing
- `test-cookbook-creation.js` - Cookbook creation functionality
- `test-cookbook-image-error-handling.js` - Image upload error handling

## Grocery List Testing

- `test-grocery-list-api.js` - Grocery list API testing
- `test-grocery-list-logic.js` - Grocery list generation logic
- `test-grocery-list-simple.js` - Simple grocery list tests
- `test-grocery-ui-components.js` - Grocery list UI component tests

## Comments & Validation

- `test-comments-api.js` - Comments API testing
- `test-enhanced-image-validation.js` - Enhanced image validation tests

## Usage

Run tests from the project root:
```bash
node tests/test-api.js
node tests/test-import-debug.js
node tests/validate-import.js
# ... etc
```

These are development/debugging scripts, not part of the main test suite.