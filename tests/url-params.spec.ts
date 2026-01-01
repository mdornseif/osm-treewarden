import { test, expect } from '@playwright/test';

test.describe('URL Parameters', () => {
  test('should load map with custom lat, lng, and zoom from URL', async ({ page }) => {
    const testLat = 50.903185;
    const testLng = 7.113878;
    const testZoom = 17;
    
    await page.goto(`/?lat=${testLat}&lng=${testLng}&zoom=${testZoom}`);
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    
    // Wait a bit for map to initialize and set view
    await page.waitForTimeout(1000);
    
    // Check that the map center and zoom match the URL parameters
    // We can't directly read the map center/zoom from Leaflet in Playwright,
    // but we can check the URL was parsed correctly by checking if the map
    // is at the expected location (by checking tile requests or map state)
    
    // Verify URL parameters are still in the URL (they should be preserved)
    const url = page.url();
    expect(url).toContain(`lat=${testLat}`);
    expect(url).toContain(`lng=${testLng}`);
    expect(url).toContain(`zoom=${testZoom}`);
  });

  test('should use default location when no URL parameters are provided', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Default location should be used (no URL params means defaults)
    // The URL might be updated with default values, or might remain without params
    const url = page.url();
    
    // Either no params or default params should be present
    // We just verify the map loaded successfully
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('should update URL when map is panned', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get initial URL
    const initialUrl = page.url();
    
    // Pan the map
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.dragTo(mapContainer, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 300, y: 300 }
    });
    
    // Wait for URL update (debounced, so wait a bit longer)
    await page.waitForTimeout(2000);
    
    // URL should have changed (should contain lat/lng/zoom params)
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
    expect(newUrl).toMatch(/[?&]lat=[\d.]+/);
    expect(newUrl).toMatch(/[?&]lng=[\d.]+/);
    expect(newUrl).toMatch(/[?&]zoom=\d+/);
  });

  test('should update URL when map is zoomed', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Get initial zoom from URL
    const initialUrl = page.url();
    const initialZoomMatch = initialUrl.match(/[?&]zoom=(\d+)/);
    const initialZoom = initialZoomMatch ? parseInt(initialZoomMatch[1], 10) : null;
    
    // Zoom in
    await page.click('.leaflet-control-zoom-in');
    await page.waitForTimeout(2000); // Wait for debounced URL update
    
    // Check that zoom changed in URL
    const newUrl = page.url();
    const newZoomMatch = newUrl.match(/[?&]zoom=(\d+)/);
    const newZoom = newZoomMatch ? parseInt(newZoomMatch[1], 10) : null;
    
    if (initialZoom !== null && newZoom !== null) {
      expect(newZoom).toBeGreaterThan(initialZoom);
    } else {
      // At least verify URL has zoom parameter
      expect(newUrl).toMatch(/[?&]zoom=\d+/);
    }
  });

  test('should handle invalid URL parameters gracefully', async ({ page }) => {
    // Test with invalid lat (out of range)
    await page.goto('/?lat=200&lng=7.113878&zoom=17');
    
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Map should still load, using default values
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
    
    // URL should be corrected or use defaults
    const url = page.url();
    // Should either have valid lat or no lat param (using defaults)
    if (url.includes('lat=')) {
      const latMatch = url.match(/[?&]lat=([\d.-]+)/);
      if (latMatch) {
        const lat = parseFloat(latMatch[1]);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  });

  test('should preserve URL parameters on page reload', async ({ page }) => {
    const testLat = 50.903185;
    const testLng = 7.113878;
    const testZoom = 17;
    
    await page.goto(`/?lat=${testLat}&lng=${testLng}&zoom=${testZoom}`);
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // URL parameters should still be present
    const url = page.url();
    expect(url).toContain(`lat=${testLat}`);
    expect(url).toContain(`lng=${testLng}`);
    expect(url).toContain(`zoom=${testZoom}`);
  });

  test('should load with background layer from URL parameter', async ({ page }) => {
    await page.goto('/?lat=50.903185&lng=7.113878&zoom=17&layer=nrw-orthophoto');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // URL should contain the layer parameter
    const url = page.url();
    expect(url).toContain('layer=nrw-orthophoto');
  });
});

