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

    test('should show map controls', async ({ page }) => {
      // Wait for zoom controls to appear
      await page.waitForSelector('.leaflet-control-zoom', { timeout: 10000 });
      
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      
      await expect(zoomIn).toBeVisible();
      await expect(zoomOut).toBeVisible();
    });

    test('should display background layer selector', async ({ page }) => {
      // Wait for background layer selector to appear
      await page.waitForSelector('[data-testid="background-layer-toggle"]', { timeout: 10000 });
      
      const layerToggle = page.locator('[data-testid="background-layer-toggle"]');
      await expect(layerToggle).toBeVisible();
    });
  });

  test.describe('Map Interactions', () => {
    test('should allow zooming in', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 10000 });
      
      // Click zoom in button
      await page.click('.leaflet-control-zoom-in');
      
      // Wait for zoom animation
      await page.waitForTimeout(500);
      
      // Verify the zoom button is still visible (no errors occurred)
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      await expect(zoomIn).toBeVisible();
    });

    test('should allow zooming out', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-out', { timeout: 10000 });
      
      // Click zoom out button
      await page.click('.leaflet-control-zoom-out');
      
      // Wait for zoom animation
      await page.waitForTimeout(500);
      
      // Verify the zoom button is still visible (no errors occurred)
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      await expect(zoomOut).toBeVisible();
    });

    test('should allow panning', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      // Perform pan gesture
      const mapContainer = page.locator('.leaflet-container');
      await mapContainer.dragTo(mapContainer, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      });
      
      // Wait for pan animation
      await page.waitForTimeout(500);
      
      // Verify the map container is still visible (no errors occurred)
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Background Layer Functionality', () => {
    test('should open background layer selector when clicked', async ({ page }) => {
      await page.waitForSelector('[data-testid="background-layer-toggle"]', { timeout: 10000 });
      
      // Click the background layer toggle
      await page.click('[data-testid="background-layer-toggle"]');
      
      // Wait for the layer selector to open - look for the BackgroundLayerSelector content
      await page.waitForSelector('text=Hintergrund-Karte', { timeout: 5000 });
      
      // Verify the layer selector is visible by checking for its content
      await expect(page.locator('text=Hintergrund-Karte')).toBeVisible();
    });

    test('should display available layer options', async ({ page }) => {
      await page.waitForSelector('[data-testid="background-layer-toggle"]', { timeout: 10000 });
      
      // Open the layer selector
      await page.click('[data-testid="background-layer-toggle"]');
      await page.waitForSelector('text=Hintergrund-Karte', { timeout: 5000 });
      
      // Check for layer options by looking for the section headers and current layer info
      await expect(page.locator('text=Verfügbare Karten')).toBeVisible();
      await expect(page.locator('text=Aktuelle Karte')).toBeVisible();
      
      // Verify that the layer selector is functional by checking for radio buttons
      const radioButtons = page.locator('input[type="radio"]');
      await expect(radioButtons).toHaveCount(4); // Should have 4 layer options
    });
  });

  test.describe('Default Configuration', () => {
    test('should load with map container visible', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
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
    test('should load map efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      
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