import { Tree, Orchard } from '../types'


/**
 * Gets the display name for a tree based on its properties
 * Priority order: taxon:cultivar > taxon > species > genus > ID
 */
export const getTreeDisplayName = (tree: Tree): string => {
  const properties = tree.properties

  // Priority order: taxon:cultivar > taxon > species > genus
  if (properties['taxon:cultivar']) {
    return properties['taxon:cultivar']
  }
  if (properties.taxon) {
    return properties.taxon
  }
  if (properties.species) {
    return properties.species
  }
  if (properties.genus) {
    return properties.genus
  }

  // Fallback to tree ID if no name available
  return `Baum ${tree.id}`
}

/**
 * Gets the design properties (color and fillColor) for a tree
 * Returns an object with color and fillColor for CircleMarker styling
 */
export const getTreeDesign = (tree: Tree): { color: string; fillColor: string } => {
  const properties = tree.properties

  if (properties.genus) {
    const genus = properties.genus.toLowerCase()

    if (genus === 'pyrus') {
      return { color: '#B8860B', fillColor: '#FFD700' } // Muted yellow border, bright yellow fill
    }
    if (genus === 'prunus') {
      return { color: '#4B0082', fillColor: '#8B008B' } // Muted dark violet border, bright dark violet fill
    }
    if (genus === 'malus') {
      return { color: '#006400', fillColor: '#00FF00' } // Muted green border, bright green fill
    }
    if (genus === 'sorbus') {
      return { color: '#CC7000', fillColor: '#FFA500' } // Muted orange border, bright orange fill
    }
    if (genus === 'cormus') {
      return { color: '#CC7000', fillColor: '#FFA500' } // Muted orange border, bright orange fill
    }
    if (genus === 'cydonia') {
      return { color: '#8B6914', fillColor: '#B8860B' } // Muted dark dirty yellow border, bright dark dirty yellow fill
    }
    if (genus === 'mespilus') {
      return { color: '#8B4513', fillColor: '#CD853F' } // Muted brown border, bright brown fill
    }
  }

  // For others, generate color based on genus+species hash
  const fillColor = `#${(cyrb53(`${properties.genus || ''}`) & 0xFFFFFF).toString(16).padStart(6, '0')}`
  const borderColor = `#${((cyrb53(`${properties.genus || ''}${properties.species || ''}`) & 0xFFFFFF) >> 1).toString(16).padStart(6, '0')}` // Muted version

  return { color: borderColor, fillColor }
}


const cyrb53 = (str: string, seed: number = 0): number => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

interface ITreeIssue {
  message: string
  severity: 'error' | 'warning' | 'todos'
  patch?: {
    key: string
    value: string
  }[]
}

