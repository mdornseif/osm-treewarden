# Change Store

Der Change Store ist ein nanostore-basierter Store für die Verwaltung von Änderungen an Bäumen in OpenStreetMap. Er verwendet die OSM-ID als eindeutigen Schlüssel und verwaltet Änderungen mit Versionsnummern und Key-Value-Tupeln.

## Struktur

### TreeChange Interface
```typescript
interface TreeChange {
  osmId: number;           // OSM-ID des Baums
  version: number;         // Versionsnummer
  changes: Record<string, string>;  // Key-Value-Tupel der Änderungen
  timestamp?: string;      // Zeitstempel der Änderung
  userId?: number;         // Benutzer-ID (optional)
  username?: string;       // Benutzername (optional)
}
```

## Store-Zustände

Der Change Store verwaltet drei separate Zustände:

1. **changes**: Aktuelle Änderungen (Hauptspeicher)
2. **pendingChanges**: Ausstehende Änderungen (warten auf Anwendung)
3. **appliedChanges**: Angewandte Änderungen (bereits verarbeitet)

## Verwendung

### Direkte Store-Verwendung
```typescript
import { 
  addChange, 
  updateChange, 
  removeChange,
  moveToPending,
  applyChange,
  clearAllChanges 
} from '../store/changeStore';

// Änderung hinzufügen
addChange(12345, 1, { species: 'Oak', height: '10m' });

// Änderung aktualisieren
updateChange(12345, { height: '15m' });

// Änderung in pending verschieben
moveToPending(12345);

// Änderung anwenden
applyChange(12345);

// Änderung entfernen
removeChange(12345);

// Alle Änderungen löschen
clearAllChanges();
```

### React Hook Verwendung
```typescript
import { useChangeStore, useChangeByOsmId, useChangeStats } from '../store/useChangeStore';

function MyComponent() {
  const {
    changes,
    pendingChanges,
    appliedChanges,
    changeCount,
    addChange,
    updateChange,
    removeChange,
    moveToPending,
    applyChange
  } = useChangeStore();

  const stats = useChangeStats();
  
  // Spezifische Änderung für eine OSM-ID
  const { change, hasChange } = useChangeByOsmId(12345);

  return (
    <div>
      <p>Anzahl Änderungen: {stats.totalChanges}</p>
      <p>Ausstehende Änderungen: {stats.pendingChanges}</p>
      <p>Angewandte Änderungen: {stats.appliedChanges}</p>
    </div>
  );
}
```

## Verfügbare Funktionen

### Actions
- `addChange(osmId, version, changeData, timestamp?, userId?, username?)`: Neue Änderung hinzufügen
- `updateChange(osmId, newChanges)`: Bestehende Änderung aktualisieren
- `removeChange(osmId)`: Änderung entfernen
- `moveToPending(osmId)`: Änderung in pending verschieben
- `applyChange(osmId)`: Änderung von pending zu applied verschieben
- `clearAllChanges()`: Alle Änderungen löschen
- `clearPendingChanges()`: Nur pending Änderungen löschen
- `clearAppliedChanges()`: Nur applied Änderungen löschen

### Utility Functions
- `getChangeByOsmId(osmId)`: Änderung für OSM-ID abrufen
- `getPendingChangeByOsmId(osmId)`: Pending Änderung für OSM-ID abrufen
- `getAppliedChangeByOsmId(osmId)`: Applied Änderung für OSM-ID abrufen
- `getAllChanges()`: Alle Änderungen als Array
- `getAllPendingChanges()`: Alle pending Änderungen als Array
- `getAllAppliedChanges()`: Alle applied Änderungen als Array
- `hasChangeForOsmId(osmId)`: Prüfen ob Änderung für OSM-ID existiert
- `hasPendingChangeForOsmId(osmId)`: Prüfen ob pending Änderung für OSM-ID existiert
- `hasAppliedChangeForOsmId(osmId)`: Prüfen ob applied Änderung für OSM-ID existiert

### Computed Values
- `changeCount`: Anzahl der aktuellen Änderungen
- `pendingChangeCount`: Anzahl der pending Änderungen
- `appliedChangeCount`: Anzahl der applied Änderungen
- `hasChanges`: Boolean ob Änderungen vorhanden sind
- `hasPendingChanges`: Boolean ob pending Änderungen vorhanden sind

## React Hooks

### useChangeStore()
Vollständiger Hook mit allen Store-Funktionen und Zuständen.

### useChangeByOsmId(osmId)
Hook für spezifische Änderungen einer OSM-ID.

### useChangeStats()
Hook für Statistiken über alle Änderungen.

## Workflow

1. **Änderung erstellen**: `addChange()` - Änderung wird im Hauptspeicher gespeichert
2. **Änderung vorbereiten**: `moveToPending()` - Änderung wird in pending verschoben
3. **Änderung anwenden**: `applyChange()` - Änderung wird von pending zu applied verschoben
4. **Änderung entfernen**: `removeChange()` oder `clear*()` - Änderung wird gelöscht

## Tests

Der Change Store verfügt über umfassende Unit-Tests in `src/test/changeStore.test.ts`. Führen Sie die Tests mit folgendem Befehl aus:

```bash
npx vitest run src/test/changeStore.test.ts
```

## Beispiel

```typescript
// Änderung für einen Baum hinzufügen
addChange(12345, 1, { 
  species: 'Quercus robur', 
  height: '12m',
  circumference: '1.5m' 
});

// Änderung in pending verschieben
moveToPending(12345);

// Änderung anwenden (z.B. nach erfolgreicher OSM-Upload)
applyChange(12345);
```