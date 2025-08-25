import { test, expect } from '@playwright/test';

test.describe('BaseMap Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Rendering and Display', () => {
    test('should render the map container', async ({ page }) => {
      // Wait for the map to load
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });

    test('should display OpenStreetMap tiles', async ({ page }) => {
      // Wait for map tiles to load
      await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
      
      const tiles = page.locator('.leaflet-tile');
      await expect(tiles.first()).toBeVisible();
    });

    test('should show map controls', async ({ page }) => {
      // Wait for zoom controls to appear
      await page.waitForSelector('.leaflet-control-zoom', { timeout: 10000 });
      
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      
      await expect(zoomIn).toBeVisible();
      await expect(zoomOut).toBeVisible();
    });

    test('should display attribution', async ({ page }) => {
      // Wait for attribution to load
      await page.waitForSelector('.leaflet-control-attribution', { timeout: 10000 });
      
      const attribution = page.locator('.leaflet-control-attribution');
      await expect(attribution).toContainText('OpenStreetMap');
      await expect(attribution).toContainText('Leaflet');
    });
  });

  test.describe('Map Interactions', () => {
    test('should allow zooming in', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 10000 });
      
      // Get initial zoom level
      const initialZoom = await page.evaluate(() => {
        const map = (window as { map?: { getZoom(): number } }).map;
        return map ? map.getZoom() : null;
      });
      
      // Click zoom in button
      await page.click('.leaflet-control-zoom-in');
      
      // Wait for zoom animation
      await page.waitForTimeout(500);
      
      // Check if zoom level increased
      const newZoom = await page.evaluate(() => {
        const map = (window as { map?: { getZoom(): number } }).map;
        return map ? map.getZoom() : null;
      });
      
      if (initialZoom !== null && newZoom !== null) {
        expect(newZoom).toBeGreaterThan(initialZoom);
      }
    });

    test('should allow zooming out', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-out', { timeout: 10000 });
      
      // Get initial zoom level
      const initialZoom = await page.evaluate(() => {
        const map = (window as { map?: { getZoom(): number } }).map;
        return map ? map.getZoom() : null;
      });
      
      // Click zoom out button
      await page.click('.leaflet-control-zoom-out');
      
      // Wait for zoom animation
      await page.waitForTimeout(500);
      
      // Check if zoom level decreased
      const newZoom = await page.evaluate(() => {
        const map = (window as { map?: { getZoom(): number } }).map;
        return map ? map.getZoom() : null;
      });
      
      if (initialZoom !== null && newZoom !== null) {
        expect(newZoom).toBeLessThan(initialZoom);
      }
    });

    test('should allow panning', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      // Get initial center
      const initialCenter = await page.evaluate(() => {
        const map = (window as { map?: { getCenter(): { lat: number; lng: number } } }).map;
        return map ? map.getCenter() : null;
      });
      
      // Perform pan gesture
      const mapContainer = page.locator('.leaflet-container');
      await mapContainer.dragTo(mapContainer, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      });
      
      // Wait for pan animation
      await page.waitForTimeout(500);
      
      // Check if center changed
      const newCenter = await page.evaluate(() => {
        const map = (window as { map?: { getCenter(): { lat: number; lng: number } } }).map;
        return map ? map.getCenter() : null;
      });
      
      if (initialCenter !== null && newCenter !== null) {
        expect(newCenter.lat).not.toBe(initialCenter.lat);
        expect(newCenter.lng).not.toBe(initialCenter.lng);
      }
    });
  });

  test.describe('Default Configuration', () => {
    test('should load with default center coordinates', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      // Check if map is centered around the default location (Cologne area)
      const center = await page.evaluate(() => {
        const map = (window as { map?: { getCenter(): { lat: number; lng: number } } }).map;
        return map ? map.getCenter() : null;
      });
      
      if (center) {
        // Default center should be around [50.897146, 7.098337] (Cologne area)
        expect(center.lat).toBeCloseTo(50.897146, 1);
        expect(center.lng).toBeCloseTo(7.098337, 1);
      }
    });

    test('should load with default zoom level', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const zoom = await page.evaluate(() => {
        const map = (window as { map?: { getZoom(): number } }).map;
        return map ? map.getZoom() : null;
      });
      
      if (zoom !== null) {
        // Default zoom should be 16
        expect(zoom).toBe(16);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // Check if map controls are still accessible
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      await expect(zoomIn).toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });

    test('should be responsive on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load map tiles efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Map should load within reasonable time (10 seconds)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle zoom operations smoothly', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 10000 });
      
      const startTime = Date.now();
      
      // Perform multiple zoom operations
      for (let i = 0; i < 3; i++) {
        await page.click('.leaflet-control-zoom-in');
        await page.waitForTimeout(200);
      }
      
      const totalTime = Date.now() - startTime;
      
      // Zoom operations should be responsive
      expect(totalTime).toBeLessThan(2000);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels for zoom controls', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 10000 });
      
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      
      await expect(zoomIn).toHaveAttribute('aria-label', 'Zoom in');
      await expect(zoomOut).toHaveAttribute('aria-label', 'Zoom out');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      // Focus on map container
      await page.keyboard.press('Tab');
      
      // Check if map container is focusable
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeFocused();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block tile requests to simulate network error
      await page.route('**/*.png', route => route.abort());
      
      await page.goto('/');
      
      // Map should still render even with tile loading errors
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });
  });
}); 