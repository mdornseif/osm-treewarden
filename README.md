# OSM Tree Warden

Eine interaktive Kartenanwendung um Bäume in OSM kuratieren.

## Funktionen

- Interaktive Karte mit mehreren Kartenebenen
- Echtzeit-Baumdaten von OpenStreetMap über die Overpass API
- Farbcodierte Baumpunkte basierend auf der Gattung:
  - Pyrus (Birnen): Gelb
  - Prunus (Kirschen, Pflaumen): Dunkelviolett
  - Malus (Äpfel): Helles Grün
  - Sorbus: Orange
  - Cydonia: Dunkles schmutziges Gelb
  - Mespilus: Helles Braun
  - Andere: Blau
- Detaillierte Baum-Informationsfenster
- Geolokationsunterstützung
- Responsive Design

## Bereitstellung

### GitHub Pages

1. Pushen Sie Ihren Code zu einem GitHub-Repository
2. Gehen Sie zu Repository-Einstellungen → Pages
3. Wählen Sie "Deploy from a branch" → "gh-pages" Branch
4. Ihre Website wird verfügbar sein unter `https://yourusername.github.io/repository-name/`

### Lokale Entwicklung

Öffnen Sie einfach `index.html` in einem Webbrowser oder servieren Sie die Dateien mit einem lokalen Server:

```bash
# Mit Python
python -m http.server 8000

# Mit Node.js
npx serve .

# Mit PHP
php -S localhost:8000
```

## Verwendung

- Verwenden Sie den Ebenenauswahl, um zwischen verschiedenen Kartenstilen zu wechseln
- Klicken Sie auf Baumpunkte, um detaillierte Informationen anzuzeigen
- Verwenden Sie den Standort-Button, um die Karte auf Ihre aktuelle Position zu zentrieren
- Bäume werden automatisch für den sichtbaren Bereich mit einem 50% Puffer geladen

## Technologien

- Leaflet.js für das Kartenrendering
- OpenStreetMap-Daten über die Overpass API
- Vanilla JavaScript
- CSS3 für das Styling 