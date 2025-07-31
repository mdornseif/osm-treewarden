# Testing Guide

## Test Structure

```
├── src/components/__tests__/     # Unit tests
├── src/test/                     # Test utilities
├── tests/                        # E2E tests
├── vitest.config.ts             # Vitest config
└── playwright.config.ts         # Playwright config
```

## Commands

```bash
# Unit tests
npm test
npm run test:ui
npm run test:run

# E2E tests
npm run test:e2e
npm run test:e2e:ui
```

## Test Coverage

### BaseMap Component

**Unit Tests** (`src/components/__tests__/BaseMap.test.tsx`)
- Rendering: container, tile layer, attribution, children
- Props: center, zoom, styling
- Integration: TreeLayer, multiple children
- Accessibility: container structure

**E2E Tests** (`tests/BaseMap.spec.ts`)
- Rendering and display
- Map interactions (zoom, pan)
- Default configuration
- Responsive design
- Performance
- Accessibility
- Error handling

## Configuration

### Vitest
- jsdom environment
- React plugin
- CSS imports enabled
- Excludes: `tests/`, `**/*.spec.ts`, `node_modules/`

### Playwright
- Chromium, Firefox, WebKit
- Web server: `npm run dev`
- Screenshots/traces on failure

## Test Utilities

```typescript
import { mockTrees, mockBounds, waitForMapReady } from '../test/helpers';

// Mock data
const trees = mockTrees;
const bounds = mockBounds;

// Playwright helpers
await waitForMapReady(page);
const center = await getMapCenter(page);
```

## Writing Tests

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByTestId('my-component')).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('feature works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.my-element')).toBeVisible();
});
```

## Debugging

```bash
# Unit tests
npm test BaseMap.test.tsx
npm test -- --debug

# E2E tests
npm run test:e2e:headed
npx playwright test BaseMap.spec.ts --debug
```

## CI/CD

- Unit tests: Fast feedback, >80% coverage
- E2E tests: Cross-browser, critical workflows
- Screenshots/traces on failure 