import { test, expect } from '@playwright/test';

test.describe('URL Parameter Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('URL Parameter Parsing', () => {
    test('should parse valid URL parameters correctly', async ({ page }) => {
      await page.goto('/?lat=51.5074&lng=-0.1278&z=15&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Verify URL parameters are preserved
      const url = page.url();
      expect(url).toContain('lat=51.5074');
      expect(url).toContain('lng=-0.1278');
      expect(url).toContain('z=15');
      expect(url).toContain('layer=osm');
    });

    test('should handle partial URL parameters', async ({ page }) => {
      await page.goto('/?lat=40.7128&lng=-74.0060');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use default values for missing parameters
      const url = page.url();
      expect(url).toContain('lat=40.7128');
      expect(url).toContain('lng=-74.0060');
      expect(url).toContain('z='); // Should have default zoom
      expect(url).toContain('layer='); // Should have default layer
    });

    test('should handle empty URL parameters', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use all default values
      const url = page.url();
      expect(url).toContain('lat=');
      expect(url).toContain('lng=');
      expect(url).toContain('z=');
      expect(url).toContain('layer=');
    });
  });

  test.describe('URL Parameter Validation', () => {
    test('should handle invalid latitude values', async ({ page }) => {
      await page.goto('/?lat=invalid&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use default latitude
      const url = page.url();
      expect(url).toContain('lat=50.897146'); // Default latitude
      expect(url).toContain('lng=7.098337');
    });

    test('should handle invalid longitude values', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=invalid&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use default longitude
      const url = page.url();
      expect(url).toContain('lat=50.897146');
      expect(url).toContain('lng=7.098337'); // Default longitude
    });

    test('should handle invalid zoom levels', async ({ page }) => {
      // Test zoom level too high
      await page.goto('/?lat=50.897146&lng=7.098337&z=25&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      let url = page.url();
      expect(url).toContain('z=17'); // Should use default zoom
      
      // Test zoom level too low
      await page.goto('/?lat=50.897146&lng=7.098337&z=-5&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      url = page.url();
      expect(url).toContain('z=17'); // Should use default zoom
    });

    test('should handle invalid background layer values', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=invalid-layer');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use default layer
      const url = page.url();
      expect(url).toContain('layer=osm'); // Default layer
    });
  });

  test.describe('URL Parameter Updates', () => {
    test('should update URL when zooming in', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 15000 });
      
      const initialUrl = page.url();
      const initialZoom = new URLSearchParams(initialUrl.split('?')[1] || '').get('z');
      
      await page.click('.leaflet-control-zoom-in');
      await page.waitForTimeout(1000);
      
      const newUrl = page.url();
      const newZoom = new URLSearchParams(newUrl.split('?')[1] || '').get('z');
      
      expect(newZoom).toBeGreaterThan(initialZoom);
    });

    test('should update URL when zooming out', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-control-zoom-out', { timeout: 15000 });
      
      const initialUrl = page.url();
      const initialZoom = new URLSearchParams(initialUrl.split('?')[1] || '').get('z');
      
      await page.click('.leaflet-control-zoom-out');
      await page.waitForTimeout(1000);
      
      const newUrl = page.url();
      const newZoom = new URLSearchParams(newUrl.split('?')[1] || '').get('z');
      
      expect(newZoom).toBeLessThan(initialZoom);
    });

    test('should update URL when panning', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const initialUrl = page.url();
      const initialParams = new URLSearchParams(initialUrl.split('?')[1] || '');
      const initialLat = parseFloat(initialParams.get('lat') || '50.897146');
      const initialLng = parseFloat(initialParams.get('lng') || '7.098337');
      
      // Perform pan gesture
      const mapContainer = page.locator('.leaflet-container');
      await mapContainer.dragTo(mapContainer, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 300, y: 300 }
      });
      
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      const newParams = new URLSearchParams(newUrl.split('?')[1] || '');
      const newLat = parseFloat(newParams.get('lat') || '50.897146');
      const newLng = parseFloat(newParams.get('lng') || '7.098337');
      
      // Coordinates should have changed
      const latDiff = Math.abs(newLat - initialLat);
      const lngDiff = Math.abs(newLng - initialLng);
      expect(latDiff + lngDiff).toBeGreaterThan(0.001);
    });

    test('should update URL when changing background layer', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Click the background layer toggle
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      // Wait for the background layer panel to appear
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Select NRW orthophoto layer
      const nrwLayerOption = page.locator('input[value="nrw-orthophoto"]');
      if (await nrwLayerOption.isVisible()) {
        await nrwLayerOption.click();
        
        await page.waitForTimeout(2000);
        
        // Verify URL was updated
        const url = page.url();
        expect(url).toContain('layer=nrw-orthophoto');
      }
    });
  });

  test.describe('URL Parameter Persistence', () => {
    test('should preserve URL parameters on page refresh', async ({ page }) => {
      await page.goto('/?lat=51.5074&lng=-0.1278&z=15&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Refresh the page
      await page.reload();
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Verify parameters are still present
      const url = page.url();
      expect(url).toContain('lat=51.5074');
      expect(url).toContain('lng=-0.1278');
      expect(url).toContain('z=15');
      expect(url).toContain('layer=osm');
    });

    test('should preserve URL parameters on browser back/forward', async ({ page }) => {
      // Navigate to initial page
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Navigate to a different URL
      await page.goto('/?lat=51.5074&lng=-0.1278&z=15&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Go back
      await page.goBack();
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Verify original parameters are restored
      const url = page.url();
      expect(url).toContain('lat=50.897146');
      expect(url).toContain('lng=7.098337');
      expect(url).toContain('z=17');
      expect(url).toContain('layer=osm');
    });
  });

  test.describe('URL Parameter Edge Cases', () => {
    test('should handle very large coordinate values', async ({ page }) => {
      await page.goto('/?lat=90.0&lng=180.0&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should handle extreme values gracefully
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });

    test('should handle very small coordinate values', async ({ page }) => {
      await page.goto('/?lat=-90.0&lng=-180.0&z=17&layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should handle extreme values gracefully
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });

    test('should handle malformed URL parameters', async ({ page }) => {
      await page.goto('/?lat=&lng=&z=&layer=');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should use default values for empty parameters
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      const url = page.url();
      expect(url).toContain('lat=50.897146');
      expect(url).toContain('lng=7.098337');
      expect(url).toContain('z=17');
      expect(url).toContain('layer=osm');
    });

    test('should handle special characters in URL parameters', async ({ page }) => {
      // Test with URL-encoded special characters
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=osm%20test');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Should handle special characters gracefully
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });
  });
});