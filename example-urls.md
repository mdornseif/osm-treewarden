# TreeWarden URL Parameters - Examples

This document demonstrates the URL parameter functionality for shareable links and session persistence.

## URL Parameter Format

The application supports the following URL parameters:

- `lat`: Latitude coordinate (decimal degrees, -90 to 90)
- `lng`: Longitude coordinate (decimal degrees, -180 to 180)  
- `zoom`: Map zoom level (integer, 1 to 20)
- `layer`: Background layer identifier

## Available Background Layers

- `osm`: OpenStreetMap (default)
- `nrw-orthophoto`: NRW Orthophoto (RGB aerial imagery)
- `nrw-iorthophoto`: NRW i-Orthophoto (interactive aerial imagery)
- `nrw-vorthophoto`: NRW provisional Orthophoto
- `nrw-infrared`: NRW Infrared (vegetation analysis)
- `esri-world-imagery`: Esri World Imagery (global satellite)

## Example URLs

### Default View (Cologne area)
```
http://localhost:5173/
```

### Custom Location (Berlin, Germany)
```
http://localhost:5173/?lat=52.5200&lng=13.4050&zoom=14&layer=osm
```

### High Zoom with Aerial Imagery
```
http://localhost:5173/?lat=50.897146&lng=7.098337&zoom=19&layer=nrw-orthophoto
```

### Infrared View for Vegetation Analysis
```
http://localhost:5173/?lat=50.897146&lng=7.098337&zoom=16&layer=nrw-infrared
```

### Global Satellite View
```
http://localhost:5173/?lat=48.8566&lng=2.3522&zoom=15&layer=esri-world-imagery
```

## Features

1. **Shareable Links**: Copy the current map view URL to share with others
2. **Session Persistence**: Map state is preserved in the URL when navigating
3. **Automatic Updates**: URL updates automatically when panning/zooming the map
4. **Fallback Handling**: Invalid parameters fall back to sensible defaults
5. **Share Button**: Use the 🔗 button in map controls to copy shareable links

## Technical Implementation

- URL parameters are parsed on application startup
- Map view changes are debounced (1 second) before updating the URL
- Background layer changes update the URL immediately
- The share button uses the native Web Share API when available, otherwise copies to clipboard
- All coordinate values are rounded to 6 decimal places for precision/readability balance

## Browser Compatibility

- Modern browsers with support for:
  - URLSearchParams API
  - History API (pushState/replaceState)
  - Clipboard API (for share functionality)
  - Optional: Web Share API (mobile devices)