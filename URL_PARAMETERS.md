# URL Parameters for Map State

This application now supports URL parameters to save and restore the map state, including location, zoom level, and background layer. This allows users to share specific map views and restore their previous session state.

## Supported URL Parameters

The following URL parameters are supported:

- `lat` - Latitude coordinate (decimal degrees)
- `lng` - Longitude coordinate (decimal degrees)  
- `z` - Zoom level (0-19)
- `layer` - Background layer type (`osm` or `nrw-orthophoto`)

## Example URLs

```
# Default view
http://localhost:3000/

# Specific location and zoom
http://localhost:3000/?lat=51.5074&lng=-0.1278&z=15

# With custom background layer
http://localhost:3000/?lat=50.897146&lng=7.098337&z=17&layer=nrw-orthophoto

# Partial parameters (uses defaults for missing values)
http://localhost:3000/?lat=40.7128&lng=-74.0060
```

## How It Works

### Initialization
When the application loads, it automatically:
1. Parses URL parameters from the current URL
2. Validates the parameters (e.g., zoom level must be 0-19)
3. Restores the map state with the provided values
4. Falls back to default values for invalid or missing parameters

### Real-time Updates
As the user interacts with the map:
1. **Panning/Zooming**: The URL is automatically updated when the user moves or zooms the map
2. **Background Layer Changes**: The URL is updated when the user switches between different background layers
3. **Browser History**: URL changes use `history.replaceState()` to avoid creating new browser history entries

### Parameter Validation

- **Coordinates**: Must be valid decimal numbers
- **Zoom Level**: Must be between 0 and 19 (inclusive)
- **Background Layer**: Must be either `osm` or `nrw-orthophoto`

Invalid parameters are ignored and default values are used instead.

## Technical Implementation

The functionality is implemented using:

- **Map Store** (`src/store/mapStore.ts`): Manages map state and URL synchronization
- **Map State Sync** (`src/components/MapStateSync.tsx`): Listens for map events and updates the store
- **Background Layer Selector** (`src/components/BackgroundLayerSelector.tsx`): Manages background layer changes
- **App Component** (`src/App.tsx`): Initializes map state from URL on application startup

## Benefits

1. **Shareable Links**: Users can share specific map views by copying the URL
2. **Session Persistence**: Map state is preserved across browser sessions
3. **Deep Linking**: Direct links to specific locations work correctly
4. **Bookmarkable**: Users can bookmark specific map views
5. **Browser Back/Forward**: Works correctly with browser navigation

## Default Values

If no URL parameters are provided, the application uses these defaults:

- **Center**: `[50.897146, 7.098337]` (Cologne, Germany)
- **Zoom**: `17`
- **Background Layer**: `osm` (OpenStreetMap)