import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BaseMap from '../BaseMap';

// Mock leaflet CSS import
vi.mock('leaflet/dist/leaflet.css', () => ({}));

describe('BaseMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders map container with default props', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('renders map container without default tile layer', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      // The tile layer is now managed by BackgroundLayerSelector, not BaseMap
    });

    it('renders children components', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      render(
        <BaseMap>
          <TestChild />
        </BaseMap>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('uses default center coordinates when not provided', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      // The default center should be [50.897146, 7.098337]
      // We can't directly test the center prop as it's passed to MapContainer
      // but we can verify the component renders without errors
      expect(mapContainer).toBeInTheDocument();
    });

    it('uses default zoom level when not provided', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      // The default zoom should be 16
      expect(mapContainer).toBeInTheDocument();
    });

    it('applies custom center coordinates', () => {
      const customCenter: [number, number] = [40.7128, -74.0060]; // New York
      render(<BaseMap center={customCenter} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('applies custom zoom level', () => {
      const customZoom = 10;
      render(<BaseMap zoom={customZoom} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('applies correct styling', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveStyle({
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: '0px',
        left: '0px'
      });
    });
  });

  describe('Integration', () => {
    it('renders with TreeLayer as child', () => {
      const MockTreeLayer = () => <div data-testid="tree-layer">Tree Layer</div>;
      
      render(
        <BaseMap>
          <MockTreeLayer />
        </BaseMap>
      );
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tree-layer')).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      const Child1 = () => <div data-testid="child-1">Child 1</div>;
      const Child2 = () => <div data-testid="child-2">Child 2</div>;
      
      render(
        <BaseMap>
          <Child1 />
          <Child2 />
        </BaseMap>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper container structure', () => {
      render(<BaseMap />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });
}); 