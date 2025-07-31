# Pull Request: Patch Store Implementation and TreeList Enhancement

## 🎯 Übersicht
Implementierung eines Patch Stores für OSM-Änderungen und Erweiterung der TreeList-Komponente mit visuellen Indikatoren für aktualisierte Bäume.

## ✨ Neue Features

### 1. Patch Store (ehemals Change Store)
- **Nanostore-basierter Store** für die Verwaltung von OSM-Änderungen
- **OSM-ID als Key**: Jede Änderung wird mit der OSM-ID als eindeutigem Schlüssel gespeichert
- **Drei-Zustand-System**: 
  - `patches`: Aktuelle Änderungen (Hauptspeicher)
  - `pendingPatches`: Ausstehende Änderungen
  - `appliedPatches`: Angewandte Änderungen
- **Vollständige CRUD-Operationen**: addPatch, updatePatch, removePatch, etc.
- **Workflow-Funktionen**: moveToPending, applyPatch

### 2. TreeList Enhancement
- **Visuelle Indikatoren**: "updated" Label für Bäume mit Patches
- **Echtzeit-Updates**: Automatische Anzeige basierend auf Patch Store Status
- **Elegantes Design**: Grünes, kompaktes Label ohne Animation

### 3. React Hooks
- `usePatchStore()`: Vollständiger Hook mit allen Funktionen
- `usePatchByOsmId(osmId)`: Hook für spezifische OSM-ID
- `usePatchStats()`: Hook für Statistiken

## 📁 Geänderte Dateien

### Neue Dateien
- `src/store/patchStore.ts` - Hauptstore für Patches
- `src/store/usePatchStore.ts` - React Hooks für Patch Store
- `src/test/patchStore.test.ts` - Unit Tests
- `src/components/PatchTest.tsx` - Test-Komponente

### Geänderte Dateien
- `src/types/index.ts` - Neue Typen: TreePatch, PatchStore
- `src/store/index.tsx` - Export der neuen Patch Store Module
- `src/components/TreeList.tsx` - Integration des Patch Stores
- `src/styles/tree-list.css` - Styling für "updated" Label
- `.gitignore` - Erweiterte Ignore-Regeln

### Umbenannte Dateien
- `changeStore.ts` → `patchStore.ts`
- `useChangeStore.ts` → `usePatchStore.ts`
- `changeStore.test.ts` → `patchStore.test.ts`

## 🧪 Tests
- **18 Unit Tests** für alle Patch Store Funktionen
- **Alle Tests bestanden** ✅
- **Vollständige Abdeckung** der Store-Funktionalität

## 🎨 UI/UX Verbesserungen
- **"updated" Label**: Grüner Gradient mit Schatten
- **Kompaktes Design**: Klein und unauffällig
- **Gute Lesbarkeit**: Weißer Text auf grünem Hintergrund
- **Keine Animation**: Ruhiges, professionelles Design

## 🔧 Technische Details

### Patch Store Struktur
```typescript
interface TreePatch {
  osmId: number;           // OSM-ID des Baums
  version: number;         // Versionsnummer
  changes: Record<string, string>;  // Key-Value-Tupel
  timestamp?: string;      // Zeitstempel
  userId?: number;         // Benutzer-ID (optional)
  username?: string;       // Benutzername (optional)
}
```

### Verwendung
```typescript
// Patch hinzufügen
addPatch(12345, 1, { species: 'Oak', height: '10m' });

// In TreeList prüfen
const hasPatch = hasPatchForOsmId(tree.id);
```

## 🚀 Deployment
- **Keine Breaking Changes**: Alle Änderungen sind rückwärtskompatibel
- **Inkrementelle Verbesserung**: Bestehende Funktionalität bleibt erhalten
- **Sofort einsatzbereit**: Patch Store kann sofort verwendet werden

## 📋 Checkliste
- [x] Patch Store implementiert
- [x] TreeList erweitert
- [x] Unit Tests geschrieben
- [x] Alle Tests bestanden
- [x] Code dokumentiert
- [x] Styling hinzugefügt
- [x] Gitignore aktualisiert
- [x] Commits gepusht

## 🔄 Workflow
1. **Patch erstellen**: `addPatch(osmId, version, changes)`
2. **TreeList zeigt**: "updated" Label für betroffene Bäume
3. **Patch verwalten**: moveToPending → applyPatch
4. **Status verfolgen**: Über Patch Store Statistiken

---

**Branch**: `v2` → `main`  
**Status**: Bereit für Review und Merge