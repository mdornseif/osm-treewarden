import { TileLayer } from '../types';

export const tileLayers: TileLayer[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  {
    id: 'satellite',
    name: 'Satellit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  },
  {
    id: 'nrw-orthophoto',
    name: 'NRW Orthofoto',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_dop?FORMAT=image/jpeg&VERSION=1.1.1&SERVICE=WMS&REQUEST=GetMap&LAYERS=nw_dop_rgb&STYLES=&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}',
    attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/geobasis-nrw">Geobasis NRW</a>',
    maxZoom: 20
  },
  {
    id: 'nrw-cadastre',
    name: 'NRW Liegenschaftskataster',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_alkis?FORMAT=image/png&VERSION=1.1.1&SERVICE=WMS&REQUEST=GetMap&LAYERS=adv_alkis_flurstuecke,adv_alkis_gebaeude&STYLES=&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}&TRANSPARENT=TRUE',
    attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/geobasis-nrw">Geobasis NRW</a>',
    maxZoom: 20
  }
];