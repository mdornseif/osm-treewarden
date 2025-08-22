# OSM Tree Warden

A web application for managing and visualizing trees in OpenStreetMap data.

## Features

### Tree Management
- **View Trees**: Display trees from OpenStreetMap data on an interactive map
- **Tree Details**: View detailed information about individual trees including species, genus, and metadata
- **Tree Validation**: Automatic validation of tree data with warnings and suggestions
- **Tree Addition**: Add new trees to the map with species selection

### Map Features
- **Interactive Map**: Built with React Leaflet for smooth navigation
- **Background Layers**: Switch between OpenStreetMap and NRW Orthophoto layers
- **Real-time Loading**: Trees are loaded automatically as you navigate the map
- **Tree Markers**: Visual markers for trees with different states (selected, has errors, etc.)

### Data Management
- **Patch System**: Make local changes to tree data before uploading to OSM
- **Validation**: Real-time validation of tree properties
- **Export**: Generate OSM-compatible XML for uploading changes

## Tree Addition Feature

### How to Add Trees

1. **Click the Plus Button**: Look for the green ➕ button in the top-right corner of the map
2. **Select Tree Type**: Choose between:
   - 🍎 **Apple** (Malus domestica)
   - 🍐 **Pear** (Pyrus communis)
3. **Place the Tree**: Click anywhere on the map to place your selected tree
4. **Tree Added**: The new tree will appear on the map with the appropriate species information

### Tree Types Available

- **Apple Tree** (`Malus domestica`): Common apple tree species
- **Pear Tree** (`Pyrus communis`): Common pear tree species

More tree types can be easily added by extending the tree addition functionality.

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

### Running the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

### Testing
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

## Technical Details

### Architecture
- **Frontend**: React with TypeScript
- **State Management**: Nanostores for reactive state
- **Maps**: React Leaflet with OpenStreetMap tiles
- **Styling**: CSS Modules for component-scoped styles
- **Testing**: Vitest with React Testing Library

### Key Components
- `Map`: Main map component with tree layer and controls
- `TreeLayer`: Renders tree markers on the map
- `TreeList`: Displays list of trees with details
- `Settings`: Application settings and store management
- `MapControls`: Map control buttons including tree addition
- `TreeTypeSelector`: Modal for selecting tree types

### Data Flow
1. Map bounds change → Load trees from Overpass API
2. Trees loaded → Display on map and in tree list
3. User interactions → Update local state
4. Changes made → Store in patch system
5. Export → Generate OSM-compatible XML

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. 