import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';

test.describe('Simplified TreeWarden Tests', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.waitForAppLoad();
  });

  test.describe('Basic Functionality', () => {
    test('should load application and display map', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.expectMapVisible();
      await helpers.expectMapControlsVisible();
    });

    test('should load map tiles', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.waitForMapTiles();
      
      const tiles = page.locator('.leaflet-tile');
      const tileCount = await tiles.count();
      expect(tileCount).toBeGreaterThan(0);
    });
  });

  test.describe('Map Interactions', () => {
    test('should zoom in and update URL', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      const initialParams = helpers.getUrlParams();
      await helpers.zoomIn();
      
      const newParams = helpers.getUrlParams();
      expect(newParams.zoom).toBeGreaterThan(initialParams.zoom);
    });

    test('should zoom out and update URL', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      const initialParams = helpers.getUrlParams();
      await helpers.zoomOut();
      
      const newParams = helpers.getUrlParams();
      expect(newParams.zoom).toBeLessThan(initialParams.zoom);
    });

    test('should pan map and update URL coordinates', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      const initialParams = helpers.getUrlParams();
      await helpers.panMap(100, 100, 300, 300);
      
      const newParams = helpers.getUrlParams();
      const latDiff = Math.abs(newParams.lat - initialParams.lat);
      const lngDiff = Math.abs(newParams.lng - initialParams.lng);
      expect(latDiff + lngDiff).toBeGreaterThan(0.001);
    });
  });

  test.describe('URL Parameters', () => {
    test('should load with specific URL parameters', async ({ page }) => {
      await page.goto('/?lat=51.5074&lng=-0.1278&z=15&layer=osm');
      const helpers = createTestHelpers(page);
      await helpers.waitForAppLoad();
      
      await helpers.expectUrlParams({
        lat: 51.5074,
        lng: -0.1278,
        zoom: 15,
        layer: 'osm'
      });
    });

    test('should handle invalid URL parameters gracefully', async ({ page }) => {
      await page.goto('/?lat=invalid&lng=invalid&z=999&layer=invalid');
      const helpers = createTestHelpers(page);
      await helpers.waitForAppLoad();
      
      await helpers.expectUrlParams({
        lat: 50.897146, // Default values
        lng: 7.098337,
        zoom: 17,
        layer: 'osm'
      });
    });
  });

  test.describe('Background Layer', () => {
    test('should switch background layers', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Switch to NRW orthophoto
      const switched = await helpers.switchBackgroundLayer('nrw-orthophoto');
      if (switched) {
        await helpers.expectUrlParams({ layer: 'nrw-orthophoto' });
      }
      
      // Switch back to OSM
      const switchedBack = await helpers.switchBackgroundLayer('osm');
      if (switchedBack) {
        await helpers.expectUrlParams({ layer: 'osm' });
      }
    });

    test('should open and close background layer panel', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.openBackgroundLayerPanel();
      
      const panel = page.locator('.background-layer-window');
      await expect(panel).toBeVisible();
      
      await helpers.closeBackgroundLayerPanel();
      await expect(panel).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.setViewport('mobile');
      await helpers.expectMapVisible();
      
      // Background layer toggle should still be accessible
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await expect(bgLayerToggle).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.setViewport('tablet');
      await helpers.expectMapVisible();
      await helpers.expectMapControlsVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      // Block tile requests
      await helpers.blockResources(['**/*.png', '**/*.jpg']);
      
      await page.goto('/');
      await helpers.waitForAppLoad();
      
      // Map should still render
      await helpers.expectMapVisible();
    });

    test('should handle slow network conditions', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.simulateSlowNetwork();
      
      await page.goto('/');
      await helpers.waitForAppLoad(45000); // Longer timeout for slow network
      
      await helpers.expectMapVisible();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work across different browsers', async ({ page, browserName }) => {
      const helpers = createTestHelpers(page);
      
      await helpers.expectMapVisible();
      await helpers.expectMapControlsVisible();
      
      console.log(`✅ Test passed in ${browserName}`);
    });
  });
});