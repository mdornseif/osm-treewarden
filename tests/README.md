# End-to-End Tests

This directory contains comprehensive end-to-end tests for the TreeWarden application using Playwright.

## Test Structure

### Test Files

- **`BaseMap.spec.ts`** - Comprehensive tests for the main application functionality
- **`URLParameters.spec.ts`** - Focused tests for URL parameter functionality
- **`BackgroundLayer.spec.ts`** - Focused tests for background layer switching
- **`Simplified.spec.ts`** - Simplified tests using test helpers (recommended for most testing)

### Test Utilities

- **`utils/test-helpers.ts`** - Reusable test helper functions
- **`global-setup.ts`** - Global test setup
- **`global-teardown.ts`** - Global test cleanup

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test BaseMap.spec.ts
```

### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode
```bash
npm run test:e2e:headed
```

### Run Tests with Debugging
```bash
npx playwright test --debug
```

## Test Configuration

The tests are configured in `playwright.config.ts` with the following features:

- **Retries**: 1 retry for local development, 2 for CI
- **Timeouts**: 60 seconds global timeout, 10 seconds for expectations
- **Browsers**: Chromium (all environments), Firefox and WebKit (local only)
- **Viewport**: 1280x720 for consistent testing
- **Screenshots**: On failure
- **Videos**: On failure in CI

## Test Categories

### 1. Basic Functionality
- Application loading
- Map rendering
- Map tile loading
- UI component visibility

### 2. Map Interactions
- Zoom in/out
- Panning
- URL parameter updates
- Map controls functionality

### 3. URL Parameters
- Parameter parsing
- Parameter validation
- Parameter updates
- Parameter persistence
- Edge case handling

### 4. Background Layer
- Layer selector UI
- Layer switching
- Layer persistence
- Error handling
- Responsive design

### 5. Error Handling
- Network errors
- Slow network conditions
- Invalid parameters
- Resource blocking

### 6. Responsive Design
- Mobile viewport
- Tablet viewport
- Desktop viewport
- UI element accessibility

### 7. Cross-browser Compatibility
- Chromium
- Firefox
- WebKit

## Test Helpers

The `TestHelpers` class provides reusable functions for common test operations:

### Map Operations
```typescript
const helpers = createTestHelpers(page);

// Wait for app to load
await helpers.waitForAppLoad();

// Wait for map tiles
await helpers.waitForMapTiles();

// Verify map is visible
await helpers.expectMapVisible();

// Verify map controls
await helpers.expectMapControlsVisible();
```

### Map Interactions
```typescript
// Zoom operations
await helpers.zoomIn();
await helpers.zoomOut();

// Pan operation
await helpers.panMap(100, 100, 300, 300);
```

### URL Parameters
```typescript
// Get current parameters
const params = helpers.getUrlParams();

// Verify parameters
await helpers.expectUrlParams({
  lat: 51.5074,
  lng: -0.1278,
  zoom: 15,
  layer: 'osm'
});
```

### Background Layer
```typescript
// Open/close panel
await helpers.openBackgroundLayerPanel();
await helpers.closeBackgroundLayerPanel();

// Switch layers
await helpers.switchBackgroundLayer('osm');
await helpers.switchBackgroundLayer('nrw-orthophoto');
```

### Responsive Testing
```typescript
// Set viewport
await helpers.setViewport('mobile');
await helpers.setViewport('tablet');
await helpers.setViewport('desktop');
```

### Network Simulation
```typescript
// Simulate slow network
await helpers.simulateSlowNetwork();

// Block resources
await helpers.blockResources(['**/*.png', '**/*.jpg']);
```

### Debugging
```typescript
// Take screenshot
await helpers.takeScreenshot('test-name');

// Log page state
await helpers.logPageState();
```

## Best Practices

### 1. Use Test Helpers
Prefer using the `TestHelpers` class for common operations to ensure consistency and reduce code duplication.

### 2. Proper Waiting
Always wait for elements to be present before interacting with them:
```typescript
await page.waitForSelector('.leaflet-container', { timeout: 15000 });
```

### 3. URL Parameter Testing
Test URL parameters by checking the actual URL rather than internal state:
```typescript
const url = page.url();
expect(url).toContain('lat=51.5074');
```

### 4. Error Handling
Test both success and failure scenarios:
```typescript
// Test invalid parameters
await page.goto('/?lat=invalid&lng=invalid');
// Verify fallback to defaults
```

### 5. Responsive Testing
Test on multiple viewport sizes:
```typescript
await page.setViewportSize({ width: 375, height: 667 });
```

### 6. Network Conditions
Test under various network conditions:
```typescript
// Block resources to simulate network errors
await page.route('**/*.png', route => route.abort());
```

## Debugging Tests

### 1. Run in Debug Mode
```bash
npx playwright test --debug
```

### 2. Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### 3. Log Page State
```typescript
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());
```

### 4. Use Test Helpers Debugging
```typescript
const helpers = createTestHelpers(page);
await helpers.logPageState();
await helpers.takeScreenshot('debug');
```

## CI/CD Integration

The tests are configured to run in CI environments with:

- **Retries**: 2 retries for flaky tests
- **Single Browser**: Chromium only for faster execution
- **Artifacts**: Screenshots and videos on failure
- **JSON Reports**: For integration with CI systems

## Maintenance

### Adding New Tests
1. Create a new test file or add to existing appropriate file
2. Use test helpers for common operations
3. Follow the existing test structure and naming conventions
4. Add proper error handling and edge cases

### Updating Selectors
If UI changes occur, update selectors in:
1. Test files
2. Test helpers
3. Global setup

### Performance
- Keep tests focused and fast
- Use appropriate timeouts
- Avoid unnecessary waits
- Use test helpers for efficiency

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeouts or check for slow network
2. **Selectors not found**: Verify UI hasn't changed
3. **Flaky tests**: Add retries or improve waiting logic
4. **Network errors**: Check if external services are available

### Debug Commands
```bash
# Run with verbose output
npx playwright test --verbose

# Run with trace
npx playwright test --trace on

# Run specific test with debugging
npx playwright test --debug --grep "test name"
```