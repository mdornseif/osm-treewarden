// NanoStore - Ultra-lightweight state management
class NanoStore {
    constructor(initialValue) {
        this.value = initialValue;
        this.subscribers = new Set();
    }

    get() {
        return this.value;
    }

    set(newValue) {
        const oldValue = this.value;
        this.value = newValue;
        
        // Notify all subscribers
        this.subscribers.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error('Store subscriber error:', error);
            }
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }
}

// Create individual stores for each piece of state
const treesStore = new NanoStore([]);
const selectedTreeStore = new NanoStore(null);

// Load patchset from localStorage if available
let initialPatchset = new Map();
try {
    const savedPatchset = localStorage.getItem('treewarden_patchset');
    if (savedPatchset) {
        const parsedPatchset = JSON.parse(savedPatchset);
        // Convert back to Map from object
        initialPatchset = new Map(Object.entries(parsedPatchset));
        console.log('📦 Loaded patchset from localStorage:', initialPatchset.size, 'entries');
    }
} catch (error) {
    console.error('❌ Error loading patchset from localStorage:', error);
}

const patchsetStore = new NanoStore(initialPatchset);

// Save patchset to localStorage whenever it changes
patchsetStore.subscribe((patchset) => {
    try {
        // Convert Map to object for JSON serialization
        const patchsetObject = Object.fromEntries(patchset);
        localStorage.setItem('treewarden_patchset', JSON.stringify(patchsetObject));
        console.log('💾 Saved patchset to localStorage:', patchset.size, 'entries');
    } catch (error) {
        console.error('❌ Error saving patchset to localStorage:', error);
    }
});

// Load changes from localStorage if available
let initialChanges = new Map();
try {
    const savedChanges = localStorage.getItem('treewarden_changes');
    if (savedChanges) {
        const parsedChanges = JSON.parse(savedChanges);
        // Convert back to Map from object
        initialChanges = new Map(Object.entries(parsedChanges));
        console.log('📦 Loaded changes from localStorage:', initialChanges.size, 'entries');
    }
} catch (error) {
    console.error('❌ Error loading changes from localStorage:', error);
}

// Changes store - tracks modifications with structure:
// Key: OSM ID (string)
// Value: {
//   osmId: string,
//   oldVersion: number,
//   changes: Array<{key: string, value: any}>
// }
const changesStore = new NanoStore(initialChanges);

// Save changes to localStorage whenever it changes
changesStore.subscribe((changes) => {
    try {
        // Convert Map to object for JSON serialization
        const changesObject = Object.fromEntries(changes);
        localStorage.setItem('treewarden_changes', JSON.stringify(changesObject));
        console.log('💾 Saved changes to localStorage:', changes.size, 'entries');
    } catch (error) {
        console.error('❌ Error saving changes to localStorage:', error);
    }
});

const basemapStore = new NanoStore('cyclosm');
const loadingStore = new NanoStore(false);

// Export stores
window.stores = {
    trees: treesStore,
    selectedTree: selectedTreeStore,
    patchset: patchsetStore,
    changes: changesStore,
    basemap: basemapStore,
    loading: loadingStore
}; 