// Utility function to check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Reference data for validation
const SPECIES_REFERENCE_DATA: Record<string, Record<string, string>> = {
    'Malus domestica': { // DE: Kulturapfel, EN: domestic apple
    'species:wikidata': 'Q18674606',
    'genus': 'Malus',
    // "denotation", "agricultural",
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Cormus domestica': { // DE: Speierling, EN: service tree  
    'species:wikidata': 'Q159558',
    'species:wikipedia': 'de:Speierling',
    'genus': 'Cormus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
      'Pyrus communis': {  // DE: Kultur-Birne, EN: European pear
    'species:wikidata': 'Q146281',
    'genus': 'Pyrus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Prunus avium': { // DE: Süßkirsche, EN: sweet cherry
    'species:wikidata': 'Q165137',
    'genus': 'Prunus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Cydonia oblonga': {  // DE: Quitte, EN: quince
    'species:wikidata': 'Q43300',
    'genus': 'Cydonia',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Juglans Regia': { // DE: Echte Walnuss, EN: English walnut
    'species:wikidata': 'Q46871',
    'genus': 'Juglans',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Mespilus Germanica': {  // DE: Deutsche Mispel, EN: medlar
    'species:wikidata': 'Q146186',
    'genus': 'Mespilus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Prunus Domestica': {
    'species:wikidata': 'Q44120', // DE: Pflaume, EN: European plum
    'genus': 'Prunus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Prunus Cerasus': {
    'species:wikidata': 'Q165145', // DE: Sauerkirsche, EN: sour cherry
    'genus': 'Prunus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Prunus domestica subsp. prisca': {
    'species:wikidata': 'Q149741', // DE: Zibarte
    'genus': 'Prunus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Cornus Mas': {
    'species:wikidata': 'Q148734', // DE: Kornelkirsche, EN: Cornelian cherry
    'genus': 'Cornus',
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Castanea Sativa': {
    'species:wikidata': 'Q147821', // DE: Edelkastanie, EN: sweet chestnut
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
  'Corylus Avellana': {
    'species:wikidata': 'Q124969', // DE: Gemeine Hasel, EN: common hazel
    "leaf_type": "broadleaved",
    "leaf_cycle": "deciduous",
  },
}

export const CULTIVAR_REFERENCE_DATA = {
  "Adams Parmäne": {
    "cultivar:wikidata": "Q351952",

  },
  "Welschisner": {
    "cultivar:wikidata": "Q2557899",

  },
  "Grünapfel": {
    "cultivar:wikidata": "Q106398789",
  },
  "Ernst Bosch": {
    "cultivar:wikidata": "Q111027",
  },
  "Roter Münsterländer Borsdorfer": {
    "cultivar:wikidata": "Q2168415",

  },
  "Schweizer Wasserbirne": {
    "cultivar:wikidata": "Q1509587",
  },
  "Blutbirne": {
    "cultivar:wikidata": "Q886401",
  },
  "Luikenapfel": {
    "cultivar:wikidata": "Q1697639",
  },
  "Rheinischer Bohnapfel": {
    "cultivar:wikidata": "Q890833",
  },
  "Rote Goldparmäne": {
    "cultivar:wikidata": "Q41781122",
  },
  "Gellerts Butterbirne": {
    "cultivar:wikidata": "Q1394952",
  },
  "Bittenfelder": {
    "cultivar:wikidata": "Q773004",
  },
  "Jonagold": {
    "cultivar:wikidata": "Q41778389",
  },
  "Knausbirne": {
    "cultivar:wikidata": "Q128527124",
  },
  "Benita": {
    "cultivar:wikidata": "Q5725770",
  },
  "Portugiesische Birnenquitte": {
    "cultivar:wikidata": "Q19298708",
  },
  "Baumanns Renette": {
    "cultivar:wikidata": "Q382634",
  },
  "Finkenwerder Herbstprinz": {
    "cultivar:wikidata": "Q1417511",
  },
  "Gelber Münsterländer Borsdorfer": {
    "cultivar:wikidata": "Q41777300",
  },
  "Zwiebelbirne": {
    "cultivar:wikidata": "Q53717239",
  },
  "Zabergäu Renette": {
    "cultivar:wikidata": "Q138931",
  },
  "Rote Sternrenette": {
    "cultivar:wikidata": "Q2168272",
  },
  "Ribston Pepping": {
    "cultivar:wikidata": "Q484711",
  },
  "Goldrich": {
    "cultivar:wikidata": "Q37469188",
  },
  "Antonowka": {
    "cultivar:wikidata": "Q2446601",
  },
  "Spätblühender Taffetapfel": {
    "cultivar:wikidata": "Q41781700",
  },
  "Stuttgarter Gaishirtle": {
    "cultivar:wikidata": "Q2359521",
  },
  "Trockener Martin": {
    "cultivar:wikidata": "Q3899624",
  },
  "Weißer Winterglockenapfel": {
    "cultivar:wikidata": "Q1500088",
  },
  "Conference": {
    "cultivar:wikidata": "Q747247",
  },
  "Pastorenbirne": {
    "cultivar:wikidata": "Q3007870",
  },
  "Gelber Bellefleur": {
    "cultivar:wikidata": "Q1499308",
  },
  "Palmischbirne": {
    "cultivar:wikidata": "Q1574214",
  },
  "Rheinischer Krummstiel": {
    "cultivar:wikidata": "Q41780938",
  },
  "Gräfin von Paris": {
    "cultivar:wikidata": "Q2991069",
  },
  "Engelsberger Renette": {
    "cultivar:wikidata": "Q107447084",
  },
  "Weißer Astrachan": {
    "cultivar:wikidata": "Q67375208",
  },
  "Brettacher": {
    "cultivar:wikidata": "Q910902",
  },
  "Danziger Kantapfel": {
    "cultivar:wikidata": "Q1165331",
  },
  "Barlett": {
    "cultivar:wikidata": "Q36900164",
  },
  "Bergische Schafsnase": {
    "cultivar:wikidata": "Q94629984",
  },
  "Ananas-Renette": {
    "cultivar:wikidata": "Q485637",
  },
  "Roter Trierer Weinapfel": {
    "cultivar:wikidata": "Q2168444",
  },
  "Maunzenapfel": {
    "cultivar:wikidata": "Q1911153",
  },
  "Martens Sämling": {
    "cultivar:wikidata": "Q1714715",
  },
  "Harberts Renette": {
    "cultivar:wikidata": "Q1584903",
  },
  "Hauszwetsche": {
    "cultivar:wikidata": "Q1591373",
  },
  "Doppelter Prinzenapfel": {
    "cultivar:wikidata": "Q1243377",
  },
  "Große Holländische": {
    "cultivar:wikidata": "Q30584736",
  },
  "Champion": {
    "cultivar:wikidata": "Q16865485",
  },
  "Rheinbirne": {
    "cultivar:wikidata": "Q18412604",
  },
  "Peter Broich (Kaiser Willhelm)": {
    "cultivar:wikidata": "Q1721545",
  },
  "Zuccalmaglios Renette": {
    "cultivar:wikidata": "Q227622",
  },
  "James Grieve": {
    "cultivar:wikidata": "Q492928",
  },
  "Roter Eiserapfel": {
    "cultivar:wikidata": "Q2168370",
  },
  "Dülmener Herbstrosenapfel": {
    "cultivar:wikidata": "Q1249717",
  },
  "Gestreifter Matapfel": {
    "cultivar:wikidata": "Q1519652",
  },
  "Baldwin": {
    "cultivar:wikidata": "Q20810783",
  },
  "Geisepitter": {
    "cultivar:wikidata": "Q15811528",
  },
  "Orleansrenette": {
    "cultivar:wikidata": "Q1554680",
  },
  "Große Schwarze Knorpelkirsche": {
    "cultivar:wikidata": "Q15812919",
  },
  "Ontario": {
    "cultivar:wikidata": "Q2024669",
  },
  "Hofratsbirne": {
    "cultivar:wikidata": "Q23058448",
  },
  "Goldparmäne": {
    "cultivar:wikidata": "Q353078",
  },
  "Adersleber Kalvill": {
    "cultivar:wikidata": "Q356438",
  },
  "Berlepsch": {
    "cultivar:wikidata": "Q353695",
  },
  "Großer Katzenkopf": {
    "cultivar:wikidata": "Q23021228",
  },
  "Echter Spilling": {
    "cultivar:wikidata": "Q126766468",
  },
  "Vaterapfel": {
    "cultivar:wikidata": "Q15974362",
  },
  "Konstantinopler": {
    "cultivar:wikidata": "Q1700649",
  },
  "Abate Fetel": {
    "cultivar:wikidata": "Q306912",
  },
  "Biesterfelder Renette": {
    "cultivar:wikidata": "Q858175",
  },
  "Mirabelle von Nancy": {
    "cultivar:wikidata": "Q1592726",
  },
  "Goldrenette von Blenheim": {
    "cultivar:wikidata": "Q1331071",
  },
  "Herbstforelle": {
    "cultivar:wikidata": "Q1437125",
  },
  "Hibernal": {
    "cultivar:wikidata": "Q407972",
  },
  "Roter Mond": {
    "cultivar:wikidata": "Q1386346",
  },
  "Berner Rosenapfel": {
    "cultivar:wikidata": "Q689898",
  },
  "Wangenheimer Frühzwetsche": {
    "cultivar:wikidata": "Q124488167",
  },
  "Paulsbirne": {
    "cultivar:wikidata": "Q128795029",
  },
  "Mirabelle von Metz": {
    "cultivar:wikidata": "Q1565579",
  },
  "Schöner aus Boskoop": {
    "cultivar:wikidata": "Q504565",
  },
  "Harrow Sweet": {
    "cultivar:wikidata": "Q109311874",
  },
  "Gelbe Wadelbirne": {
    "cultivar:wikidata": "Q123864124",
  },
  "Bollweiler Birne": {
    "cultivar:wikidata": "Q44778579",
  },
  "Sülibirne": {
    "cultivar:wikidata": "Q2381978",
  },
  "Edelborsdorfer": {
    "cultivar:wikidata": "Q12269996",
  },
  "Schweizerhose": {
    "cultivar:wikidata": "Q1532890",
  },
  "Jakob Lebel": {
    "cultivar:wikidata": "Q280823",
  },
  "Graue Renette": {
    "cultivar:wikidata": "Q1543721",
  },
  "Weißer Matapfel": {
    "cultivar:wikidata": "Q1515956",
  },
  "Doppelter Roter Bellefleur": {
    "cultivar:wikidata": "Q41776517",
  },
  "Ölligsbirne": {
    "cultivar:wikidata": "Q15868000",
  },
  "Roter Gravensteiner": {
    "cultivar:wikidata": "Q489226",
  },
  "Josephine von Mecheln": {
    "cultivar:wikidata": "Q1228728",
  },
  "Graue Herbstrenette": {
    "cultivar:wikidata": "Q1543725",
  },
  "Tulpenapfel": {
    "cultivar:wikidata": "Q2459545",
  }
}


export const getTreeIssues = (tree: Tree, orchards?: Orchard[]): { errors: ITreeIssue[], warnings: ITreeIssue[], todos: ITreeIssue[] } => {
  const errors: ITreeIssue[] = []
  const warnings: ITreeIssue[] = []
  const todos: ITreeIssue[] = []

  if (!tree.properties.genus) {
    todos.push({
      message: 'Der Baum hat keine Genus. Einfach mal vor Ort nachschauen.',
      severity: 'todos'
    })
  } if (tree.properties.genus == 'Malus' && !tree.properties.species) {
    errors.push({
      message: 'Der Baum hat keine Spezies. Vielleicht "Malus domestica"?',
      patch: [{
        key: 'species',
        value: 'Malus domestica'
      }],
      severity: 'error'
    })
  }
  if (tree.properties.genus == 'Pyrus' && !tree.properties.species) {
    errors.push({
      message: 'Der Baum hat keine Spezies. Vielleicht "Pyrus communis"?',
      patch: [{
        key: 'species',
        value: 'Pyrus communis'
      }],
      severity: 'error'
    })
  }

  // Check for old species name "Sorbus domestica" and suggest renaming to "Cormus domestica"
  if (tree.properties.species === 'Sorbus domestica') {
    warnings.push({
      message: 'Der Artname "Sorbus domestica" sollte zu "Cormus domestica" geändert werden.',
      patch: [
        {
          key: 'species',
          value: 'Cormus domestica'
        },
        {
          key: 'genus',
          value: 'Cormus'
        }
      ],
      severity: 'warning'
    })
  }

  // Check for "Cormus domestica" and suggest setting genus to "Cormus" if not set
  if (tree.properties.species === 'Cormus domestica' && tree.properties.genus !== 'Cormus') {
    warnings.push({
      message: 'Bei "Cormus domestica" sollte das genus auf "Cormus" gesetzt werden.',
      patch: [
        {
          key: 'genus',
          value: 'Cormus'
        }
      ],
      severity: 'warning'
    })
  }

  // Validate species-specific fields when species is set
  if (tree.properties.species) {
    const species = tree.properties.species
    const speciesReferenceData = SPECIES_REFERENCE_DATA[species]

    if (speciesReferenceData) {
      // Validate all fields in reference data
      Object.entries(speciesReferenceData).forEach(([fieldKey, expectedValue]) => {
        const currentValue = tree.properties[fieldKey]

        // Check for missing field
        if (!currentValue) {
          warnings.push({
            message: `Fehlende ${fieldKey} für ${species}. Sollte "${expectedValue}" sein.`,
            patch: [{
              key: fieldKey,
              value: expectedValue
            }],
            severity: 'warning'
          })
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
          })
        }
      })
    }
  }

  const cultivar = tree.properties['taxon:cultivar'] ?? tree.properties.cultivar ?? tree.properties.taxon

  if (cultivar && !tree.properties['taxon.cultivar']) {
    todos.push({
      message: `Der Baum hat kein taxon:cultivar. Ist das vielleicht "${cultivar}" ?`,
      patch: [{
        key: 'taxon:cultivar',
        value: cultivar
      }],
      severity: 'todos',
    })
  }

  const cultivareferenceData = CULTIVAR_REFERENCE_DATA[cultivar as keyof typeof CULTIVAR_REFERENCE_DATA]

  if (cultivareferenceData) {
      // Validate all fields in reference data
      Object.entries(cultivareferenceData).forEach(([fieldKey, expectedValue]) => {
        const currentValue = tree.properties[fieldKey]

        // Check for missing field
        if (!currentValue) {
          warnings.push({
            message: `Fehlende ${fieldKey} für ${cultivar}. Sollte "${expectedValue as string}" sein.`,
            patch: [{
              key: fieldKey,
              value: expectedValue as string
            }],
            severity: 'warning'
          })
        }
        // Check for incorrect value
        else if (currentValue !== expectedValue) {
          warnings.push({
            message: `Falsche ${fieldKey} für ${cultivar}. Sollte "${expectedValue as string}" sein, nicht "${currentValue}".`,
            patch: [{
              key: fieldKey,
              value: expectedValue as string
            }],
            severity: 'warning'
          })
        }
      })
  }

  // Check if the tree is within an orchard and suggest denotation: agricultural
  if (orchards && orchards.length > 0 && !tree.properties.denotation) {
    const treePoint: [number, number] = [tree.lon, tree.lat];
    
    for (const orchard of orchards) {
      if (isPointInPolygon(treePoint, orchard.coordinates)) {
        todos.push({
          message: 'Der Baum befindet sich in einem Obstgarten. Vorschlag: "denotation": "agricultural" setzen.',
          patch: [{
            key: 'denotation',
            value: 'agricultural'
          }],
          severity: 'todos'
        });
        break; // Only need to suggest once, even if in multiple orchards
      }
    }
  }


  return { errors, warnings, todos }
}

// circumference loc_name alt_name height
