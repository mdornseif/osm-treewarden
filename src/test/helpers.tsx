import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { Page } from '@playwright/test';

// Custom render function that includes providers if needed
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Mock tree data for testing
export const mockTrees = [
  {
    id: 1,
    lat: 50.897146,
    lon: 7.098337,
    properties: {
      species: 'Quercus robur',
      genus: 'Quercus',
      'taxon:cultivar': 'Fastigiata'
    }
  },
  {
    id: 2,
    lat: 50.897200,
    lon: 7.098400,
    properties: {
      species: 'Acer platanoides',
      genus: 'Acer'
    }
  },
  {
    id: 3,
    lat: 50.897300,
    lon: 7.098500,
    properties: {
      genus: 'Tilia'
    }
  }
];

// Mock map bounds
export const mockBounds = {
  south: 50.8,
  west: 7.0,
  north: 51.0,
  east: 7.2
};

// Helper to wait for map to be ready
export const waitForMapReady = async (page: Page) => {
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  await page.waitForSelector('.leaflet-tile', { timeout: 10000 });
};

// Helper to get map instance from page
export const getMapInstance = async (page: Page) => {
  return await page.evaluate(() => {
    return (window as { map?: unknown }).map;
  });
};

// Helper to get map center
export const getMapCenter = async (page: Page) => {
  const map = await getMapInstance(page);
  if (map) {
    return map.getCenter();
  }
  return null;
};

// Helper to get map zoom
export const getMapZoom = async (page: Page) => {
  const map = await getMapInstance(page);
  if (map) {
    return map.getZoom();
  }
  return null;
};

export * from '@testing-library/react';
export { customRender as render }; 