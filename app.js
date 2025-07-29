class TreeWardenMap {
    constructor() {
        this.map = null;
        this.treeLayer = null;
        this.currentFilter = 'all';
        this.isLoading = false;
        this.currentBasemap = 'cyclosm'; // Default basemap
        this.reloadTimeout = null; // Timeout for auto-reload
        
        this.init();
    }
    
    init() {
        console.log('🔧 TreeWardenMap.init() - Starting initialization');
        this.initMap();
        this.initLayers();
        this.initControls();
        
        // Wait for map to be ready before loading trees
        this.map.whenReady(() => {
            console.log('🗺️ Map is ready, starting tree loading');
            // Load real tree data
            this.loadRealTrees();
        });
        
        // Listen for map view changes to update URL and schedule tree reload
        this.map.on('moveend', () => {
            this.updateURLState();
            this.scheduleTreeReload();
        });
    }
    
    initMap() {
        // Get initial map state from URL or use defaults
        const urlParams = this.getURLParams();
        const center = urlParams.center ? urlParams.center.split(',').map(Number) : [50.9875, 7.1375];
        const zoom = urlParams.zoom ? parseInt(urlParams.zoom) : 16;
        const basemap = urlParams.basemap || 'cyclosm';
        
        // Update current basemap
        this.currentBasemap = basemap;
        
        // Initialize map with URL state or defaults
        this.map = L.map('map', {
            center: center,
            zoom: zoom,
            zoomControl: false, // Disable default zoom control
            attributionControl: true
        });
        
        // Add custom controls
        this.addCustomControls();
        
        // Add scale control
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);
    }
    
    initLayers() {
        // Create tile layers
        this.layers = {
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }),
            osm: L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }),
            terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                maxZoom: 17
            }),
            watercolor: L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
                minZoom: 1,
                maxZoom: 16,
                attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'jpg'
            }),
            topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
            }),
            alidade_satellite: L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
                minZoom: 0,
                maxZoom: 20,
                attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'jpg'
            }),
            cyclosm: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
                maxZoom: 20,
                attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }),
            esri_imagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }),
            alidade_smooth_dark: L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
                minZoom: 0,
                maxZoom: 20,
                attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'png'
            }),
            alidade_smooth: L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
                minZoom: 0,
                maxZoom: 20,
                attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'png'
            }),
            esri_world_imagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }),
            esri_world_topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
            })
        };
        
        // Add default layer based on URL state or CyclOSM
        this.layers[this.currentBasemap].addTo(this.map);
        
        // Create tree layer group
        this.treeLayer = L.layerGroup().addTo(this.map);
    }
    
    initControls() {
        // Layer selector
        const layerSelect = document.getElementById('layer-select');
        layerSelect.value = this.currentBasemap; // Set initial value from URL
        layerSelect.addEventListener('change', (e) => {
            this.changeBaseLayer(e.target.value);
        });
        
        // Tree filter
        const treeFilter = document.getElementById('tree-filter');
        treeFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadTrees();
        });
        

    }
    
    changeBaseLayer(layerType) {
        // Remove all base layers
        Object.values(this.layers).forEach(layer => {
            this.map.removeLayer(layer);
        });
        
        // Add selected layer
        this.layers[layerType].addTo(this.map);
        
        // Update current basemap and URL
        this.currentBasemap = layerType;
        this.updateURLState();
    }
    
    goToCurrentLocation() {
        console.log('📍 goToCurrentLocation() - Starting geolocation request');
        
        if (!navigator.geolocation) {
            console.error('❌ Geolocation not supported by browser');
            this.showError('Geolocation is not supported by your browser');
            return;
        }
        
        // Show loading state
        this.showLoading(true);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ Geolocation successful:', position);
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log('📍 Current location:', { lat, lng, accuracy });
                
                // Center map on current location
                this.map.setView([lat, lng], 16);
                
                // Load trees for the new location
                setTimeout(() => {
                    this.loadRealTrees();
                }, 500);
                
                this.showLoading(false);
                console.log('🎯 Map centered on current location');
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                this.showLoading(false);
                
                let errorMessage = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                
                this.showError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }
    

    
    async loadRealTrees() {
        console.log('🌲 loadRealTrees() - Starting real tree loading');
        if (this.isLoading) {
            console.log('⚠️ Already loading, skipping');
            return;
        }
        
        console.log('🔄 Setting loading state to true');
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            console.log('📍 Getting map center');
            const center = this.map.getCenter();
            console.log('📍 Map center:', center);
            
            console.log('📐 Creating bounding box');
            // Use the actual map bounds and expand by 50%
            const mapBounds = this.map.getBounds();
            const latDiff = mapBounds.getNorth() - mapBounds.getSouth();
            const lngDiff = mapBounds.getEast() - mapBounds.getWest();
            const latExpansion = latDiff * 0.25; // 25% on each side = 50% total
            const lngExpansion = lngDiff * 0.25; // 25% on each side = 50% total
            
            const bounds = {
                south: mapBounds.getSouth() - latExpansion,
                west: mapBounds.getWest() - lngExpansion,
                north: mapBounds.getNorth() + latExpansion,
                east: mapBounds.getEast() + lngExpansion
            };
            
            console.log('📐 Map bounds:', mapBounds);
            console.log('📐 Expansion factors:', { latExpansion, lngExpansion });
            console.log('📐 Calculated bounds:', bounds);
            
            console.log('📐 Bounds:', bounds);
            console.log('🔍 Building Overpass query');
            const query = this.buildOverpassQuery(bounds);
            console.log('🔍 Overpass query:', query);
            
            console.log('🌐 Starting Overpass API call');
            const trees = await this.fetchTreesFromOverpass(query);
            console.log('✅ Overpass API call completed, got', trees.length, 'trees');
            
            console.log('🎨 Displaying real trees');
            this.displayTrees(trees);
            this.updateTreeCount(trees.length);
            console.log('🎯 Real trees loaded successfully');
        } catch (error) {
            console.error('❌ Error in loadRealTrees:', error);
            console.error('❌ Error stack:', error.stack);
        } finally {
            console.log('🔄 Setting loading state to false');
            this.isLoading = false;
            this.showLoading(false);
            console.log('🏁 loadRealTrees() completed');
        }
    }
    

    
    async loadTrees() {
        // Legacy method - now redirects to mock loading
        this.loadMockTrees();
    }
    
    buildOverpassQuery(bounds) {
        console.log('🔍 buildOverpassQuery() - Building query');
        console.log('🔍 Input bounds:', bounds);
        
        const { south, west, north, east } = bounds;
        console.log('🔍 Extracted coordinates:', { south, west, north, east });
        
        let filter = '';
        switch (this.currentFilter) {
            case 'natural=tree':
                filter = '["natural"="tree"]';
                break;
            case 'landuse=forest':
                filter = '["landuse"="forest"]';
                break;
            case 'leisure=park':
                filter = '["leisure"="park"]';
                break;
            default:
                filter = '["natural"="tree"]';
        }
        console.log('🔍 Selected filter:', filter);
        
        // Use a simpler query format that's more likely to work
        const query = `[out:json][timeout:25];node${filter}(${south},${west},${north},${east});out body;`;
        console.log('🔍 Generated query:', query);
        
        return query;
    }
    
    async fetchTreesFromOverpass(query) {
        console.log('🌐 fetchTreesFromOverpass() - Starting API call');
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        console.log('🌐 Overpass URL:', overpassUrl);
        
        // Add timeout to prevent hanging
        console.log('⏰ Setting up 10-second timeout');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Timeout triggered, aborting request');
            controller.abort();
        }, 10000); // 10 second timeout
        
        try {
            console.log('📤 Preparing fetch request');
            console.log('📤 Request body:', `data=${encodeURIComponent(query)}`);
            
            console.log('📡 Sending fetch request...');
            const response = await fetch(overpassUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            
            console.log('📡 Fetch request completed');
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            clearTimeout(timeoutId);
            console.log('⏰ Timeout cleared');
            
            if (!response.ok) {
                console.error('❌ HTTP error:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('📄 Getting response as text first...');
            
            // Check content length header first
            const contentLength = response.headers.get('content-length');
            console.log('📄 Content-Length header:', contentLength);
            
            if (contentLength && parseInt(contentLength) > 5000000) {
                console.log('⚠️ Response too large (>5MB), aborting to prevent hang');
                throw new Error('Response too large - Overpass API returned too much data');
            }
            
            // Use a timeout for reading the response text
            console.log('📄 Starting response.text() with timeout...');
            const textPromise = response.text();
            const textTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Response text read timeout')), 3000)
            );
            
            const responseText = await Promise.race([textPromise, textTimeoutPromise]);
            console.log('📄 Response text length:', responseText.length);
            
            if (responseText.length > 1000000) {
                console.log('⚠️ Response text too large (>1MB), aborting to prevent hang');
                throw new Error('Response text too large - Overpass API returned too much data');
            }
            
            console.log('📄 First 1000 chars:', responseText.substring(0, 1000));
            
            console.log('📄 Parsing JSON response...');
            const data = JSON.parse(responseText);
            console.log('📄 JSON parsed successfully');
            console.log('📄 Response data structure:', Object.keys(data));
            
            console.log('🔍 Parsing Overpass data...');
            const trees = this.parseOverpassData(data);
            console.log('🔍 Parsed', trees.length, 'trees from response');
            
            return trees;
        } catch (error) {
            console.error('❌ Error in fetchTreesFromOverpass:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            
            clearTimeout(timeoutId);
            console.log('⏰ Timeout cleared in error handler');
            
            if (error.name === 'AbortError') {
                console.log('⏰ AbortError detected - request timed out');
                throw new Error('Request timeout - Overpass API is slow or unavailable');
            }
            throw error;
        }
    }
    
    parseOverpassData(data) {
        console.log('🔍 parseOverpassData() - Starting data parsing');
        console.log('🔍 Input data:', data);
        
        const trees = [];
        
        // Process nodes (individual trees)
        if (data.elements) {
            console.log('🔍 Found', data.elements.length, 'elements in response');
            
            data.elements.forEach((element, index) => {
                console.log(`🔍 Processing element ${index}:`, element);
                
                if (element.type === 'node' && element.lat && element.lon) {
                    console.log(`🌳 Found tree node ${index}:`, element.id, 'at', element.lat, element.lon);
                    
                    const tree = {
                        id: element.id,
                        lat: element.lat,
                        lng: element.lon,
                        type: 'node',
                        tags: element.tags || {},
                        properties: this.extractTreeProperties(element.tags)
                    };
                    trees.push(tree);
                    console.log(`✅ Added tree ${index} to list`);
                } else {
                    console.log(`⚠️ Skipping element ${index} - not a valid tree node`);
                }
            });
        } else {
            console.log('⚠️ No elements found in response');
        }
        
        console.log('🔍 parseOverpassData() completed, returning', trees.length, 'trees');
        return trees;
    }
    
    extractTreeProperties(tags) {
        const properties = {};
        
        if (tags) {
            // Basic tree properties
            if (tags.species) properties.species = tags.species;
            if (tags.genus) properties.genus = tags.genus;
            if (tags.taxon) properties.taxon = tags.taxon;
            if (tags['taxon:cultivar']) properties.cultivar = tags['taxon:cultivar'];
            
            // Physical properties
            if (tags.height) properties.height = tags.height;
            if (tags.circumference) properties.circumference = tags.circumference;
            if (tags.diameter_crown) properties.crownDiameter = tags.diameter_crown;
            
            // Leaf properties
            if (tags.leaf_type) properties.leafType = tags.leaf_type;
            if (tags.leaf_cycle) properties.leafCycle = tags.leaf_cycle;
            
            // Age and planting information
            if (tags.age) properties.age = tags.age;
            if (tags.planted) properties.planted = tags.planted;
            if (tags.start_date) properties.startDate = tags.start_date;
            
            // Classification and protection
            if (tags.denotation) properties.denotation = tags.denotation;
            if (tags.protection) properties.protection = tags.protection;
            
            // Local information
            if (tags.loc_name) properties.locName = tags.loc_name;
            
            // Additional properties that might be present
            if (tags.name) properties.name = tags.name;
            if (tags.note) properties.note = tags.note;
            if (tags.description) properties.description = tags.description;
            if (tags.wikidata) properties.wikidata = tags.wikidata;
            if (tags['species:wikidata']) properties.speciesWikidata = tags['species:wikidata'];
        }
        
        return properties;
    }
    
    displayTrees(trees) {
        // Clear existing trees
        this.treeLayer.clearLayers();
        
        // Add trees to map
        trees.forEach(tree => {
            const marker = L.marker([tree.lat, tree.lng], {
                icon: this.createTreeIcon(tree)
            });
            
            // Create popup content
            const popupContent = this.createTreePopup(tree);
            marker.bindPopup(popupContent);
            
            marker.addTo(this.treeLayer);
        });
    }
    
    createTreeIcon(tree) {
        const genus = tree.properties.genus ? tree.properties.genus.toLowerCase() : '';
        let iconClass = 'tree-marker';
        
        // Add genus-specific class
        if (genus === 'pyrus') {
            iconClass += ' tree-marker-pyrus';
        } else if (genus === 'prunus') {
            iconClass += ' tree-marker-prunus';
        } else if (genus === 'malus') {
            iconClass += ' tree-marker-malus';
        } else if (genus === 'sorbus') {
            iconClass += ' tree-marker-sorbus';
        } else if (genus === 'cydonia') {
            iconClass += ' tree-marker-cydonia';
        } else if (genus === 'mespilus') {
            iconClass += ' tree-marker-mespilus';
        } else {
            iconClass += ' tree-marker-other';
        }
        
        return L.divIcon({
            className: iconClass,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    }
    
    createTreePopup(tree) {
        const properties = tree.properties;
        let content = '<div class="tree-popup-title">🌳 Tree</div>';
        content += '<div class="tree-popup-details">';
        
        // Display all available properties
        if (properties.species) {
            content += `<div><strong>Species:</strong> ${properties.species}</div>`;
        }
        if (properties.genus) {
            content += `<div><strong>Genus:</strong> ${properties.genus}</div>`;
        }
        if (properties.taxon) {
            content += `<div><strong>Taxon:</strong> ${properties.taxon}</div>`;
        }
        if (properties.cultivar) {
            content += `<div><strong>Cultivar:</strong> ${properties.cultivar}</div>`;
        }
        if (properties.height) {
            content += `<div><strong>Height:</strong> ${properties.height}m</div>`;
        }
        if (properties.crownDiameter) {
            content += `<div><strong>Crown Diameter:</strong> ${properties.crownDiameter}m</div>`;
        }
        if (properties.circumference) {
            content += `<div><strong>Circumference:</strong> ${properties.circumference}cm</div>`;
        }
        if (properties.leafType) {
            content += `<div><strong>Leaf Type:</strong> ${properties.leafType}</div>`;
        }
        if (properties.leafCycle) {
            content += `<div><strong>Leaf Cycle:</strong> ${properties.leafCycle}</div>`;
        }
        if (properties.age) {
            content += `<div><strong>Age:</strong> ${properties.age} years</div>`;
        }
        if (properties.planted) {
            content += `<div><strong>Planted:</strong> ${properties.planted}</div>`;
        }
        if (properties.startDate) {
            content += `<div><strong>Start Date:</strong> ${properties.startDate}</div>`;
        }
        if (properties.denotation) {
            content += `<div><strong>Denotation:</strong> ${properties.denotation}</div>`;
        }
        if (properties.protection) {
            content += `<div><strong>Protection:</strong> ${properties.protection}</div>`;
        }
        if (properties.locName) {
            content += `<div><strong>Local Name:</strong> ${properties.locName}</div>`;
        }
        
        // Display coordinates
        content += `<div><strong>Coordinates:</strong> ${tree.lat.toFixed(7)}, ${tree.lng.toFixed(7)}</div>`;
        content += `<div><strong>OSM ID:</strong> ${tree.id}</div>`;
        
        // Add link to view full OSM node
        content += `<div class="tree-popup-link"><a href="https://www.openstreetmap.org/node/${tree.id}">View on OpenStreetMap</a></div>`;
        
        content += '</div>';
        
        return content;
    }
    
    updateTreeCount(count) {
        const treeCountElement = document.getElementById('tree-count');
        treeCountElement.textContent = `Trees: ${count}`;
    }
    
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (show) {
            loadingElement.classList.remove('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
    }
    

    
    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
    }
    
    scheduleTreeReload() {
        // Clear existing timeout
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
        
        // Schedule new reload after 1000ms of inactivity
        this.reloadTimeout = setTimeout(() => {
            console.log('🔄 Auto-reloading trees after 1000ms of inactivity');
            this.loadRealTrees();
        }, 1000);
    }
    
    addCustomControls() {
        // Create custom control container
        const controlContainer = L.control({ position: 'topright' });
        
        controlContainer.onAdd = () => {
            const container = L.DomUtil.create('div', 'custom-controls');
            
            // Zoom controls
            const zoomContainer = L.DomUtil.create('div', 'zoom-controls', container);
            
            const zoomIn = L.DomUtil.create('a', 'zoom-in', zoomContainer);
            zoomIn.innerHTML = '+';
            zoomIn.title = 'Zoom In';
            zoomIn.href = '#';
            L.DomEvent.on(zoomIn, 'click', L.DomEvent.stopPropagation)
                .on(zoomIn, 'click', L.DomEvent.preventDefault)
                .on(zoomIn, 'click', () => this.map.zoomIn());
            
            const zoomOut = L.DomUtil.create('a', 'zoom-out', zoomContainer);
            zoomOut.innerHTML = '−';
            zoomOut.title = 'Zoom Out';
            zoomOut.href = '#';
            L.DomEvent.on(zoomOut, 'click', L.DomEvent.stopPropagation)
                .on(zoomOut, 'click', L.DomEvent.preventDefault)
                .on(zoomOut, 'click', () => this.map.zoomOut());
            
            // Location button
            const locationBtn = L.DomUtil.create('button', 'location-btn', container);
            locationBtn.innerHTML = '📍';
            locationBtn.title = 'Show My Location';
            L.DomEvent.on(locationBtn, 'click', () => this.goToCurrentLocation());
            
            // Layers button
            const layersBtn = L.DomUtil.create('button', 'layers-btn', container);
            layersBtn.innerHTML = '🗺️';
            layersBtn.title = 'Next Layer';
            L.DomEvent.on(layersBtn, 'click', () => this.cycleToNextLayer());
            
            return container;
        };
        
        controlContainer.addTo(this.map);
    }
    
    cycleToNextLayer() {
        // Define the order of layers to cycle through
        const layerOrder = [
            'cyclosm',
            'osm', 
            'satellite',
            'alidade_smooth',
            'alidade_smooth_dark',
            'alidade_satellite',
            'esri_world_imagery',
            'esri_world_topo',
            'topo',
            'terrain',
            'watercolor',
            'esri_imagery'
        ];
        
        // Find current layer index
        const currentIndex = layerOrder.indexOf(this.currentBasemap);
        const nextIndex = (currentIndex + 1) % layerOrder.length;
        const nextLayer = layerOrder[nextIndex];
        
        // Change to next layer
        this.changeBaseLayer(nextLayer);
        
        // Update the dropdown to match
        const layerSelect = document.getElementById('layer-select');
        if (layerSelect) {
            layerSelect.value = nextLayer;
        }
    }
    
    getURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        
        if (urlParams.has('l')) {
            params.center = urlParams.get('l');
        }
        if (urlParams.has('z')) {
            params.zoom = urlParams.get('z');
        }
        if (urlParams.has('basemap')) {
            params.basemap = urlParams.get('basemap');
        }
        
        return params;
    }
    
    updateURLState() {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        
        const url = new URL(window.location);
        url.searchParams.set('l', `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`);
        url.searchParams.set('z', zoom.toString());
        url.searchParams.set('basemap', this.currentBasemap);
        
        // Update URL without reloading the page
        window.history.replaceState({}, '', url);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TreeWardenMap();
}); 