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

        // Listen to patchset changes - with debouncing to prevent loops
        let patchsetUpdateTimeout;
        stores.patchset.subscribe((patchset) => {
            // Clear any pending update
            if (patchsetUpdateTimeout) {
                clearTimeout(patchsetUpdateTimeout);
            }
            
            // Debounce the updates to prevent rapid successive calls
            patchsetUpdateTimeout = setTimeout(() => {
                this.updateTreeList();
                this.updatePatchsetIndicator();
            }, 100); // 100ms debounce
        });

        // Listen to loading state
        stores.loading.subscribe((isLoading) => {
            this.showLoading(isLoading);
        });

        // Note: No basemap listener needed since changeBaseLayer updates the store directly
    }
    
    init() {
        this.initMap();
        this.initLayers();
        this.initControls();
        
        // Wait for map to be ready before loading trees
        this.map.whenReady(() => {
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
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }
        
        this.showLoading(true);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                this.map.setView([lat, lng], 16);
                
                setTimeout(() => {
                    this.loadRealTrees();
                }, 500);
                
                this.showLoading(false);
            },
            (error) => {
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
        if (stores.loading.get()) {
            return;
        }
        
        stores.loading.set(true);
        
        try {
            const mapBounds = this.map.getBounds();
            const latDiff = mapBounds.getNorth() - mapBounds.getSouth();
            const lngDiff = mapBounds.getEast() - mapBounds.getWest();
            const latExpansion = latDiff * 0.25;
            const lngExpansion = lngDiff * 0.25;
            
            const bounds = {
                south: mapBounds.getSouth() - latExpansion,
                west: mapBounds.getWest() - lngExpansion,
                north: mapBounds.getNorth() + latExpansion,
                east: mapBounds.getEast() + lngExpansion
            };
            
            const orchardLatExpansion = latDiff * 4.5;
            const orchardLngExpansion = lngDiff * 4.5;
            
            const orchardBounds = {
                south: mapBounds.getSouth() - orchardLatExpansion,
                west: mapBounds.getWest() - orchardLngExpansion,
                north: mapBounds.getNorth() + orchardLatExpansion,
                east: mapBounds.getEast() + orchardLngExpansion
            };
            
            const query = this.buildOverpassQuery(bounds);
            const trees = await this.fetchTreesFromOverpass(query);
            
            const orchardQuery = this.buildOrchardQuery(orchardBounds);
            const orchards = await this.fetchOrchardsFromOverpass(orchardQuery);
            
            this.displayTrees(trees);
            this.displayOrchards(orchards);
            this.updateTreeCount(trees.length);
            this.updatePatchsetIndicator();
        } catch (error) {
            console.error('Error loading trees:', error);
        } finally {
            stores.loading.set(false);
        }
    }
    

    
    async loadTrees() {
        // Legacy method - now redirects to real tree loading
        this.loadRealTrees();
    }
    
    buildOverpassQuery(bounds) {
        const { south, west, north, east } = bounds;
        const filter = '["natural"="tree"]';
        const query = `[out:json][timeout:25];node${filter}(${south},${west},${north},${east});out meta;`;
        return query;
    }
    
    buildOrchardQuery(bounds) {
        const { south, west, north, east } = bounds;
        const query = `[out:json][timeout:25];
        way["landuse"="orchard"](${south},${west},${north},${east});
        out geom;
        relation["landuse"="orchard"](${south},${west},${north},${east});
        out geom;`;
        return query;
    }
    
    async fetchTreesFromOverpass(query) {
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000);
        
        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 5000000) {
                throw new Error('Response too large - Overpass API returned too much data');
            }
            
            const textPromise = response.text();
            const textTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Response text read timeout')), 3000)
            );
            
            const responseText = await Promise.race([textPromise, textTimeoutPromise]);
            
            if (responseText.length > 1000000) {
                throw new Error('Response text too large - Overpass API returned too much data');
            }
            
            const data = JSON.parse(responseText);
            const trees = this.parseOverpassData(data);
            
            return trees;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - Overpass API is slow or unavailable');
            }
            throw error;
        }
    }
    
    async fetchOrchardsFromOverpass(query) {
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 15000);
        
        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const responseText = await response.text();
            
            if (responseText.length > 2000000) {
                throw new Error('Orchard response text too large - Overpass API returned too much data');
            }
            
            const data = JSON.parse(responseText);
            const orchards = this.parseOrchardData(data);
            
            return orchards;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Orchard request timeout - Overpass API is slow or unavailable');
            }
            throw error;
        }
    }
    
    parseOverpassData(data) {
        const trees = [];
        
        if (data.elements) {
            data.elements.forEach((element) => {
                if (element.type === 'node' && element.lat && element.lon) {
                    const tree = {
                        id: element.id,
                        lat: element.lat,
                        lon: element.lon,
                        version: element.version,
                        timestamp: element.timestamp,
                        uid: element.uid,
                        user: element.user,
                        type: 'node',
                        tags: element.tags || {},
                        properties: this.extractTreeProperties(element.tags)
                    };
                    trees.push(tree);
                }
            });
        }
        
        return trees;
    }
    
    extractTreeProperties(tags) {
        const properties = {};
        
        if (tags) {
            // Keep OSM data in original format - no transformations
            Object.keys(tags).forEach(key => {
                if (tags[key] && tags[key].trim() !== '') {
                    properties[key] = tags[key];
                }
            });
        }
        
        return properties;
    }
    
    parseOrchardData(data) {
        const orchards = [];
        
        if (data.elements) {
            data.elements.forEach((element) => {
                if ((element.type === 'way' || element.type === 'relation') && element.geometry) {
                    const coordinates = element.geometry.map(point => [point.lat, point.lon]);
                    
                    const orchard = {
                        id: element.id,
                        type: element.type,
                        coordinates: coordinates,
                        tags: element.tags || {},
                        properties: this.extractOrchardProperties(element.tags)
                    };
                    orchards.push(orchard);
                }
            });
        }
        
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
        this.orchardLayer.clearLayers();
        
        orchards.forEach(orchard => {
            try {
                const polygon = L.polygon(orchard.coordinates, {
                    color: 'red',
                    weight: 2,
                    fillColor: 'transparent',
                    fillOpacity: 0
                });
                
                const popupContent = this.createOrchardPopup(orchard);
                polygon.bindPopup(popupContent);
                
                polygon.addTo(this.orchardLayer);
            } catch (error) {
                console.error(`Error displaying orchard ${orchard.id}:`, error);
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
        if (properties.diameter_crown) {
            content += `<div><strong>Crown Diameter:</strong> ${properties.diameter_crown}m</div>`;
        }
        if (properties.circumference) {
            content += `<div><strong>Circumference:</strong> ${properties.circumference}cm</div>`;
        }
        if (properties.leaf_type) {
            content += `<div><strong>Leaf Type:</strong> ${properties.leaf_type}</div>`;
        }
        if (properties.leaf_cycle) {
            content += `<div><strong>Leaf Cycle:</strong> ${properties.leaf_cycle}</div>`;
        }
        if (properties.age) {
            content += `<div><strong>Age:</strong> ${properties.age} years</div>`;
        }
        if (properties.planted) {
            content += `<div><strong>Planted:</strong> ${properties.planted}</div>`;
        }
        if (properties.start_date) {
            content += `<div><strong>Start Date:</strong> ${properties.start_date}</div>`;
        }
        if (properties.denotation) {
            content += `<div><strong>Denotation:</strong> ${properties.denotation}</div>`;
        }
        if (properties.protection) {
            content += `<div><strong>Protection:</strong> ${properties.protection}</div>`;
        }
        if (properties.loc_name) {
            content += `<div><strong>Local Name:</strong> ${properties.loc_name}</div>`;
        }
        
        // Display coordinates
        content += `<div><strong>Coordinates:</strong> ${tree.lat.toFixed(7)}, ${tree.lon.toFixed(7)}</div>`;
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
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
        
        this.reloadTimeout = setTimeout(() => {
            if (this.shouldReloadTrees()) {
                this.loadRealTrees();
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
        const bounds = this.map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        const editorUrl = `https://www.openstreetmap.org/edit?editor=id&bbox=${bbox}`;
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
        const patchset = stores.patchset.get();
        
        trees.forEach((tree, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'tree-list-item';
            listItem.dataset.treeIndex = index;
            
            // Check for patchset changes (fast check)
            if (patchset.has(tree.id)) {
                listItem.classList.add('has-patchset');
            }
            
            // Only validate if tree has patchset changes (optimization)
            if (patchset.has(tree.id)) {
                const validation = this.validateTree(tree);
                if (validation.warnings.length > 0) {
                    listItem.classList.add('has-warnings');
                }
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
        this.map.setView([tree.lat, tree.lon], this.map.getZoom());
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

        // Display OSM ID, version and link at the top
        infoContent += '<div class="tree-osm-info">';
        infoContent += `<div class="tree-osm-id"><strong>OSM ID:</strong> ${tree.id}</div>`;
        infoContent += `<div class="tree-osm-version"><strong>Version:</strong> ${tree.version || 'Unknown'}</div>`;
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
        
        // Get patched properties to consider in validation - optimized
        const patchset = stores.patchset.get();
        const treeChanges = patchset.get(tree.id);
        const effectiveProperties = { ...properties, ...treeChanges };
        
        // Use shared genus mapping for validation
        const GENUS_MAPPING = this.getGenusMapping();
        
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
            
            // Check Wikidata reference based on existing species (for additional fruit trees)
            if (effectiveProperties.species) {
                const speciesWikidataMapping = this.getSpeciesWikidataMapping();
                const expectedWikidata = speciesWikidataMapping[effectiveProperties.species];
                
                if (expectedWikidata) {
                    if (!effectiveProperties['species:wikidata'] || effectiveProperties['species:wikidata'] !== expectedWikidata) {
                        warnings.push('⚠️ Falsche oder fehlende Wikidata-Referenz für diese Art');
                        suggestions.push({ text: `💡 species:wikidata sollte "${expectedWikidata}" sein`, fix: { action: 'add-wikidata', value: expectedWikidata } });
                    }
                }
            }
        }
        
        return { warnings, suggestions };
    }

    getGenusMapping() {
        return {
            'Malus': {
                'species': 'Malus Domestica',
                'species:wikidata': 'Q18674606'
            },
            'Sorbus': {
                'species': 'Sorbus Domestica',
                'species:wikidata': 'Q159558',
                'species:wikipedia': 'de:Speierling'
            },
            'Pyrus': {
                'species': 'Pyrus Communis',
                'species:wikidata': 'Q146281'
            },
            'Prunus': {
                'species': 'Prunus Avium', // Default for cherries
                'species:wikidata': 'Q165137'
            },
            'Cydonia': {
                'species': 'Cydonia Oblonga',
                'species:wikidata': 'Q43300'
            },
            'Juglans': {
                'species': 'Juglans Regia',
                'species:wikidata': 'Q46871'
            },
            'Mespilus': {
                'species': 'Mespilus Germanica',
                'species:wikidata': 'Q146186'
            }
        };
    }

    getSpeciesWikidataMapping() {
        return {
            // Existing species
            'Malus Domestica': 'Q18674606',
            'Sorbus Domestica': 'Q159558',
            'Pyrus Communis': 'Q146281',
            'Prunus Avium': 'Q165137',
            'Cydonia Oblonga': 'Q43300',
            'Juglans Regia': 'Q46871',
            'Mespilus Germanica': 'Q146186',
            
            // Additional Castanea species
            'Castanea Sativa': 'Q147821',
            'Castanea Mollissima': 'Q2940909',
            'Castanea Dentata': 'Q1049459',
            'Castanea Crenata': 'Q1049458',
            
            // Additional Corylus species  
            'Corylus Avellana': 'Q124969',
            'Corylus Maxima': 'Q1139290',
            'Corylus Americana': 'Q2997605',
            'Corylus Colurna': 'Q158748',
            
            // Additional Sambucus species
            'Sambucus Nigra': 'Q22701',
            'Sambucus Ebulus': 'Q158515',
            'Sambucus Racemosa': 'Q158516',
            
            // Additional Citrus species
            'Citrus Sinensis': 'Q3355098',
            'Citrus Limon': 'Q500',
            'Citrus Reticulata': 'Q13184',
            'Citrus Paradisi': 'Q132177',
            'Citrus Aurantifolia': 'Q132153',
            'Citrus Medica': 'Q132155',
            
            // Additional Ficus species
            'Ficus Carica': 'Q36146',
            'Ficus Benjamina': 'Q147468',
            'Ficus Elastica': 'Q147472',
            
            // Additional Prunus species - Plums, Cherries, etc.
            'Prunus Domestica': 'Q149459',           // Pflaume/Zwetsche (allgemein)
            'Prunus Domestica Subsp. Domestica': 'Q13223298', // Zwetschge (spezifisch)
            'Prunus Salicina': 'Q1250033',          // Japanische Pflaume
            'Prunus Cerasifera': 'Q146951',         // Kirschpflaume/Myrobalan
            'Prunus Persica': 'Q13189',             // Pfirsich
            'Prunus Dulcis': 'Q13187',              // Mandel
            'Prunus Cerasus': 'Q165137',            // Sauerkirsche
            'Prunus Spinosa': 'Q158776',            // Schlehe
            'Prunus Armeniaca': 'Q13188',           // Aprikose
            
            // Additional Cydonia and Quince species
            'Cydonia Oblonga': 'Q43300',            // Quitte
            
            // Case variations and common spellings
            'Malus domestica': 'Q18674606',
            'Pyrus communis': 'Q146281',
            'Prunus avium': 'Q165137',              // Süßkirsche
            'Prunus cerasus': 'Q165137',            // Sauerkirsche
            'Prunus domestica': 'Q149459',          // Pflaume
            'Cydonia oblonga': 'Q43300'             // Quitte
        };
    }

    hasSpeciesWarning(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        const GENUS_MAPPING = this.getGenusMapping();
        
        if (GENUS_MAPPING[genus] && properties.species) {
            const expectedSpecies = GENUS_MAPPING[genus].species.toLowerCase();
            const actualSpecies = properties.species.toLowerCase();
            return actualSpecies !== expectedSpecies;
        }
        
        return false;
    }

    hasWikidataWarning(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        // Check traditional genus mapping first
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
        
        // Check species-based mapping for additional fruit trees
        if (properties.species && properties['species:wikidata']) {
            const speciesWikidataMapping = this.getSpeciesWikidataMapping();
            const expectedWikidata = speciesWikidataMapping[properties.species];
            
            if (expectedWikidata) {
                return properties['species:wikidata'] !== expectedWikidata;
            }
        }
        
        return false;
    }

    hasWikidataError(properties) {
        const genus = properties.genus;
        if (!genus) return false;
        
        // Check traditional genus mapping first
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
        
        // Check species-based mapping for additional fruit trees
        if (properties.species) {
            const speciesWikidataMapping = this.getSpeciesWikidataMapping();
            const expectedWikidata = speciesWikidataMapping[properties.species];
            
            if (expectedWikidata) {
                return !properties['species:wikidata'] || properties['species:wikidata'] !== expectedWikidata;
            }
        }
        
        return false;
    }

    // Patchset management methods
    addToPatchset(treeId, key, value) {
        const currentPatchset = stores.patchset.get();
        
        // Check if the value is already the same (prevent unnecessary updates)
        if (currentPatchset.has(treeId) && currentPatchset.get(treeId)[key] === value) {
            return; // No change needed
        }
        
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
        const patchset = stores.patchset.get();
        const trees = stores.trees.get();
        
        // Create a Map for O(1) tree lookup
        const treeMap = new Map();
        trees.forEach(tree => treeMap.set(tree.id, tree));
        
        // Generate structured content
        let content = '<div class="patchset-changes-list">';
        content += '<h4>Changed Trees:</h4>';
        
        patchset.forEach((treeChanges, treeId) => {
            const tree = treeMap.get(parseInt(treeId));
            const treeName = tree ? this.getTreeDisplayName(tree) : `Tree ${treeId}`;
            const version = tree ? tree.version : 'Unknown';
            
            content += `<div class="patchset-tree-item">`;
            content += `<div class="patchset-tree-header">`;
            content += `<strong>${treeName}</strong> (ID: ${treeId}, Version: ${version})`;
            content += `</div>`;
            content += `<div class="patchset-tree-changes">`;
            
            Object.entries(treeChanges).forEach(([key, value]) => {
                const originalValue = tree && tree.properties ? tree.properties[key] : '';
                if (originalValue && originalValue !== value) {
                    content += `<div class="patchset-change">`;
                    content += `<span class="change-key">${key}:</span> `;
                    content += `<span class="original-value">${originalValue}</span> → `;
                    content += `<span class="new-value">${value}</span>`;
                    content += `</div>`;
                } else {
                    content += `<div class="patchset-change">`;
                    content += `<span class="change-key">${key}:</span> `;
                    content += `<span class="new-value">${value}</span> <span class="added-badge">(added)</span>`;
                    content += `</div>`;
                }
            });
            
            content += `</div>`;
            content += `</div>`;
        });
        
        content += '</div>';
        
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
                    ${content}
                    <details>
                        <summary>Raw JSON Data</summary>
                        <pre class="patchset-json">${JSON.stringify(Object.fromEntries(patchset), null, 2)}</pre>
                    </details>
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
        const patchset = stores.patchset.get();
        const trees = stores.trees.get();
        
        if (patchset.size === 0) {
            alert('No changes to upload. Please make some changes first.');
            return;
        }

        // Create a Map for O(1) tree lookup
        const treeMap = new Map();
        trees.forEach(tree => treeMap.set(tree.id, tree));

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
        const missingVersions = [];
        
        patchset.forEach((treeChanges, treeId) => {
            const tree = treeMap.get(parseInt(treeId));
            if (!tree) return;

            const hasChanges = Object.keys(treeChanges).length > 0;

            if (hasChanges) {
                // Create modified node data with complete information
                const modifiedNode = {
                    id: parseInt(treeId),
                    lat: tree.lat,
                    lon: tree.lon,
                    tag: []
                };

                // For modified nodes, we must have the version from the server
                if (!tree.version) {
                    console.error(`❌ Missing version for node ${treeId}. Cannot upload modifications without version.`);
                    missingVersions.push(treeId);
                    return;
                }
                modifiedNode.version = tree.version;

                // Create a Map for O(1) tag lookup and merging
                const tagMap = new Map();
                
                // Add existing tags
                if (tree.tags) {
                    Object.keys(tree.tags).forEach(key => {
                        if (tree.tags[key] && tree.tags[key].trim() !== '') {
                            tagMap.set(key, tree.tags[key]);
                        }
                    });
                }

                // Add or update modified properties - use original OSM keys
                Object.keys(treeChanges).forEach(key => {
                    if (treeChanges[key] && treeChanges[key].trim() !== '') {
                        tagMap.set(key, treeChanges[key]);
                    }
                });

                // Convert Map back to array
                modifiedNode.tag = Array.from(tagMap.entries()).map(([k, v]) => ({ k, v }));

                changesetData.modify.push(modifiedNode);
            }
        });

        // Check if any nodes are missing versions
        if (missingVersions.length > 0) {
            const nodeList = missingVersions.join(', ');
            alert(`Cannot upload changes for nodes: ${nodeList}\n\nMissing version information. Please reload the tree data and try again.`);
            return null;
        }

        // Mehr Logging: Generierte Changeset-Daten ausgeben
        console.log('📝 Generierte OSM Changeset-Daten:', changesetData);

        // Create a new modal to display the OSM API data - optimized
        const modal = document.createElement('div');
        modal.className = 'osm-upload-modal';
        
        // Create modal content without large JSON string
        const modalContent = document.createElement('div');
        modalContent.className = 'osm-upload-modal-content';
        modalContent.innerHTML = `
            <div class="osm-upload-modal-header">
                <h3>OSM API Upload Data</h3>
                <button class="osm-upload-modal-close" id="osm-modal-close-btn">×</button>
            </div>
            <div class="osm-upload-modal-body">
                <p><strong>Generated OSM API Changeset Data:</strong></p>
                <p>This data can be used for direct API upload to OpenStreetMap.</p>
                <div class="osm-data-container">
                    <pre class="osm-data-json" id="osm-data-json"></pre>
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
        
        // Append modal content to modal
        modal.appendChild(modalContent);
        
        // Add modal to page
        document.body.appendChild(modal);
        
        // Add JSON data after modal is created (lazy loading for performance)
        const jsonElement = modal.querySelector('#osm-data-json');
        if (jsonElement) {
            // Use requestAnimationFrame to avoid blocking the UI
            requestAnimationFrame(() => {
                jsonElement.textContent = JSON.stringify(changesetData, null, 2);
            });
        }
        
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
        
        // Return the changeset data for programmatic use
        return changesetData;
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
        console.log('📦 Changeset-Daten für Upload:', changesetData);
        
        if (!this.osmAuth || !this.osmAuth.authenticated()) {
            console.error('❌ Kein gültiges OSM-Token vorhanden!');
            throw new Error('No valid OSM access token. Please authenticate first.');
        }
        
        try {
            // Step 1: Changeset-XML generieren und loggen
            const changesetXml = this.generateOSMXML(changesetData);
            console.log('📝 Changeset-XML für Erstellung:', changesetXml);
            
            // Use osm-auth fetch API for authenticated request
            console.log('📤 Starting changeset creation with osm-auth fetch...');
            const changesetResponse = await this.osmAuth.fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: changesetXml
            });
            
            if (!changesetResponse.ok) {
                const responseText = await changesetResponse.text();
                const errorDetails = `HTTP ${changesetResponse.status} ${changesetResponse.statusText}: ${responseText}`;
                console.error('❌ Changeset creation failed:', errorDetails);
                throw new Error(errorDetails);
            }
            
            const changesetId = await changesetResponse.text();
            console.log('🆔 Changeset-ID erhalten:', changesetId);
            
            // Step 2: Upload-XML generieren und loggen
            const uploadXml = this.generateOSMXML(changesetData, changesetId);
            console.log('📝 Upload-XML für Änderungen:', uploadXml);
            
            // Use osm-auth fetch API for authenticated upload request
            console.log('📤 Starting upload with osm-auth fetch...');
            const changesResponse = await this.osmAuth.fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml'
                },
                body: uploadXml
            });
            
            if (!changesResponse.ok) {
                const responseText = await changesResponse.text();
                const errorDetails = `HTTP ${changesResponse.status} ${changesResponse.statusText}: ${responseText}`;
                console.error('❌ Upload failed:', errorDetails);
                throw new Error(errorDetails);
            }
            
            const changesResponseText = await changesResponse.text();
            
            console.log('📨 Response Upload:', changesResponseText);
            
            // Step 3: Changeset schließen
            console.log('📤 Starting changeset close with osm-auth fetch...');
            const closeResponse = await this.osmAuth.fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
                method: 'PUT'
            });
            
            if (!closeResponse.ok) {
                const responseText = await closeResponse.text();
                const errorDetails = `HTTP ${closeResponse.status} ${closeResponse.statusText}: ${responseText}`;
                console.error('❌ Changeset close failed:', errorDetails);
                throw new Error(errorDetails);
            }
            
            console.log('📨 Response Changeset-Schließen:', closeResponse);
            return changesetId;
        } catch (error) {
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
            // Refresh tree data to get latest versions before upload
            console.log('🔄 Refreshing tree data to get latest versions...');
            await this.loadRealTrees();
            
            // Regenerate upload data with fresh versions
            const freshChangesetData = this.generateOSMUploadData();
            if (!freshChangesetData) {
                console.error('❌ Failed to regenerate upload data with fresh versions');
                return;
            }
            
            const changesetId = await this.uploadToOSM(freshChangesetData);
            // Mehr Logging: Erfolgreicher Upload
            console.log('✅ OSM-Upload erfolgreich, Changeset-ID:', changesetId);
            alert(`✅ Successfully uploaded to OSM! Changeset ID: ${changesetId}`);
            
            // Clear the patchset after successful upload
            this.clearPatchset();
            
            // Update UI indicators
            this.updatePatchsetIndicator();
            this.updateAuthIndicator();
            
            // Close any open modals
            const uploadModal = document.querySelector('.osm-upload-modal');
            if (uploadModal) {
                uploadModal.remove();
            }
            
            const patchsetModal = document.querySelector('.patchset-modal');
            if (patchsetModal) {
                patchsetModal.remove();
            }
        } catch (error) {
            console.error('❌ Fehler beim OSM-Upload:', error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error constructor:', error.constructor.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            // Parse the error message to extract HTTP status and response body
            let httpStatus = 'Unknown';
            let responseBody = 'No response body available';
            let operation = 'upload';
            
            if (error.message) {
                console.log('🔍 Parsing error message:', error.message);
                // Parse error message format: "HTTP 400 Bad Request: Version mismatch..."
                const httpMatch = error.message.match(/^HTTP (\d+) ([^:]+): (.+)$/);
                if (httpMatch) {
                    httpStatus = `${httpMatch[1]} ${httpMatch[2]}`;
                    responseBody = httpMatch[3];
                    console.log('🔍 Parsed HTTP error:', { httpStatus, responseBody });
                } else {
                    // Fallback for non-HTTP errors
                    responseBody = error.message;
                    console.log('🔍 Using error message as response body:', responseBody);
                }
            }
            
            // Create a detailed error modal with structured information
            const errorModal = document.createElement('div');
            errorModal.className = 'osm-error-modal';
            errorModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            const errorContent = document.createElement('div');
            errorContent.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 700px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;
            
            errorContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #d32f2f;">❌ OSM Upload Failed</h3>
                    <button onclick="this.closest('.osm-error-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p><strong>HTTP Status Code:</strong></p>
                    <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #d32f2f;">${httpStatus}</div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p><strong>Response Body:</strong></p>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 12px; font-family: monospace; border-left: 4px solid #d32f2f;">${responseBody}</pre>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p><strong>Full Error Message:</strong></p>
                    <pre style="background: #f8f8f8; padding: 8px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 11px; font-family: monospace; color: #666;">${error.message}</pre>
                </div>
                
                <button onclick="this.closest('.osm-error-modal').remove()" style="background: #d32f2f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
            `;
            
            errorModal.appendChild(errorContent);
            document.body.appendChild(errorModal);
            
            // Close modal when clicking outside
            errorModal.addEventListener('click', (e) => {
                if (e.target === errorModal) {
                    errorModal.remove();
                }
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.treeWarden = new TreeWardenMap();
}); 