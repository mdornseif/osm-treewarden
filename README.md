# OSM Tree Warden

An interactive map application for viewing and exploring trees from OpenStreetMap data.

## Features

- Interactive map with multiple basemap layers
- Real-time tree data from OpenStreetMap via Overpass API
- Color-coded tree markers based on genus:
  - Pyrus (pears): Yellow
  - Prunus (cherries, plums): Dark violet
  - Malus (apples): Bright green
  - Sorbus: Orange
  - Cydonia: Dark dirty yellow
  - Mespilus: Bright brown
  - Others: Blue
- Detailed tree information popups
- Geolocation support
- Responsive design

## Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → "gh-pages" branch
4. Your site will be available at `https://yourusername.github.io/repository-name/`

### Local Development

Simply open `index.html` in a web browser or serve the files with a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Usage

- Use the layer selector to switch between different map styles
- Click on tree markers to view detailed information
- Use the location button to center the map on your current position
- Trees are automatically loaded for the visible area with a 50% buffer

## Technologies

- Leaflet.js for map rendering
- OpenStreetMap data via Overpass API
- Vanilla JavaScript
- CSS3 for styling 