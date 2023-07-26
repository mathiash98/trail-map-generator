// [natural=peak]
import EidfjordPeaks from "./geojson-data/Eidfjord-peaks.geojson";
// [natural=hill]
import EidfjordHills from "./geojson-data/Eidfjord-hills.geojson";
// [highway=path]
import EidfjordPaths from "./geojson-data/Eidfjord-paths.geojson";
// [highway=track]
import EidfjordTracks from "./geojson-data/Eidfjord-tracks.geojson";
// [piste:type=*]
import EidfjordPiste from "./geojson-data/Eidfjord-piste.geojson";
// [place=farm]
import EidfjordFarms from "./geojson-data/Eidfjord-farms.geojson";
// [place=hamlet]
import EidfjordHamlets from "./geojson-data/Eidfjord-hamlets.geojson";
// [natural=water][name]
import EidfjordWater from "./geojson-data/Eidfjord-water-with-names.geojson";
// [highway]["highway"!~"footway"]["highway"!~"path"]["highway"!~"piste"]
// import EidfjordHighway from "./geojson-data/Eidfjord-highway.geojson";
// [waterway]
// import EidfjordWaterway from "./geojson-data/Eidfjord-waterway.geojson";

export const PathsLayer: Layer = {
  id: "path",
  place: "Eidfjord",
  source: EidfjordPaths,
  type: "line",
  paint: {
    "line-dasharray": [6, 2],
    "line-color": "#ff5c5c",
    "line-width": 1.5,
  },
  query: "[highway=path]",
};
export const TracksLayer: Layer = {
  id: "track",
  place: "Eidfjord",
  source: EidfjordTracks,
  type: "line",
  paint: {
    "line-color": "#ff5c5c",
    "line-width": 1.5,
  },
  query: "[highway=track]",
};
export const PisteLayer: Layer = {
  id: "piste",
  place: "Eidfjord",
  source: EidfjordPiste,
  type: "line",
  paint: {
    "line-color": "#046c8b",
    "line-width": 1.5,
  },
  query: '["piste:type"]',
};
export const WaterLayer: Layer = {
  id: "water-with-name",
  place: "Eidfjord",
  source: EidfjordWater,
  type: "symbol",
  layout: {
    "text-size": 16,
  },
  query: "[natural=water][name]",
};
export const HillsLayer: Layer = {
  id: "hill",
  place: "Eidfjord",
  source: EidfjordHills,
  type: "symbol",
  layout: {
    "icon-image": "mountain",
    "text-size": 14,
  },
  query: "[natural=hill]",
};
export const FarmsLayer: Layer = {
  id: "farm",
  place: "Eidfjord",
  source: EidfjordFarms,
  type: "symbol",
  layout: {
    "icon-image": "marker",
    "text-size": 18,
  },
  query: "[place=farm]",
};
export const HamletsLayer: Layer = {
  id: "hamlet",
  place: "Eidfjord",
  source: EidfjordHamlets,
  type: "symbol",
  layout: {
    "icon-image": "marker",
    "text-size": 18,
  },
  query: "[place=hamlet]",
};
export const PeaksLayer: Layer = {
  id: "peak",
  place: "Eidfjord",
  source: EidfjordPeaks,
  type: "symbol",
  layout: {
    "icon-image": "mountain",
    "text-size": 20,
  },
  query: "[natural=peak]",
};

const layers: Layer[] = [
  TracksLayer,
  PathsLayer,
  PisteLayer,
  HillsLayer,
  FarmsLayer,
  WaterLayer,
  HamletsLayer,
  PeaksLayer,
];

export default layers;

export type Layer = mapboxgl.AnyLayer & { query: string; place: string };
