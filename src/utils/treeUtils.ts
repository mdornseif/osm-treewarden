import { Tree } from '../types';


/**
 * Gets the display name for a tree based on its properties
 * Priority order: taxon:cultivar > taxon > species > genus > ID
 */
export const getTreeDisplayName = (tree: Tree): string => {
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
  return `Baum ${tree.id}`;
};

/**
 * Gets the design properties (color and fillColor) for a tree
 * Returns an object with color and fillColor for CircleMarker styling
 */
export const getTreeDesign = (tree: Tree): { color: string; fillColor: string } => {
  const properties = tree.properties;
  
  if (properties.genus) {
    const genus = properties.genus.toLowerCase();
    
    if (genus === 'pyrus') {
      return { color: '#B8860B', fillColor: '#FFD700' }; // Muted yellow border, bright yellow fill
    }
    if (genus === 'prunus') {
      return { color: '#4B0082', fillColor: '#8B008B' }; // Muted dark violet border, bright dark violet fill
    }
    if (genus === 'malus') {
      return { color: '#006400', fillColor: '#00FF00' }; // Muted green border, bright green fill
    }
    if (genus === 'sorbus') {
      return { color: '#CC7000', fillColor: '#FFA500' }; // Muted orange border, bright orange fill
    }
    if (genus === 'cydonia') {
      return { color: '#8B6914', fillColor: '#B8860B' }; // Muted dark dirty yellow border, bright dark dirty yellow fill
    }
    if (genus === 'mespilus') {
      return { color: '#8B4513', fillColor: '#CD853F' }; // Muted brown border, bright brown fill
    }
  }
  
  // For others, generate color based on genus+species hash
  const fillColor = `#${( cyrb53(`${properties.genus || ''}`) & 0xFFFFFF).toString(16).padStart(6, '0')}`
  const borderColor = `#${(( cyrb53(`${properties.genus || ''}${properties.species || ''}`) & 0xFFFFFF) >> 1).toString(16).padStart(6, '0')}`; // Muted version
  
  return { color: borderColor, fillColor };
};


const cyrb53 = (str: string, seed: number = 0): number => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

interface ITreeIssue {
  message: string;
  severity: 'error' | 'warning';
  patch?: {
    key: string;
    value: string;
  }[];
}


// Reference data for validation
const SPECIES_REFERENCE_DATA: Record<string, Record<string, string>> = {
  'Malus Domestica': { // DE: Kulturapfel, EN: domestic apple
    'species:wikidata': 'Q18674606'
  },
  'Sorbus Domestica': { // DE: Speierling, EN: service tree  
    'species:wikidata': 'Q159558',
    'species:wikipedia': 'de:Speierling'
  },
  'Pyrus Communis': {  // DE: Kultur-Birne, EN: European pear
    'species:wikidata': 'Q146281'
  },
  'Prunus Avium': { // DE: Süßkirsche, EN: sweet cherry
    'species:wikidata': 'Q165137'
  },
  'Cydonia Oblonga': {  // DE: Quitte, EN: quince
    'species:wikidata': 'Q43300'
  },
  'Juglans Regia': { // DE: Echte Walnuss, EN: English walnut
    'species:wikidata': 'Q46871'
  },
  'Mespilus Germanica': {  // DE: Deutsche Mispel, EN: medlar
    'species:wikidata': 'Q146186'
  },
  'Prunus Domestica': {
    'species:wikidata':'Q44120', // DE: Pflaume, EN: European plum
    }, 'Prunus Cerasus':{
    'species:wikidata': 'Q165145', // DE: Sauerkirsche, EN: sour cherry
    }, 'Cornus Mas': {
    'species:wikidata':'Q148734', // DE: Kornelkirsche, EN: Cornelian cherry
    }, 'Castanea Sativa': {
    'species:wikidata':'Q147821', // DE: Edelkastanie, EN: sweet chestnut
    }, 'Corylus Avellana': {
    'species:wikidata':'Q124969' // DE: Gemeine Hasel, EN: common hazel
  },
};

export const getTreeIssues = (tree: Tree): { errors: ITreeIssue[], warnings: ITreeIssue[] } => {
  const errors: ITreeIssue[] = [];
  const warnings: ITreeIssue[] = [];

  // Check for missing species when genus is set
  if (tree.properties.genus == 'Malus' && !tree.properties.species) {
    errors.push({
      message: 'Der Baum hat keine Spezies. Vielleicht "Malus Domestica"?',
      patch: [{
        key: 'species',
        value: 'Malus Domestica'
      }],
      severity: 'error'
    });
  }
  if (tree.properties.genus == 'Pyrus' && !tree.properties.species) {
    errors.push({
      message: 'Der Baum hat keine Spezies. Vielleicht "Pyrus Communis"?',
      patch: [{
        key: 'species',
        value: 'Pyrus Communis'
      }],
      severity: 'error'
    });
  }

  // Validate species-specific fields when species is set
  if (tree.properties.species) {
    const species = tree.properties.species;
    const referenceData = SPECIES_REFERENCE_DATA[species];
    
    if (referenceData) {
      // Validate all fields in reference data
      Object.entries(referenceData).forEach(([fieldKey, expectedValue]) => {
        const currentValue = tree.properties[fieldKey];
        
        // Check for missing field
        if (!currentValue) {
          warnings.push({
            message: `Fehlende ${fieldKey} für ${species}. Sollte "${expectedValue}" sein.`,
            patch: [{
              key: fieldKey,
              value: expectedValue
            }],
            severity: 'warning'
          });
        }
        // Check for incorrect value
        else if (currentValue !== expectedValue) {
          warnings.push({
            message: `Falsche ${fieldKey} für ${species}. Sollte "${expectedValue}" sein, nicht "${currentValue}".`,
            patch: [{
              key: fieldKey,
              value: expectedValue
            }],
            severity: 'warning'
          });
        }
      });
    }
  }

  return { errors, warnings };
};
