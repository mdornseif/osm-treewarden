class TreeWardenMap {
    constructor() {
        this.map = null;
        this.treeLayer = null;
        this.orchardLayer = null;
        this.reloadTimeout = null; // Timeout for auto-reload
        this.lastMapBounds = null; // Track previous map bounds
        this.lastMapZoom = null; // Track previous zoom level
        
        // Initialize state listeners
        this.setupStateListeners();
        
        this.init();
        
        // Initialize OSM OAuth after a short delay to ensure scripts are loaded
        setTimeout(() => {
            this.initOSMOAuth();
        }, 100);
    }
    
    setupStateListeners() {
        // Listen to tree changes
        stores.trees.subscribe((trees) => {
            this.updateTreeDisplay(trees);
            this.updateTreeCount(trees.length);
        });

        // Listen to selected tree changes
        stores.selectedTree.subscribe((tree) => {
            if (tree) {
                this.showTreeDetails(tree);
                this.highlightTreeInMap(tree);
            } else {
                // Don't call closeTreeDetails() here to avoid circular dependency
                // The closeTreeDetails() method already handles the UI updates
                const treeDetails = document.getElementById('tree-details');
                if (treeDetails) {
                    treeDetails.classList.add('hidden');
                }
                
                // Remove selection from list
                document.querySelectorAll('.tree-list-item').forEach(item => {
                    item.classList.remove('selected');
                });
            }
        });

        // Listen to patchset changes
        stores.patchset.subscribe((patchset) => {
            this.updateTreeList();
            this.updatePatchsetIndicator();
        });

        // Listen to loading state
        stores.loading.subscribe((isLoading) => {
            this.showLoading(isLoading);
        });

        // Note: No basemap listener needed since changeBaseLayer updates the store directly
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
        const center = urlParams.center ? urlParams.center.split(',').map(Number) : [50.896809, 7.098745];
        const zoom = urlParams.zoom ? parseInt(urlParams.zoom) : 16;
        const basemap = urlParams.basemap || 'cyclosm';
        
        // Update current basemap in store
        stores.basemap.set(basemap);
        
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
        this.layers[stores.basemap.get()].addTo(this.map);
        
        // Create tree layer group
        this.treeLayer = L.layerGroup().addTo(this.map);
        
        // Create orchard layer group
        this.orchardLayer = L.layerGroup().addTo(this.map);
    }
    
    initControls() {
        // Layer selector
        const layerSelect = document.getElementById('layer-select');
        layerSelect.value = stores.basemap.get(); // Set initial value from URL
        layerSelect.addEventListener('change', (e) => {
            this.changeBaseLayer(e.target.value);
        });
        
        // Sidebar controls
        const sidebarToggle = document.getElementById('sidebar-toggle');
        sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        const treeDetailsClose = document.getElementById('tree-details-close');
        treeDetailsClose.addEventListener('click', () => this.closeTreeDetails());
    }
    
    changeBaseLayer(layerType) {
        // Remove all base layers
        Object.values(this.layers).forEach(layer => {
            this.map.removeLayer(layer);
        });
        
        // Add selected layer
        this.layers[layerType].addTo(this.map);
        
        // Update current basemap in store and URL
        stores.basemap.set(layerType);
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
        if (stores.loading.get()) {
            console.log('⚠️ Already loading, skipping');
            return;
        }
        
        console.log('🔄 Setting loading state to true');
        stores.loading.set(true);
        
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
            
            // Create 10-fold enlarged bounds for orchard search
            const orchardLatExpansion = latDiff * 4.5; // 450% on each side = 10x total
            const orchardLngExpansion = lngDiff * 4.5; // 450% on each side = 10x total
            
            const orchardBounds = {
                south: mapBounds.getSouth() - orchardLatExpansion,
                west: mapBounds.getWest() - orchardLngExpansion,
                north: mapBounds.getNorth() + orchardLatExpansion,
                east: mapBounds.getEast() + orchardLngExpansion
            };
            
            console.log('📐 Orchard bounds (10x enlarged):', orchardBounds);
            
            console.log('📐 Bounds:', bounds);
            console.log('🔍 Building Overpass query');
            const query = this.buildOverpassQuery(bounds);
            console.log('🔍 Overpass query:', query);
            
            console.log('🌐 Starting Overpass API call for trees');
            const trees = await this.fetchTreesFromOverpass(query);
            console.log('✅ Overpass API call completed, got', trees.length, 'trees');
            
            console.log('🌐 Starting Overpass API call for orchards');
            const orchardQuery = this.buildOrchardQuery(orchardBounds);
            const orchards = await this.fetchOrchardsFromOverpass(orchardQuery);
            console.log('✅ Orchard API call completed, got', orchards.length, 'orchards');
            
            console.log('🎨 Displaying real trees');
            this.displayTrees(trees);
            this.displayOrchards(orchards);
            this.updateTreeCount(trees.length);
            this.updatePatchsetIndicator(); // Initialize patchset indicator
            console.log('🎯 Real trees and orchards loaded successfully');
        } catch (error) {
            console.error('❌ Error in loadRealTrees:', error);
            console.error('❌ Error stack:', error.stack);
        } finally {
            console.log('🔄 Setting loading state to false');
            stores.loading.set(false);
            console.log('🏁 loadRealTrees() completed');
        }
    }
    

    
    async loadTrees() {
        // Legacy method - now redirects to real tree loading
        this.loadRealTrees();
    }
    
    buildOverpassQuery(bounds) {
        console.log('🔍 buildOverpassQuery() - Building query');
        console.log('🔍 Input bounds:', bounds);
        
        const { south, west, north, east } = bounds;
        console.log('🔍 Extracted coordinates:', { south, west, north, east });
        
        // Always use natural=tree filter since we removed the tree type menu
        const filter = '["natural"="tree"]';
        console.log('🔍 Using filter:', filter);
        
        // Use a simpler query format that's more likely to work
        const query = `[out:json][timeout:25];node${filter}(${south},${west},${north},${east});out body;`;
        console.log('🔍 Generated query:', query);
        
        return query;
    }
    
    buildOrchardQuery(bounds) {
        console.log('🔍 buildOrchardQuery() - Building orchard query');
        console.log('🔍 Input bounds:', bounds);
        
        const { south, west, north, east } = bounds;
        console.log('🔍 Extracted coordinates:', { south, west, north, east });
        
        // Query for orchard areas (ways and relations with landuse=orchard)
        const query = `[out:json][timeout:25];
        way["landuse"="orchard"](${south},${west},${north},${east});
        out geom;
        relation["landuse"="orchard"](${south},${west},${north},${east});
        out geom;`;
        
        console.log('🔍 Generated orchard query:', query);
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
    
    async fetchOrchardsFromOverpass(query) {
        console.log('🌐 fetchOrchardsFromOverpass() - Starting API call');
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        console.log('🌐 Overpass URL:', overpassUrl);
        
        // Add timeout to prevent hanging
        console.log('⏰ Setting up 15-second timeout for orchards');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Timeout triggered, aborting orchard request');
            controller.abort();
        }, 15000); // 15 second timeout for larger area
        
        try {
            console.log('📤 Preparing orchard fetch request');
            console.log('📤 Request body:', `data=${encodeURIComponent(query)}`);
            
            console.log('📡 Sending orchard fetch request...');
            const response = await fetch(overpassUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            
            console.log('📡 Orchard fetch request completed');
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            clearTimeout(timeoutId);
            console.log('⏰ Orchard timeout cleared');
            
            if (!response.ok) {
                console.error('❌ HTTP error:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('📄 Getting orchard response as text...');
            const responseText = await response.text();
            console.log('📄 Orchard response text length:', responseText.length);
            
            if (responseText.length > 2000000) {
                console.log('⚠️ Orchard response text too large (>2MB), aborting');
                throw new Error('Orchard response text too large - Overpass API returned too much data');
            }
            
            console.log('📄 Parsing orchard JSON response...');
            const data = JSON.parse(responseText);
            console.log('📄 Orchard JSON parsed successfully');
            console.log('📄 Orchard response data structure:', Object.keys(data));
            
            console.log('🔍 Parsing orchard Overpass data...');
            const orchards = this.parseOrchardData(data);
            console.log('🔍 Parsed', orchards.length, 'orchards from response');
            
            return orchards;
        } catch (error) {
            console.error('❌ Error in fetchOrchardsFromOverpass:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            
            clearTimeout(timeoutId);
            console.log('⏰ Orchard timeout cleared in error handler');
            
            if (error.name === 'AbortError') {
                console.log('⏰ AbortError detected - orchard request timed out');
                throw new Error('Orchard request timeout - Overpass API is slow or unavailable');
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
                        lon: element.lon,
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
    
    parseOrchardData(data) {
        console.log('🔍 parseOrchardData() - Starting orchard data parsing');
        console.log('🔍 Input data:', data);
        
        const orchards = [];
        
        // Process ways and relations (orchard areas)
        if (data.elements) {
            console.log('🔍 Found', data.elements.length, 'elements in orchard response');
            
            data.elements.forEach((element, index) => {
                console.log(`🔍 Processing orchard element ${index}:`, element);
                
                if ((element.type === 'way' || element.type === 'relation') && element.geometry) {
                    console.log(`🍎 Found orchard ${element.type} ${index}:`, element.id);
                    
                    // Convert geometry to Leaflet polygon coordinates
                    const coordinates = element.geometry.map(point => [point.lat, point.lon]);
                    
                    const orchard = {
                        id: element.id,
                        type: element.type,
                        coordinates: coordinates,
                        tags: element.tags || {},
                        properties: this.extractOrchardProperties(element.tags)
                    };
                    orchards.push(orchard);
                    console.log(`✅ Added orchard ${index} to list`);
                } else {
                    console.log(`⚠️ Skipping orchard element ${index} - not a valid orchard area`);
                }
            });
        } else {
            console.log('⚠️ No elements found in orchard response');
        }
        
        console.log('🔍 parseOrchardData() completed, returning', orchards.length, 'orchards');
        return orchards;
    }
    
    extractOrchardProperties(tags) {
        const properties = {};
        
        if (tags) {
            if (tags.name) properties.name = tags.name;
            if (tags.species) properties.species = tags.species;
            if (tags.crop) properties.crop = tags.crop;
            if (tags.trees) properties.trees = tags.trees;
            if (tags.note) properties.note = tags.note;
            if (tags.description) properties.description = tags.description;
        }
        
        return properties;
    }
    
    displayTrees(trees) {
        // Store trees in store (this will trigger the listener)
        stores.trees.set(trees);
    }
    
    updateTreeDisplay(trees) {
        // Clear existing trees
        this.treeLayer.clearLayers();
        
        // Add trees to map
        trees.forEach((tree, index) => {
            const marker = L.marker([tree.lat, tree.lon], {
                icon: this.createTreeIcon(tree)
            });
            
            // Add tooltip with tree name
            const treeName = this.getTreeDisplayName(tree);
            marker.bindTooltip(treeName, {
                direction: 'top',
                offset: [0, -10],
                className: 'tree-tooltip'
            });
            
            // Add click handler for tree details
            marker.on('click', () => {
                this.selectTree(tree);
            });
            
            marker.addTo(this.treeLayer);
        });
        
        // Update tree list in sidebar
        this.updateTreeList();
    }
    
    displayOrchards(orchards) {
        // Clear existing orchards
        this.orchardLayer.clearLayers();
        
        // Add orchards to map as red border polygons
        orchards.forEach(orchard => {
            try {
                const polygon = L.polygon(orchard.coordinates, {
                    color: 'red',
                    weight: 2,
                    fillColor: 'transparent',
                    fillOpacity: 0
                });
                
                // Create popup content for orchard
                const popupContent = this.createOrchardPopup(orchard);
                polygon.bindPopup(popupContent);
                
                polygon.addTo(this.orchardLayer);
                console.log(`🍎 Added orchard ${orchard.id} to map`);
            } catch (error) {
                console.error(`❌ Error displaying orchard ${orchard.id}:`, error);
            }
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
    
    createOrchardPopup(orchard) {
        const properties = orchard.properties;
        let content = '<div class="tree-popup-title">🍎 Orchard</div>';
        content += '<div class="tree-popup-details">';
        
        if (properties.name) {
            content += `<div><strong>Name:</strong> ${properties.name}</div>`;
        }
        if (properties.species) {
            content += `<div><strong>Species:</strong> ${properties.species}</div>`;
        }
        if (properties.crop) {
            content += `<div><strong>Crop:</strong> ${properties.crop}</div>`;
        }
        if (properties.trees) {
            content += `<div><strong>Trees:</strong> ${properties.trees}</div>`;
        }
        if (properties.note) {
            content += `<div><strong>Note:</strong> ${properties.note}</div>`;
        }
        if (properties.description) {
            content += `<div><strong>Description:</strong> ${properties.description}</div>`;
        }
        
        content += `<div><strong>Type:</strong> ${orchard.type}</div>`;
        content += `<div><strong>OSM ID:</strong> ${orchard.id}</div>`;
        
        // Add link to view full OSM way/relation
        const osmType = orchard.type === 'way' ? 'way' : 'relation';
        content += `<div class="tree-popup-link"><a href="https://www.openstreetmap.org/${osmType}/${orchard.id}">View on OpenStreetMap</a></div>`;
        
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
            // Check if we should actually reload based on movement
            if (this.shouldReloadTrees()) {
                console.log('🔄 Auto-reloading trees after significant movement');
                this.loadRealTrees();
            } else {
                console.log('⏭️ Skipping tree reload - minimal movement detected');
            }
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
            
            // Edit in OSM button
            const editBtn = L.DomUtil.create('button', 'edit-btn', container);
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit this view in OSM editor';
            L.DomEvent.on(editBtn, 'click', () => this.openInOSMEditor());
            
            // Sidebar toggle button
            const sidebarBtn = L.DomUtil.create('button', 'sidebar-btn', container);
            sidebarBtn.innerHTML = '📋';
            sidebarBtn.title = 'Toggle Tree List';
            L.DomEvent.on(sidebarBtn, 'click', () => this.toggleSidebar());
            
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
        const currentIndex = layerOrder.indexOf(stores.basemap.get());
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
    
    openInOSMEditor() {
        console.log('✏️ openInOSMEditor() - Opening current view in OSM editor');
        
        // Get current map bounds
        const bounds = this.map.getBounds();
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        
        console.log('📍 Map bounds:', bounds);
        console.log('📍 Map center:', center);
        console.log('📍 Map zoom:', zoom);
        
        // Construct OSM editor URL with bounds
        // Format: https://www.openstreetmap.org/edit?editor=id&bbox=west,south,east,north
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        const editorUrl = `https://www.openstreetmap.org/edit?editor=id&bbox=${bbox}`;
        
        console.log('🔗 OSM Editor URL:', editorUrl);
        
        // Open in new tab
        window.open(editorUrl, '_blank');
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
        } else {
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
        }
    }
    
    updateTreeList() {
        const treeList = document.getElementById('tree-list');
        treeList.innerHTML = '';
        
        const trees = stores.trees.get();
        trees.forEach((tree, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'tree-list-item';
            listItem.dataset.treeIndex = index;
            
            // Check for validation warnings and patchset changes
            const validation = this.validateTree(tree);
            if (validation.warnings.length > 0) {
                listItem.classList.add('has-warnings');
            }
            const patchset = stores.patchset.get();
            if (patchset.has(tree.id)) {
                listItem.classList.add('has-patchset');
            }
            
            // Create tree icon
            const icon = document.createElement('div');
            icon.className = 'tree-list-item-icon';
            const genus = tree.properties.genus ? tree.properties.genus.toLowerCase() : '';
            if (genus === 'pyrus') icon.style.backgroundColor = '#FFD700';
            else if (genus === 'prunus') icon.style.backgroundColor = '#8B008B';
            else if (genus === 'malus') icon.style.backgroundColor = '#32CD32';
            else if (genus === 'sorbus') icon.style.backgroundColor = '#FF8C00';
            else if (genus === 'cydonia') icon.style.backgroundColor = '#B8860B';
            else if (genus === 'mespilus') icon.style.backgroundColor = '#CD853F';
            else icon.style.backgroundColor = '#2196F3';
            
            // Create tree info
            const info = document.createElement('div');
            info.className = 'tree-list-item-info';
            
            const name = document.createElement('div');
            name.className = 'tree-list-item-name';
            name.textContent = this.getTreeDisplayName(tree);
            
            info.appendChild(name);
            
            listItem.appendChild(icon);
            listItem.appendChild(info);
            
            // Add click handler
            listItem.addEventListener('click', () => {
                this.selectTree(tree);
                this.highlightTreeInList(index);
            });
            
            treeList.appendChild(listItem);
        });
    }
    
    selectTree(tree) {
        stores.selectedTree.set(tree);
        this.highlightTreeInMap(tree);
    }
    
    highlightTreeInList(index) {
        // Remove previous selection
        document.querySelectorAll('.tree-list-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-tree-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
    
    highlightTreeInMap(tree) {
        // Center map on selected tree
        this.map.setView([tree.lat, tree.lng], this.map.getZoom());
    }
    
    showTreeDetails(tree) {
        const treeDetails = document.getElementById('tree-details');
        const treeDetailsInfo = document.getElementById('tree-details-info');
        
        // Show tree details panel
        treeDetails.classList.remove('hidden');
        
        // Compute effective properties (original + patchset)
        let effectiveProperties = { ...tree.properties };
        const patchset = stores.patchset.get();
        if (patchset.has(tree.id)) {
            Object.assign(effectiveProperties, patchset.get(tree.id));
        }

        // Always initialize infoContent at the very start
        let infoContent = '<div class="tree-popup-details">';

        // Validate using effective properties
        const { warnings, suggestions } = this.validateTree({ ...tree, properties: effectiveProperties });

        // Display warnings and suggestions (icon only in CSS, not in string)
        if (warnings && warnings.length > 0) {
            warnings.forEach(warning => {
                // Remove icon from warning string if present
                const cleanWarning = warning.replace(/^⚠️\s*/, '');
                infoContent += `<div class="tree-warning">${cleanWarning}</div>`;
            });
        }
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                // Remove icon from suggestion text if present
                let cleanText = suggestion.text.replace(/^💡\s*/, '');
                infoContent += `<div class="tree-suggestion">${cleanText}`;
                if (suggestion.fix) {
                    infoContent += ` <button class="fix-btn" data-action="${suggestion.fix.action}" data-value="${suggestion.fix.value}">🔧 Fix</button>`;
                }
                infoContent += `</div>`;
            });
        }

        // Display OSM ID and link at the top
        infoContent += '<div class="tree-osm-info">';
        infoContent += `<div class="tree-osm-id"><strong>OSM ID:</strong> ${tree.id}</div>`;
        infoContent += `<div class="tree-osm-link"><a href="https://www.openstreetmap.org/node/${tree.id}" target="_blank">View on OpenStreetMap</a></div>`;
        infoContent += '</div>';
        
        // Display all properties in a table format
        infoContent += '<div class="tree-properties-table">';
        infoContent += '<table>';
        infoContent += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
        infoContent += '<tbody>';

        // Track which keys are in the original properties
        const originalKeys = new Set(Object.keys(effectiveProperties));
        Object.entries(effectiveProperties).forEach(([key, value]) => {
            if (value && value !== '') {
                let rowClass = '';
                let displayValue = value;
                const patchsetValue = this.getPatchsetValue(tree.id, key);
                const originalValue = tree.properties[key];
                if (patchsetValue && originalValue && patchsetValue !== originalValue) {
                    // Value changed
                    displayValue = `<span class="original-value">${originalValue}</span> → <span class="patched-value"><strong>${patchsetValue}</strong></span>`;
                    rowClass = 'field-modified';
                } else if (patchsetValue && !originalValue) {
                    // New key added
                    displayValue = `<span class="patched-value"><strong>${patchsetValue}</strong> <span class="added-badge">added</span></span>`;
                    rowClass = 'field-modified';
                }
                // Validation highlighting
                if (key === 'species' && !value) {
                    rowClass = 'field-error';
                } else if (key === 'species:wikidata' && this.hasWikidataError(effectiveProperties)) {
                    rowClass = 'field-error';
                } else if (key === 'species' && this.hasSpeciesWarning(effectiveProperties)) {
                    rowClass = 'field-warning';
                } else if (key === 'species:wikidata' && this.hasWikidataWarning(effectiveProperties)) {
                    rowClass = 'field-warning';
                }
                infoContent += `<tr class="${rowClass}"><td>${key}</td><td>${displayValue}</td></tr>`;
            }
        });
        infoContent += '</tbody></table>';
        infoContent += '</div>';
        infoContent += '</div>';
        
        treeDetailsInfo.innerHTML = infoContent;
        
        // Add event listeners for fix buttons using event delegation
        treeDetailsInfo.addEventListener('click', (e) => {
            if (e.target.classList.contains('fix-btn')) {
                e.preventDefault();
                const action = e.target.dataset.action;
                const value = e.target.dataset.value;
                
                if (action === 'add-species') {
                    this.addToPatchset(tree.id, 'species', value);
                } else if (action === 'add-wikidata') {
                    this.addToPatchset(tree.id, 'species:wikidata', value);
                } else if (action === 'add-wikipedia') {
                    this.addToPatchset(tree.id, 'species:wikipedia', value);
                }
                // Refresh the details display
                this.showTreeDetails(tree);
            }
        });
    }
    
    getTreeDisplayName(tree) {
        const properties = tree.properties;
        
        // Priority order: taxon:cultivar > taxon > species > genus
        if (properties['taxon:cultivar']) {
            return properties['taxon:cultivar'];
        }
        if (properties.taxon) {
            return properties.taxon;
        }
        if (properties.species) {
            return properties.species;
        }
        if (properties.genus) {
            return properties.genus;
        }
        
        // Fallback to tree ID if no name available
        return `Tree ${tree.id}`;
    }

    validateTree(tree) {
        const properties = tree.properties;
        const warnings = [];
        const suggestions = [];
        
        // Get patched properties to consider in validation
        const patchedProperties = {};
        const patchset = stores.patchset.get();
        Object.keys(properties).forEach(key => {
            const patchsetValue = this.getPatchsetValue(tree.id, key);
            if (patchsetValue) {
                patchedProperties[key] = patchsetValue;
            }
        });
        
        // Merge original properties with patched properties for validation
        const effectiveProperties = { ...properties, ...patchedProperties };
        
        // Genus to scientific mapping for validation
        const GENUS_MAPPING = {
            'Malus': {
                'species': 'Malus domestica',
                'species:wikidata': 'Q18674606'
            },
            'Sorbus': {
                'species': 'Sorbus domestica',
                'species:wikidata': 'Q159558',
                'species:wikipedia': 'de:Speierling'
            },
            'Pyrus': {
                'species': 'Pyrus communis',
                'species:wikidata': 'Q146281'
            },
            'Prunus': {
                'species': 'Prunus avium', // Default for cherries
                'species:wikidata': 'Q165137'
            },
            'Cydonia': {
                'species': 'Cydonia oblonga',
                'species:wikidata': 'Q43300'
            },
            'Juglans': {
                'species': 'Juglans regia',
                'species:wikidata': 'Q46871'
            },
            'Mespilus': {
                'species': 'Mespilus germanica',
                'species:wikidata': 'Q146186'
            }
        };
        
        const genus = effectiveProperties.genus;
        if (genus && GENUS_MAPPING[genus]) {
            const mapping = GENUS_MAPPING[genus];
            
            // Check if species is missing (considering patchset)
            if (!effectiveProperties.species) {
                warnings.push('⚠️ Keine Art (species) angegeben');
                suggestions.push({ text: `💡 "${mapping.species}" könnte die richtige Art sein`, fix: { action: 'add-species', value: mapping.species } });
            } else {
                // Check if species matches expected species
                const expectedSpecies = mapping.species;
                const actualSpecies = effectiveProperties.species.toLowerCase();
                const expectedSpeciesLower = expectedSpecies.toLowerCase();
                
                if (actualSpecies !== expectedSpeciesLower) {
                    warnings.push(`⚠️ Art "${effectiveProperties.species}" stimmt nicht mit erwarteter Art überein`);
                    suggestions.push({ text: `💡 Erwartete Art: "${expectedSpecies}"`, fix: { action: 'add-species', value: expectedSpecies } });
                }
                
                // Check Wikidata reference
                if (mapping['species:wikidata']) {
                    if (!effectiveProperties['species:wikidata'] || effectiveProperties['species:wikidata'] !== mapping['species:wikidata']) {
                        warnings.push('⚠️ Falsche oder fehlende Wikidata-Referenz');
                        suggestions.push({ text: `💡 species:wikidata sollte "${mapping['species:wikidata']}" sein`, fix: { action: 'add-wikidata', value: mapping['species:wikidata'] } });
                    }
                }
                
                // Check Wikipedia reference for Sorbus
                if (genus === 'Sorbus' && mapping['species:wikipedia']) {
                    if (!effectiveProperties['species:wikipedia'] || effectiveProperties['species:wikipedia'] !== mapping['species:wikipedia']) {
                        warnings.push('⚠️ Falsche oder fehlende Wikipedia-Referenz');
                        suggestions.push({ text: `💡 species:wikipedia sollte "${mapping['species:wikipedia']}" sein`, fix: { action: 'add-wikipedia', value: mapping['species:wikipedia'] } });
                    }
                }
            }
        }
        
        return { warnings, suggestions };
    }

    hasSpeciesWarning(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        const GENUS_MAPPING = {
            'Malus': 'Malus domestica',
            'Sorbus': 'Sorbus domestica',
            'Pyrus': 'Pyrus communis',
            'Prunus': 'Prunus avium',
            'Cydonia': 'Cydonia oblonga',
            'Juglans': 'Juglans regia',
            'Mespilus': 'Mespilus germanica'
        };
        
        if (GENUS_MAPPING[genus] && properties.species) {
            const expectedSpecies = GENUS_MAPPING[genus].toLowerCase();
            const actualSpecies = properties.species.toLowerCase();
            return actualSpecies !== expectedSpecies;
        }
        
        return false;
    }

    hasWikidataWarning(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        const WIKIDATA_MAPPING = {
            'Malus': 'Q18674606',
            'Sorbus': 'Q159558',
            'Pyrus': 'Q146281',
            'Prunus': 'Q165137',
            'Cydonia': 'Q43300',
            'Juglans': 'Q46871',
            'Mespilus': 'Q146186'
        };
        
        if (WIKIDATA_MAPPING[genus] && properties['species:wikidata']) {
            return properties['species:wikidata'] !== WIKIDATA_MAPPING[genus];
        }
        
        return false;
    }

    hasWikidataError(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        const WIKIDATA_MAPPING = {
            'Malus': 'Q18674606',
            'Sorbus': 'Q159558',
            'Pyrus': 'Q146281',
            'Prunus': 'Q165137',
            'Cydonia': 'Q43300',
            'Juglans': 'Q46871',
            'Mespilus': 'Q146186'
        };
        
        if (WIKIDATA_MAPPING[genus]) {
            return !properties['species:wikidata'] || properties['species:wikidata'] !== WIKIDATA_MAPPING[genus];
        }
        
        return false;
    }

    // Patchset management methods
    addToPatchset(treeId, key, value) {
        const currentPatchset = stores.patchset.get();
        const newPatchset = new Map(currentPatchset);
        
        if (!newPatchset.has(treeId)) {
            newPatchset.set(treeId, {});
        }
        newPatchset.get(treeId)[key] = value;
        
        stores.patchset.set(newPatchset);
        console.log(`📝 Added to patchset: Tree ${treeId}, ${key} = ${value}`);
    }

    removeFromPatchset(treeId, key) {
        const currentPatchset = stores.patchset.get();
        const newPatchset = new Map(currentPatchset);
        
        if (newPatchset.has(treeId)) {
            delete newPatchset.get(treeId)[key];
            if (Object.keys(newPatchset.get(treeId)).length === 0) {
                newPatchset.delete(treeId);
            }
        }
        
        stores.patchset.set(newPatchset);
    }

    getPatchsetValue(treeId, key) {
        const patchset = stores.patchset.get();
        if (patchset.has(treeId) && patchset.get(treeId)[key]) {
            return patchset.get(treeId)[key];
        }
        return null;
    }

    hasPatchsetChanges(treeId) {
        const patchset = stores.patchset.get();
        return patchset.has(treeId);
    }

    getPatchsetSize() {
        const patchset = stores.patchset.get();
        return patchset.size;
    }

    clearPatchset() {
        stores.patchset.set(new Map());
        console.log('🗑️ Patchset cleared');
        
        // Also clear from localStorage
        try {
            localStorage.removeItem('treewarden_patchset');
            console.log('🗑️ Patchset cleared from localStorage');
        } catch (error) {
            console.error('❌ Error clearing patchset from localStorage:', error);
        }
    }

    updatePatchsetIndicator() {
        const patchsetSize = this.getPatchsetSize();
        const treeCount = document.getElementById('tree-count');
        const trees = stores.trees.get();
        
        if (patchsetSize > 0) {
            treeCount.innerHTML = `Trees: ${trees.length} <span class="patchset-indicator" id="patchset-info">(${patchsetSize} uncommitted changes)</span>`;
            
            // Add click listener for patchset info
            const patchsetInfo = document.getElementById('patchset-info');
            if (patchsetInfo && !patchsetInfo.hasEventListener) {
                patchsetInfo.addEventListener('click', () => {
                    this.showPatchsetDetails();
                });
                patchsetInfo.hasEventListener = true;
            }
            
            // Add authentication indicator if not authenticated
            this.updateAuthIndicator();
        } else {
            treeCount.innerHTML = `Trees: ${trees.length}`;
            // Remove auth indicator when no changes
            const authIndicator = document.getElementById('auth-indicator');
            if (authIndicator) {
                authIndicator.remove();
            }
        }
    }

    updateAuthIndicator() {
        const patchsetSize = this.getPatchsetSize();
        const isAuthenticated = this.isAuthenticated();
        
        // Only show auth indicator if there are changes but no authentication
        if (patchsetSize > 0 && !isAuthenticated) {
            let authIndicator = document.getElementById('auth-indicator');
            if (!authIndicator) {
                authIndicator = document.createElement('div');
                authIndicator.id = 'auth-indicator';
                authIndicator.className = 'auth-indicator';
                authIndicator.innerHTML = `
                    <span class="auth-text">🔑 Authenticate to OSM</span>
                `;
                authIndicator.addEventListener('click', () => this.authenticateWithOSM());
                
                // Insert after the tree count
                const treeCount = document.getElementById('tree-count');
                if (treeCount && treeCount.parentNode) {
                    treeCount.parentNode.insertBefore(authIndicator, treeCount.nextSibling);
                }
            }
        } else {
            const authIndicator = document.getElementById('auth-indicator');
            if (authIndicator) {
                authIndicator.remove();
            }
        }
    }

    // Update OSM upload modal buttons based on authentication status
    updateOSMUploadModalButtons() {
        const uploadBtn = document.querySelector('#osm-upload-btn');
        if (uploadBtn) {
            const isAuthenticated = this.isAuthenticated();
            uploadBtn.disabled = !isAuthenticated;
            uploadBtn.textContent = isAuthenticated ? 'Upload to OSM' : 'Upload to OSM (Authenticate First)';
        }
    }

    shouldReloadTrees() {
        if (!this.map) return true;
        
        const currentBounds = this.map.getBounds();
        const currentZoom = this.map.getZoom();
        
        // First load or no previous bounds
        if (!this.lastMapBounds || !this.lastMapZoom) {
            this.lastMapBounds = currentBounds;
            this.lastMapZoom = currentZoom;
            return true;
        }
        
        // Check if zoom changed (always reload on zoom)
        if (currentZoom !== this.lastMapZoom) {
            this.lastMapBounds = currentBounds;
            this.lastMapZoom = currentZoom;
            return true;
        }
        
        // Calculate movement percentage
        const latDiff = Math.abs(currentBounds.getCenter().lat - this.lastMapBounds.getCenter().lat);
        const lngDiff = Math.abs(currentBounds.getCenter().lng - this.lastMapBounds.getCenter().lng);
        const latSpan = currentBounds.getNorth() - currentBounds.getSouth();
        const lngSpan = currentBounds.getEast() - currentBounds.getWest();
        
        const latMovementPercent = (latDiff / latSpan) * 100;
        const lngMovementPercent = (lngDiff / lngSpan) * 100;
        const maxMovementPercent = Math.max(latMovementPercent, lngMovementPercent);
        
        // Only reload if movement is more than 20%
        if (maxMovementPercent > 20) {
            this.lastMapBounds = currentBounds;
            this.lastMapZoom = currentZoom;
            return true;
        }
        
        return false;
    }

    closeTreeDetails() {
        const treeDetails = document.getElementById('tree-details');
        treeDetails.classList.add('hidden');
        
        // Only set selectedTree to null if it's not already null to avoid circular dependency
        const currentSelectedTree = stores.selectedTree.get();
        if (currentSelectedTree !== null) {
            stores.selectedTree.set(null);
        }
        
        // Remove selection from list
        document.querySelectorAll('.tree-list-item').forEach(item => {
            item.classList.remove('selected');
        });
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
        
        // Manually construct URL to avoid URL encoding of comma
        const baseUrl = window.location.pathname;
        const locationParam = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
        const newUrl = `${baseUrl}?l=${locationParam}&z=${zoom}&basemap=${stores.basemap.get()}`;
        
        // Update URL without reloading the page
        window.history.replaceState({}, '', newUrl);
    }

    showPatchsetDetails() {
        // Create a modal to display patchset details
        const modal = document.createElement('div');
        modal.className = 'patchset-modal';
        modal.innerHTML = `
            <div class="patchset-modal-content">
                <div class="patchset-modal-header">
                    <h3>Uncommitted Changes (${this.getPatchsetSize()} trees)</h3>
                    <button class="patchset-modal-close" id="patchset-close-btn">×</button>
                </div>
                <div class="patchset-modal-body">
                    <pre class="patchset-json">${JSON.stringify(Object.fromEntries(stores.patchset.get()), null, 2)}</pre>
                </div>
                <div class="patchset-modal-footer">
                    <button class="patchset-upload-btn" id="patchset-upload-btn">Upload to OSM</button>
                    <button class="patchset-clear-btn" id="patchset-clear-btn">Clear All Changes</button>
                    <button class="patchset-close-btn" id="patchset-close-btn-footer">Close</button>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.appendChild(modal);
        
        // Add event listeners for buttons
        const closeBtn = modal.querySelector('#patchset-close-btn');
        const uploadBtn = modal.querySelector('#patchset-upload-btn');
        const clearBtn = modal.querySelector('#patchset-clear-btn');
        const closeBtnFooter = modal.querySelector('#patchset-close-btn-footer');
        
        closeBtn.addEventListener('click', () => modal.remove());
        uploadBtn.addEventListener('click', () => this.generateOSMUploadData());
        clearBtn.addEventListener('click', () => {
            modal.remove();
            this.clearPatchset();
        });
        closeBtnFooter.addEventListener('click', () => modal.remove());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    generateOSMUploadData() {
        // Mehr Logging: Patchset und Trees ausgeben
        console.log('🪵 Patchset für OSM-Upload:', stores.patchset.get());
        console.log('🌳 Trees für OSM-Upload:', stores.trees.get());
        const patchset = stores.patchset.get();
        const trees = stores.trees.get();
        
        if (patchset.size === 0) {
            alert('No changes to upload. Please make some changes first.');
            return;
        }

        // Generate OSM API changeset data
        const changesetData = {
            changeset: {
                tag: [
                    { k: 'created_by', v: 'TreeWarden' },
                    { k: 'comment', v: 'Tree data updates via TreeWarden application' },
                    { k: 'source', v: 'TreeWarden web application' }
                ]
            },
            create: [],
            modify: [],
            delete: []
        };

        // Process each tree in the patchset
        patchset.forEach((treeChanges, treeId) => {
            const tree = trees.find(t => t.id === parseInt(treeId));
            if (!tree) return;

            const hasChanges = Object.keys(treeChanges).length > 0;

            if (hasChanges) {
                // Create modified node data with complete information
                const modifiedNode = {
                    id: parseInt(treeId),
                    lat: tree.lat,
                    lon: tree.lon,
                    version: tree.version || 1, // Use actual version or default to 1
                    tag: []
                };

                // First, add all existing tags from the tree
                if (tree.tags) {
                    Object.keys(tree.tags).forEach(key => {
                        if (tree.tags[key] && tree.tags[key].trim() !== '') {
                            modifiedNode.tag.push({ k: key, v: tree.tags[key] });
                        }
                    });
                }

                // Then, add or update the modified properties
                Object.keys(treeChanges).forEach(key => {
                    if (treeChanges[key] && treeChanges[key].trim() !== '') {
                        // Remove existing tag if it exists
                        modifiedNode.tag = modifiedNode.tag.filter(tag => tag.k !== key);
                        // Add the new/modified tag
                        modifiedNode.tag.push({ k: key, v: treeChanges[key] });
                    }
                });

                changesetData.modify.push(modifiedNode);
            }
        });

        // Mehr Logging: Generierte Changeset-Daten ausgeben
        console.log('📝 Generierte OSM Changeset-Daten:', changesetData);

        // Create a new modal to display the OSM API data
        const modal = document.createElement('div');
        modal.className = 'osm-upload-modal';
        modal.innerHTML = `
            <div class="osm-upload-modal-content">
                <div class="osm-upload-modal-header">
                    <h3>OSM API Upload Data</h3>
                    <button class="osm-upload-modal-close" id="osm-modal-close-btn">×</button>
                </div>
                <div class="osm-upload-modal-body">
                    <p><strong>Generated OSM API Changeset Data:</strong></p>
                    <p>This data can be used for direct API upload to OpenStreetMap.</p>
                    <div class="osm-data-container">
                        <pre class="osm-data-json">${JSON.stringify(changesetData, null, 2)}</pre>
                    </div>
                    <div class="osm-upload-info">
                        <h4>Upload Information:</h4>
                        <ul>
                            <li><strong>Changeset Tags:</strong> ${changesetData.changeset.tag.length} tags</li>
                            <li><strong>Nodes to Modify:</strong> ${changesetData.modify.length} nodes</li>
                            <li><strong>Nodes to Create:</strong> ${changesetData.create.length} nodes</li>
                            <li><strong>Nodes to Delete:</strong> ${changesetData.delete.length} nodes</li>
                        </ul>
                    </div>
                </div>
                <div class="osm-upload-modal-footer">
                    <button class="osm-auth-btn" id="osm-auth-btn">Authenticate with OSM</button>
                    <button class="osm-upload-btn" id="osm-upload-btn" ${this.isAuthenticated() ? '' : 'disabled'}>${this.isAuthenticated() ? 'Upload to OSM' : 'Upload to OSM (Authenticate First)'}</button>
                    <button class="osm-copy-btn" id="osm-copy-btn">Copy to Clipboard</button>
                    <button class="osm-download-btn" id="osm-download-btn">Download JSON</button>
                    <button class="osm-close-btn" id="osm-close-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.appendChild(modal);
        
        // Add event listeners for buttons with proper data handling
        const closeBtn = modal.querySelector('#osm-modal-close-btn');
        const authBtn = modal.querySelector('#osm-auth-btn');
        const uploadBtn = modal.querySelector('#osm-upload-btn');
        const copyBtn = modal.querySelector('#osm-copy-btn');
        const downloadBtn = modal.querySelector('#osm-download-btn');
        const closeBtnFooter = modal.querySelector('#osm-close-btn');
        
        // Debug: Check if buttons are found
        console.log('🔍 Button elements found:');
        console.log('  - closeBtn (X):', closeBtn);
        console.log('  - authBtn:', authBtn);
        console.log('  - uploadBtn:', uploadBtn);
        console.log('  - copyBtn:', copyBtn);
        console.log('  - downloadBtn:', downloadBtn);
        console.log('  - closeBtnFooter:', closeBtnFooter);
        
        closeBtn.addEventListener('click', () => {
            console.log('❌ Close button (X) clicked!');
            modal.remove();
        });
        authBtn.addEventListener('click', () => {
            console.log('🔑 Auth button clicked!');
            console.log('🔑 osmAuth object:', this.osmAuth);
            console.log('🔑 authenticateWithOSM method:', this.authenticateWithOSM);
            this.authenticateWithOSM();
        });
        uploadBtn.addEventListener('click', () => {
            if (!this.isAuthenticated()) {
                alert('Please authenticate with OSM first before uploading changes.');
                return;
            }
            this.performOSMUpload(changesetData);
        });
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(JSON.stringify(changesetData, null, 2));
        });
        downloadBtn.addEventListener('click', () => {
            this.downloadOSMData(changesetData);
        });
        closeBtnFooter.addEventListener('click', () => {
            console.log('❌ Close button (footer) clicked!');
            modal.remove();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('❌ Modal background clicked!');
                modal.remove();
            }
        });
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('OSM API data copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard. Please select and copy manually.');
        });
    }

    downloadOSMData(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `osm-changeset-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // OSM OAuth Authentication using osm-auth library
    initOSMOAuth() {
        console.log('🔑 Initializing OSM OAuth...');
        
        // Generate redirect URI based on current browser location
        const currentOrigin = window.location.origin;
        const redirectUri = currentOrigin + window.location.pathname;
        
        console.log('🔗 Generated redirect URI:', redirectUri);
        
        // Initialize osm-auth with the provided OAuth configuration
        this.osmAuth = osmAuth.osmAuth({
            client_id: 'BxotvxIGppe-bd81erCe2UhcAzePALXMtCcSaMlhAS4',
            redirect_uri: redirectUri,
            scope: 'write_api',
            auto: true, // Disable automatic token handling to debug
            singlepage: true, // Single page application mode
            url: 'https://www.openstreetmap.org',
            apiUrl: 'https://api.openstreetmap.org'
        });
        
        console.log('✅ osmAuth initialized successfully:', this.osmAuth);
        
        // Check if we have a valid token on startup
        if (this.osmAuth.authenticated()) {
            console.log('✅ Found existing OSM access token via osm-auth');
            
            // If osmAuth says we're authenticated, store authentication status
            // The actual token will be retrieved when needed for API calls
            localStorage.setItem('osm_authenticated', 'true');
            localStorage.setItem('osm_auth_timestamp', Date.now().toString());
            console.log('💾 OSM authentication status stored in localStorage');
        } else {
            console.log('🔑 No existing OSM authentication found');
            
            // For single-page applications, check if we have an authorization code in the URL
            // This follows the official osm-auth documentation example
            if (window.location.search.slice(1).split('&').some(p => p.startsWith('code='))) {
                console.log('🔑 Found authorization code in URL, calling authenticate...');
                this.osmAuth.authenticate((err) => {
                    if (err) {
                        console.error('❌ Failed to authenticate:', err);
                        alert('Authentication failed: ' + err.message);
                    } else {
                        console.log('✅ Successfully authenticated via osm-auth');
                        
                        // Store the access token in localStorage
                        const token = this.osmAuth.getToken ? this.osmAuth.getToken() : this.osmAuth.token;
                        if (token) {
                            localStorage.setItem('osm_access_token', token);
                            localStorage.setItem('osm_token_timestamp', Date.now().toString());
                            console.log('💾 OSM access token stored in localStorage');
                        }
                        
                        // Store authentication status
                        localStorage.setItem('osm_authenticated', 'true');
                        localStorage.setItem('osm_auth_timestamp', Date.now().toString());
                        console.log('💾 OSM authentication status stored in localStorage');
                        
                        this.updateAuthIndicator();
                        this.updateOSMUploadModalButtons();
                        alert('Successfully authenticated with OpenStreetMap!');
                        
                        // Clean up the URL by removing OAuth parameters
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                });
            }
        }
        
        // Log authentication status for debugging
        this.checkOSMAuthStatus();
    }



    authenticateWithOSM() {
        console.log('🔑 Starting OSM authentication with osm-auth');
        console.log('🔑 this.osmAuth:', this.osmAuth);
        
        // Check if osmAuth is initialized
        if (!this.osmAuth) {
            console.error('❌ OSM Auth is not initialized!');
            console.log('🔑 Attempting to reinitialize OSM Auth...');
            
            // Try to reinitialize
            this.initOSMOAuth();
            
            // Check again after a short delay
            setTimeout(() => {
                if (!this.osmAuth) {
                    alert('OSM authentication is not available. Please refresh the page and try again.');
                } else {
                    console.log('✅ OSM Auth reinitialized successfully, retrying authentication...');
                    this.authenticateWithOSM();
                }
            }, 500);
            return;
        }
        
        this.osmAuth.authenticate((err) => {
            if (err) {
                console.error('❌ OSM authentication failed:', err);
                alert('OSM authentication failed: ' + err.message);
            } else {
                console.log('✅ OSM authentication successful');
                
                // Store the access token in localStorage
                const token = this.osmAuth.getToken ? this.osmAuth.getToken() : this.osmAuth.token;
                if (token) {
                    localStorage.setItem('osm_access_token', token);
                    localStorage.setItem('osm_token_timestamp', Date.now().toString());
                    console.log('💾 OSM access token stored in localStorage');
                }
                
                // Store authentication status
                localStorage.setItem('osm_authenticated', 'true');
                localStorage.setItem('osm_auth_timestamp', Date.now().toString());
                console.log('💾 OSM authentication status stored in localStorage');
                
                alert('OSM authentication successful! You can now upload changes.');
                // Update authentication indicator
                this.updateAuthIndicator();
                // Update any open OSM upload modals
                this.updateOSMUploadModalButtons();
            }
        });
    }



    getOSMAccessToken() {
        // First check if we're authenticated
        if (!this.isAuthenticated()) {
            return null;
        }
        
        // Try to get token from localStorage
        const token = localStorage.getItem('osm_access_token');
        const timestamp = localStorage.getItem('osm_token_timestamp');
        
        if (token && timestamp) {
            // Check if token is not too old (24 hours)
            const tokenAge = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (tokenAge < maxAge) {
                console.log('🔑 Using OSM token from localStorage');
                return token;
            } else {
                console.log('🔑 OSM token from localStorage is too old, removing');
                localStorage.removeItem('osm_access_token');
                localStorage.removeItem('osm_token_timestamp');
            }
        }
        
        // If we're authenticated but don't have a token, try to get it from osmAuth
        if (this.osmAuth && this.osmAuth.authenticated()) {
            console.log('🔑 Attempting to get token from osmAuth');
            // Try different methods to get the token
            const token = this.osmAuth.getToken ? this.osmAuth.getToken() : 
                         (typeof this.osmAuth.token === 'function' ? this.osmAuth.token() : this.osmAuth.token);
            
            if (token) {
                console.log('🔑 Got token from osmAuth, storing in localStorage');
                localStorage.setItem('osm_access_token', token);
                localStorage.setItem('osm_token_timestamp', Date.now().toString());
                return token;
            }
        }
        
        return null;
    }

    // Check if user is authenticated with OSM
    isAuthenticated() {
        // Check localStorage for authentication status
        const authenticated = localStorage.getItem('osm_authenticated');
        const authTimestamp = localStorage.getItem('osm_auth_timestamp');
        
        if (authenticated === 'true' && authTimestamp) {
            // Check if authentication is not too old (24 hours)
            const authAge = Date.now() - parseInt(authTimestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (authAge < maxAge) {
                return true;
            } else {
                // Authentication is too old, remove it
                localStorage.removeItem('osm_authenticated');
                localStorage.removeItem('osm_auth_timestamp');
            }
        }
        
        return false;
    }

    // Check OSM authentication status
    checkOSMAuthStatus() {
        const authenticated = localStorage.getItem('osm_authenticated');
        const authTimestamp = localStorage.getItem('osm_auth_timestamp');
        
        if (authenticated === 'true' && authTimestamp) {
            // Check if authentication is not too old (24 hours)
            const authAge = Date.now() - parseInt(authTimestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (authAge < maxAge) {
                console.log('🔑 OSM Auth Status: Authenticated');
                return true;
            } else {
                console.log('🔑 OSM Auth Status: Authentication expired');
                localStorage.removeItem('osm_authenticated');
                localStorage.removeItem('osm_auth_timestamp');
            }
        }
        
        console.log('🔑 OSM Auth Status: Not authenticated');
        return false;
    }

    async uploadToOSM(changesetData) {
        // Mehr Logging: Token und Changeset-Daten ausgeben
        console.log('📦 Changeset-Daten für Upload:', changesetData);
        
        if (!this.osmAuth || !this.osmAuth.authenticated()) {
            console.error('❌ Kein gültiges OSM-Token vorhanden!');
            throw new Error('No valid OSM access token. Please authenticate first.');
        }
        
        try {
            // Step 1: Changeset-XML generieren und loggen
            const changesetXml = this.generateOSMXML(changesetData);
            console.log('📝 Changeset-XML für Erstellung:', changesetXml);
            
            // Use osm-auth for authenticated request
            const changesetResponse = await new Promise((resolve, reject) => {
                this.osmAuth.xhr({
                    method: 'PUT',
                    path: '/api/0.6/changeset/create',
                    content: changesetXml,
                    headers: {
                        'Content-Type': 'application/xml'
                    }
                }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            // Mehr Logging: Response für Changeset-Erstellung
            console.log('📨 Response Changeset-Erstellung:', changesetResponse);
            const changesetId = changesetResponse;
            console.log('🆔 Changeset-ID erhalten:', changesetId);
            
            // Step 2: Upload-XML generieren und loggen
            const uploadXml = this.generateOSMXML(changesetData, changesetId);
            console.log('📝 Upload-XML für Änderungen:', uploadXml);
            
            // Use osm-auth for authenticated upload request
            const changesResponse = await new Promise((resolve, reject) => {
                this.osmAuth.xhr({
                    method: 'POST',
                    path: `/api/0.6/changeset/${changesetId}/upload`,
                    content: uploadXml,
                    headers: {
                        'Content-Type': 'application/xml'
                    }
                }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            // Mehr Logging: Response für Upload
            console.log('📨 Response Upload:', changesResponse);
            
            // Step 3: Changeset schließen
            const closeResponse = await new Promise((resolve, reject) => {
                this.osmAuth.xhr({
                    method: 'PUT',
                    path: `/api/0.6/changeset/${changesetId}/close`
                }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            // Mehr Logging: Response für Changeset-Schließen
            console.log('📨 Response Changeset-Schließen:', closeResponse);
            return changesetId;
        } catch (error) {
            // Mehr Logging: Fehler im Upload-Prozess
            console.error('❌ Fehler im Upload-Prozess:', error);
            throw error;
        }
    }

    generateOSMXML(changesetData, changesetId = null) {
        // Mehr Logging: XML-Generierung aufgerufen
        console.log('🛠️ generateOSMXML aufgerufen mit changesetId:', changesetId, 'und Daten:', changesetData);
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        
        if (changesetId) {
            // Generate changes XML
            xml += '<osmChange version="0.6" generator="TreeWarden">\n';
            
            if (changesetData.modify && changesetData.modify.length > 0) {
                xml += '  <modify>\n';
                changesetData.modify.forEach(node => {
                    xml += `    <node id="${node.id}" lat="${node.lat}" lon="${node.lon}" version="${node.version}" changeset="${changesetId}">\n`;
                    node.tag.forEach(tag => {
                        xml += `      <tag k="${this.escapeXml(tag.k)}" v="${this.escapeXml(tag.v)}"/>\n`;
                    });
                    xml += '    </node>\n';
                });
                xml += '  </modify>\n';
            }
            
            xml += '</osmChange>';
        } else {
            // Generate changeset XML
            xml += '<osm version="0.6" generator="TreeWarden">\n';
            xml += '  <changeset>\n';
            changesetData.changeset.tag.forEach(tag => {
                xml += `    <tag k="${this.escapeXml(tag.k)}" v="${this.escapeXml(tag.v)}"/>\n`;
            });
            xml += '  </changeset>\n';
            xml += '</osm>';
        }
        
        // Mehr Logging: Generiertes XML ausgeben
        console.log('🛠️ Generiertes OSM-XML:', xml);
        return xml;
    }

    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async performOSMUpload(changesetData) {
        // Mehr Logging: Start des Uploads
        console.log('⬆️ Starte OSM-Upload mit Daten:', changesetData);
        try {
            const changesetId = await this.uploadToOSM(changesetData);
            // Mehr Logging: Erfolgreicher Upload
            console.log('✅ OSM-Upload erfolgreich, Changeset-ID:', changesetId);
            alert(`✅ Successfully uploaded to OSM! Changeset ID: ${changesetId}`);
            
            // Clear the patchset after successful upload
            this.clearPatchset();
            
            // Close the modal
            const modal = document.querySelector('.osm-upload-modal');
            if (modal) {
                modal.remove();
            }
        } catch (error) {
            // Mehr Logging: Fehler beim Upload
            console.error('❌ Fehler beim OSM-Upload:', error);
            alert(`❌ Upload failed: ${error.message}`);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.treeWarden = new TreeWardenMap();
}); 