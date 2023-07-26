<template>
  <div id="app">
    <form @submit="handleKommuneFormSubmit">
      <label for="kommune">Location:</label>
      <input
        type="text"
        name="kommune"
        id="kommune"
        placeholder="Name of an existing relation in OpenStreetMap"
        v-model="placeName"
        :disabled="loadingData"
      />
      <input type="submit" value="Download" :disabled="loadingData" />
      <p v-if="loadingData">Loading...</p>
      <p>{{ consoleMessages.at(-1) }}</p>
    </form>
    <a
      style="margin-left: 8px; color: lightblue"
      href="https://github.com/mathiash98/trail-map-generator"
      >GitHub</a
    >
    <div id="map-preview"></div>
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
import { addLayerToMap, addLayersToMap } from "./helpers/mapFunctions";
import layers from "./layers";

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
  map.addControl(new mapboxgl.AttributionControl({ compact: true }));

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

const placeName = ref("Eidfjord");
const loadingData = ref(false);
const consoleMessages = ref<string[]>([]);
async function handleKommuneFormSubmit(e: Event) {
  e.preventDefault();
  loadingData.value = true;

  try {
    for (const layer of layers) {
      const layerId = `${placeName.value}-${layer.id}`;
      const existingLayerSource = map.getSource(layerId);
      if (existingLayerSource) {
        console.info(`${layerId} already exists, skipping...`);
        consoleMessages.value.push(`${layerId} already exists, skipping...`);
        continue;
      }

      const nameSearchResult = await queryOverpassTurbo(
        `[out:json]; rel["name"="${placeName.value}"]; out body qt;`
      );
      if (nameSearchResult.elements.length === 0) {
        consoleMessages.value.push(
          `No results, ensure "rel[name=${placeName.value}]" exist in OSM.`
        );
        break;
      }

      console.time(`Fetching ${layerId} data`);
      const data = await queryOverpassTurbo(`[out:json];
  rel["name"="${placeName.value}"];
  map_to_area;
  nwr${layer.query}(area);
  (._;>;);
  out body qt;`);

      const geojson = osmtogeojson(data);
      console.info(`${layerId} ${geojson.features.length} features.`);
      consoleMessages.value.push(
        `${layerId} ${geojson.features.length} features.`
      );

      console.timeEnd(`Fetching ${layerId} data`);

      addLayerToMap(map, layer, layerId, geojson);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (e) {
    if (e instanceof Object && "message" in e && typeof e.message == "string") {
      consoleMessages.value.push(e.message);
    }
    throw e;
  } finally {
    loadingData.value = false;
  }
}

const overpassTurboApiUrl = `https://overpass-api.de/api/interpreter`;
async function queryOverpassTurbo(
  query: string
): Promise<{ [key: string]: any; elements: object[] }> {
  const response = await fetch(overpassTurboApiUrl, {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error(
      `Overpass Turbo API returned an error, ${response.statusText}`
    );
  }

  return await response.json();
}
</script>

<style scoped>
#app {
  width: 100vw;
  height: 100vh;
}
#app form {
  height: 50px;
  display: inline-flex;
  align-items: center;
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
