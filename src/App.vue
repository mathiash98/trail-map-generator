<template>
  <div id="app">
    <form
      style="height: 50px; display: inline-flex"
      @submit="handleKommuneFormSubmit"
    >
      <label for="kommune">Kommune:</label>
      <input
        type="text"
        name="kommune"
        id="kommune"
        placeholder="Skriv inn kommune/lokasjon etc"
        v-model="placeName"
        :disabled="loadingData"
      />
      <input type="submit" value="Download" :disabled="loadingData" />
      <p v-if="loadingData">Loading...</p>
      <p>{{ consoleMessages.at(-1) }}</p>
    </form>
    <div class="main">
      <div id="map-preview"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import mapboxgl from "mapbox-gl";
import type { Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapboxExportControl,
  Size,
  PageOrientation,
  Format,
  DPI,
} from "@watergis/mapbox-gl-export";
import "@watergis/mapbox-gl-export/css/styles.css";
import osmtogeojson from "osmtogeojson";
// [natural=peak]
import EidfjordPeaks from "./geojson-data/Eidfjord-peaks.geojson";
// [natural=hill]
import EidfjordHills from "./geojson-data/Eidfjord-hills.geojson";
// [highway=path]
import EidfjordPaths from "./geojson-data/Eidfjord-paths.geojson";
// [piste:type=*]
import EidfjordPiste from "./geojson-data/Eidfjord-piste.geojson";
// [place=farm]
import EidfjordFarms from "./geojson-data/Eidfjord-farms.geojson";
// [place=hamlet]
import EidfjordHamlets from "./geojson-data/Eidfjord-hamlets.geojson";
// [natural=water]
// import EidfjordWater from "./geojson-data/Eidfjord-water.geojson";
// [highway]["highway"!~"footway"]["highway"!~"path"]["highway"!~"piste"]
// import EidfjordHighway from "./geojson-data/Eidfjord-highway.geojson";
// [waterway]
// import EidfjordWaterway from "./geojson-data/Eidfjord-waterway.geojson";

const layers: (mapboxgl.AnyLayer & { query: string; place: string })[] = [
  {
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
  },
  {
    id: "piste",
    place: "Eidfjord",
    source: EidfjordPiste,
    type: "line",
    paint: {
      "line-color": "#046c8b",
      "line-width": 1.5,
    },
    query: '["piste:type"]',
  },
  {
    id: "hill",
    place: "Eidfjord",
    source: EidfjordHills,
    type: "symbol",
    layout: {
      "icon-image": "mountain",
      "text-size": 14,
    },
    query: "[natural=hill]",
  },
  {
    id: "farm",
    place: "Eidfjord",
    source: EidfjordFarms,
    type: "symbol",
    layout: {
      "icon-image": "marker",
      "text-size": 18,
    },
    query: "[place=farm]",
  },
  {
    id: "hamlet",
    place: "Eidfjord",
    source: EidfjordHamlets,
    type: "symbol",
    layout: {
      "icon-image": "marker",
      "text-size": 18,
    },
    query: "[place=hamlet]",
  },
  {
    id: "peak",
    place: "Eidfjord",
    source: EidfjordPeaks,
    type: "symbol",
    layout: {
      "icon-image": "mountain",
      "text-size": 20,
    },
    query: "[natural=peak]",
  },
];

let map: MapboxMap;

onMounted(() => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibWF0aGlhc2g5OCIsImEiOiJja3c1ZGx6bmcwZmQyMm5sajJrZGQwdDF5In0.Vw5JcsEGSmSzYTVGzhHPNQ";
  map = new mapboxgl.Map({
    container: "map-preview",
    zoom: 10,
    center: [7.1907702, 60.3464172],
    hash: true,
    style: "mapbox://styles/mathiash98/clk8slx6z00pe01peb7x65b4u",
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.ScaleControl({}));
  map.addControl(new mapboxgl.FullscreenControl());

  map.addControl(
    new MapboxExportControl({
      PageSize: Size.A2,
      PageOrientation: PageOrientation.Landscape,
      Format: Format.PNG,
      DPI: DPI[400],
      Crosshair: true,
      PrintableArea: true,
    }),
    "top-right"
  );

  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    addLayersToMap(map, layers);
  });

  (window as any).maplibreMap = map;
});

function addLayersToMap(
  map: MapboxMap,
  layersArr: (mapboxgl.AnyLayer & { query: string; place: string })[]
) {
  for (const layer of layersArr) {
    addLayerToMap(map, layer, `${layer.place}-${layer.id}`);
  }
}

function addLayerToMap(
  map: MapboxMap,
  layer: mapboxgl.AnyLayer,
  layerId?: string,
  geoJson?: any
) {
  if ("source" in layer) {
    map.addSource(layerId ?? layer.id, {
      type: "geojson",
      data: geoJson ?? layer.source,
    });

    if (layer.type === "symbol") {
      map.addLayer({
        id: layerId ?? layer.id,
        type: layer.type,
        source: layerId ?? layer.id,
        layout: {
          ...layer.layout,
          "text-field": [
            "case",
            ["has", "ele"],
            [
              "to-string",
              ["concat", ["get", "name"], "\n", ["get", "ele"], " m"],
            ],
            ["get", "name"],
          ],
          "text-font": ["Spectral Medium Italic"],
          // "symbol-z-order": "source",
          "symbol-sort-key": [
            "case",
            ["has", "ele"],
            ["-", 5000, ["to-number", ["get", "ele"]]],
            5000,
          ],
          "text-anchor": "bottom",
          "text-offset": [0, -0.3],
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#f2f2f2",
          "text-halo-width": 3,
        },
      });
    } else {
      map.addLayer({
        id: layerId ?? layer.id,
        type: layer.type,
        source: layerId ?? layer.id,
        paint: layer.paint as any,
      });
    }
  }
}

const placeName = ref("Eidfjord");
const loadingData = ref(false);
const consoleMessages = ref<string[]>([]);
async function handleKommuneFormSubmit(e: Event) {
  e.preventDefault();
  loadingData.value = true;

  try {
    const overpassTurboApiUrl = `https://overpass-api.de/api/interpreter`;
    for (const layer of layers) {
      const layerId = `${placeName.value}-${layer.id}`;
      const existingLayerSource = map.getSource(layerId);
      if (existingLayerSource) {
        console.info(`${layerId} already exists, skipping...`);
        consoleMessages.value.push(`${layerId} already exists, skipping...`);
        continue;
      }

      console.time(`Fetching ${layerId} data`);
      const response = await fetch(overpassTurboApiUrl, {
        method: "POST",
        body: `[out:json];
  rel["name"="${placeName.value}"];
  map_to_area;
  nwr${layer.query}(area);
  (._;>;);
  out body qt;`,
      });

      const data = await response.json();
      const geojson = osmtogeojson(data);
      console.info(`${layerId} ${geojson.features.length} features.`);
      consoleMessages.value.push(
        `${layerId} ${geojson.features.length} features.`
      );

      addLayerToMap(map, layer, layerId, geojson);

      console.timeEnd(`Fetching ${layerId} data`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } finally {
    loadingData.value = false;
  }
}
</script>

<style scoped>
#app {
  width: 100vw;
  height: 100vh;
}

.main {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  height: 100%;
  width: 100%;
}

#map-preview {
  width: 100%;
  height: 100%;
}
</style>

<style>
.mapboxgl-export-list .generate-button {
  background-color: black !important;
}
.mapboxgl-export-list label {
  color: black !important;
}
</style>
