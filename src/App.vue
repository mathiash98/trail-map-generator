<template>
  <div id="app">
    <div class="main">
      <div id="map-preview"></div>
      <!-- <div id="style-code">
        <textarea name="style" id="" cols="30" rows="10"></textarea>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
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
// [natural=peak]
import EidfjordPeaks from "./geojson-data/Eidfjord-peaks.geojson";
// [natural=hill]
import EidfjordHills from "./geojson-data/Eidfjord-hills.geojson";
// ["highway"="path"]
import EidfjordPaths from "./geojson-data/Eidfjord-paths.geojson";
// ["highway"="piste"]
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

const layers: mapboxgl.AnyLayer[] = [
  // {
  //   id: "water",
  //   source: EidfjordWater,
  //   type: "fill",
  //   paint: {
  //     "fill-color": "#cee0e4",
  //     "fill-outline-color": "#000",
  //     "fill-antialias": false,
  //   },
  // },
  // {
  //   id: "waterway",
  //   source: EidfjordWaterway,
  //   type: "line",
  //   paint: {
  //     "line-color": "#cee0e4",
  //     "line-width": 1,
  //   },
  // },
  // {
  //   id: "highway",
  //   source: EidfjordHighway,
  //   type: "line",
  //   paint: {
  //     "line-color": "#aaa",
  //     "line-width": 1.5,
  //   },
  // },
  {
    id: "path",
    source: EidfjordPaths,
    type: "line",
    paint: {
      "line-dasharray": [6, 2],
      "line-color": "#ff5c5c",
      "line-width": 1.5,
    },
  },
  {
    id: "piste",
    source: EidfjordPiste,
    type: "line",
    paint: {
      "line-color": "#046c8b",
      "line-width": 1.5,
    },
  },
  {
    id: "hill",
    source: EidfjordHills,
    type: "symbol",
    layout: {
      "icon-image": "mountain",
      "text-size": 14,
    },
  },
  {
    id: "farm",
    source: EidfjordFarms,
    type: "symbol",
    layout: {
      "icon-image": "marker",
      "text-size": 18,
    },
  },
  {
    id: "hamlet",
    source: EidfjordHamlets,
    type: "symbol",
    layout: {
      "icon-image": "marker",
      "text-size": 18,
    },
  },
  {
    id: "peak",
    source: EidfjordPeaks,
    type: "symbol",
    layout: {
      "icon-image": "mountain",
      "text-size": 20,
    },
  },
];

onMounted(() => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibWF0aGlhc2g5OCIsImEiOiJja3c1ZGx6bmcwZmQyMm5sajJrZGQwdDF5In0.Vw5JcsEGSmSzYTVGzhHPNQ";
  const map = new mapboxgl.Map({
    container: "map-preview",
    zoom: 10,
    center: [7.1907702, 60.3464172],
    hash: true,
    style: "mapbox://styles/mathiash98/clk8slx6z00pe01peb7x65b4u",
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.ScaleControl({}));

  // create control with specified options
  map.addControl(
    new MapboxExportControl({
      PageSize: Size.A2,
      PageOrientation: PageOrientation.Portrait,
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

function addLayersToMap(map: MapboxMap, layersArr: mapboxgl.AnyLayer[]) {
  for (const layer of layersArr) {
    if ("source" in layer) {
      map.addSource(layer.id, {
        type: "geojson",
        data: layer.source,
      });

      if (layer.type === "symbol") {
        map.addLayer({
          id: layer.id,
          type: layer.type,
          source: layer.id,
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
          id: layer.id,
          type: layer.type,
          source: layer.id,
          paint: layer.paint as any,
        });
      }
    }
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
#style-code {
  width: 100px;
  height: 100px;
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
