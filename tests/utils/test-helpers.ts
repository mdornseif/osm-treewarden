import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppLoad(timeout = 15000) {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('.leaflet-container', { timeout });
  }

  /**
   * Wait for map tiles to load
   */
  async waitForMapTiles(timeout = 20000) {
    await this.page.waitForSelector('.leaflet-tile', { timeout });
  }

  /**
   * Get current URL parameters
   */
  getUrlParams() {
    const url = this.page.url();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    return {
      lat: urlParams.get('lat') ? parseFloat(urlParams.get('lat')!) : 50.897146,
      lng: urlParams.get('lng') ? parseFloat(urlParams.get('lng')!) : 7.098337,
      zoom: urlParams.get('z') ? parseInt(urlParams.get('z')!) : 17,
      layer: urlParams.get('layer') || 'osm'
    };
  }

  /**
   * Verify URL parameters match expected values
   */
  async expectUrlParams(expected: Partial<ReturnType<typeof this.getUrlParams>>) {
    const actual = this.getUrlParams();
    
    if (expected.lat !== undefined) {
      expect(actual.lat).toBeCloseTo(expected.lat, 6);
    }
    if (expected.lng !== undefined) {
      expect(actual.lng).toBeCloseTo(expected.lng, 6);
    }
    if (expected.zoom !== undefined) {
      expect(actual.zoom).toBe(expected.zoom);
    }
    if (expected.layer !== undefined) {
      expect(actual.layer).toBe(expected.layer);
    }
  }

  /**
   * Open background layer panel
   */
  async openBackgroundLayerPanel() {
    const bgLayerToggle = this.page.locator('button[title*="Hintergrund"]');
    await bgLayerToggle.click();
    await this.page.waitForSelector('.background-layer-window', { timeout: 10000 });
  }

  /**
   * Close background layer panel
   */
  async closeBackgroundLayerPanel() {
    const bgLayerToggle = this.page.locator('button[title*="Hintergrund"]');
    await bgLayerToggle.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch background layer
   */
  async switchBackgroundLayer(layerName: 'osm' | 'nrw-orthophoto') {
    await this.openBackgroundLayerPanel();
    
    const layerOption = this.page.locator(`input[value="${layerName}"]`);
    if (await layerOption.isVisible()) {
      await layerOption.click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  /**
   * Perform map zoom in
   */
  async zoomIn() {
    await this.page.waitForSelector('.leaflet-control-zoom-in', { timeout: 15000 });
    await this.page.click('.leaflet-control-zoom-in');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Perform map zoom out
   */
  async zoomOut() {
    await this.page.waitForSelector('.leaflet-control-zoom-out', { timeout: 15000 });
    await this.page.click('.leaflet-control-zoom-out');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Perform map pan
   */
  async panMap(fromX: number, fromY: number, toX: number, toY: number) {
    const mapContainer = this.page.locator('.leaflet-container');
    await mapContainer.dragTo(mapContainer, {
      sourcePosition: { x: fromX, y: fromY },
      targetPosition: { x: toX, y: toY }
    });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for URL to change
   */
  async waitForUrlChange(initialUrl: string, timeout = 5000) {
    await this.page.waitForFunction(
      (url) => window.location.href !== url,
      initialUrl,
      { timeout }
    );
  }

  /**
   * Verify map is visible and functional
   */
  async expectMapVisible() {
    const mapContainer = this.page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
    
    const boundingBox = await mapContainer.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  }

  /**
   * Verify map controls are present and functional
   */
  async expectMapControlsVisible() {
    const zoomIn = this.page.locator('.leaflet-control-zoom-in');
    const zoomOut = this.page.locator('.leaflet-control-zoom-out');
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toBeEnabled();
  }

  /**
   * Set viewport size for responsive testing
   */
  async setViewport(size: 'mobile' | 'tablet' | 'desktop') {
    const sizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    };
    
    await this.page.setViewportSize(sizes[size]);
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork() {
    await this.page.route('**/*', route => {
      // Add artificial delay to all requests
      setTimeout(() => route.continue(), 1000);
    });
  }

  /**
   * Block specific resource types
   */
  async blockResources(patterns: string[]) {
    for (const pattern of patterns) {
      await this.page.route(pattern, route => route.abort());
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Log current page state for debugging
   */
  async logPageState() {
    const url = this.page.url();
    const title = await this.page.title();
    console.log(`Current URL: ${url}`);
    console.log(`Page title: ${title}`);
  }
}

/**
 * Create a test helper instance
 */
export function createTestHelpers(page: Page) {
  return new TestHelpers(page);
}