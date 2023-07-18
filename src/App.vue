<template>
  <div id="app">
    <h1>Trail map generator</h1>
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
import { View, Map } from "ol";
import GeoJson from "ol/format/GeoJSON";
import Link from "ol/interaction/Link";
// import OSM from "ol/source/OSM";
import { Raster, XYZ } from "ol/source";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/WebGLTile";
import Feature from "ol/Feature";
import Geometry from "ol/geom/Geometry";
import { fromLonLat } from "ol/proj";
import { Style, Circle, Text, Fill, Stroke } from "ol/style";
import type { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
// [natural=peak]
import EidfjordPeaks from "./geojson-data/Eidfjord-peaks.geojson?raw";
// [natural=hill]
import EidfjordHills from "./geojson-data/Eidfjord-hills.geojson?raw";
// ["highway"="path"]
import EidfjordPaths from "./geojson-data/Eidfjord-paths.geojson?raw";
// ["highway"="piste"]
import EidfjordPiste from "./geojson-data/Eidfjord-piste.geojson?raw";
// [place=farm]
import EidfjordFarms from "./geojson-data/Eidfjord-farms.geojson?raw";
// [place=hamlet]
import EidfjordHamlets from "./geojson-data/Eidfjord-hamlets.geojson?raw";
// [natural=water]
import EidfjordWater from "./geojson-data/Eidfjord-water.geojson?raw";
// [highway]["highway"!~"footway"]["highway"!~"path"]["highway"!~"piste"]
import EidfjordHighway from "./geojson-data/Eidfjord-highway.geojson?raw";
// [waterway]
import EidfjordWaterway from "./geojson-data/Eidfjord-waterway.geojson?raw";

const getFont = (fontSize: number) => `${fontSize}px Georgia`;
const labelStyle = new Style({
  text: new Text({
    font: getFont(20),
    overflow: true,
    fill: new Fill({
      color: "#333",
    }),
    stroke: new Stroke({
      color: "#f2f2f2",
      width: 3,
    }),
    textBaseline: "bottom",
    offsetY: -8,
  }),
});

const pointCircle = new Circle({
  radius: 2,
  fill: new Fill({
    color: "black",
  }),
  stroke: new Stroke({
    color: "black",
    width: 1,
  }),
});
const pathStyle = new Style({
  // fill: new Fill({
  //   color: "#ff5c5c",
  // }),
  stroke: new Stroke({
    lineDash: [7, 6],
    color: "red",
    width: 1.5,
  }),
});
const pisteStyle = new Style({
  // fill: new Fill({
  //   color: "#046c8b",
  // }),
  stroke: new Stroke({
    color: "#046c8b",
    width: 1.5,
  }),
});

function getPeakStyle(feature: FeatureLike, fontSize = 20): Style {
  const label = feature.get("name");
  const ele = feature.get("ele");
  const eleNumRounded = Math.round(Number(ele));

  if (!label && eleNumRounded) {
    labelStyle.getText().setText(eleNumRounded + " m");
  } else {
    labelStyle
      .getText()
      .setText(ele !== undefined ? `${label}\n${eleNumRounded} m` : label);
  }
  labelStyle.setZIndex(Number.isNaN(eleNumRounded) ? 1 : eleNumRounded);
  labelStyle.getText().setFont(getFont(fontSize));
  return new Style({
    text: labelStyle.getText(),
    image: pointCircle,
  });
}

function getPointStyle(feature: FeatureLike, fontSize = 20): Style {
  const label = feature.get("name");
  if (label) {
    labelStyle.getText().setText(label);
    labelStyle.getText().setFont(getFont(fontSize));
  }
  return new Style({
    text: labelStyle.getText(),
    image: pointCircle,
  });
}

const layers: { [key: string]: Layer } = {
  peak: {
    source: new GeoJson().readFeatures(EidfjordPeaks),
    style: (feature) => getPeakStyle(feature),
    declutter: true,
    zIndex: 850,
  },
  hill: {
    source: new GeoJson().readFeatures(EidfjordHills),
    style: (feature) => getPointStyle(feature, 14),
    declutter: true,
    zIndex: 800,
  },
  path: {
    source: new GeoJson().readFeatures(EidfjordPaths),
    style: pathStyle,
    declutter: true,
    zIndex: 100,
  },
  piste: {
    source: new GeoJson().readFeatures(EidfjordPiste),
    style: pisteStyle,
    declutter: true,
    zIndex: 150,
  },
  farm: {
    source: new GeoJson().readFeatures(EidfjordFarms),
    style: (feature) => getPointStyle(feature, 18),
    declutter: true,
    zIndex: 500,
  },
  hamlet: {
    source: new GeoJson().readFeatures(EidfjordHamlets),
    style: (feature) => getPointStyle(feature, 18),
    declutter: true,
    zIndex: 550,
  },
  water: {
    source: new GeoJson().readFeatures(EidfjordWater),
    style: () => [
      new Style({
        fill: new Fill({
          color: "#cee0e4",
        }),
        stroke: new Stroke({
          color: "#999",
          width: 0.3,
        }),
      }),
      // getLabelStyle(feature, 0),
    ],
    declutter: true,
    zIndex: 10,
  },
  waterway: {
    source: new GeoJson().readFeatures(EidfjordWaterway),
    style: new Style({
      stroke: new Stroke({
        color: "#cee0e4",
        width: 2,
      }),
    }),
    declutter: true,
    zIndex: 11,
  },
  highway: {
    source: new GeoJson().readFeatures(EidfjordHighway),
    style: [
      // Outline the grey area
      // new Style({
      //   stroke: new Stroke({
      //     color: "#fff",
      //     width: 6,
      //   }),
      // }),
      new Style({
        stroke: new Stroke({
          color: "#aaa",
          width: 1.5,
        }),
      }),
    ],
    declutter: true,
    zIndex: 0,
  },
};

onMounted(() => {
  const map = new Map({
    target: "map-preview",
    view: new View({
      center: fromLonLat([7.1907702, 60.3464172]),
      zoom: 10,
      maxZoom: 20,
      projection: "EPSG:4326",
    }),
    layers: [
      // Hillshade does not work properly yet
      // new TileLayer({
      //   opacity: 0.2,
      //   source: new XYZ({
      //     projection: "EPSG:3857",
      //     url: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      //     crossOrigin: "anonymous",
      //     tileSize: 256,
      //     maxZoom: 12,
      //     minZoom: 5,
      //   }),
      //   style: {
      //     variables: {
      //       vert: 1,
      //       sunEl: 20,
      //       sunAz: 45,
      //     },
      //     color: ["color", scaled, scaled, scaled],
      //   },
      // }),
    ],
  });

  map.addInteraction(new Link());

  addLayers(map, layers);
  (window as unknown as any).map = map;
});

function addLayers(map: Map, layersObj: { [key: string]: Layer }) {
  for (const layerName in layersObj) {
    const layer = layersObj[layerName];
    map.addLayer(
      new VectorLayer({
        zIndex: layer.zIndex,
        properties: {
          name: layerName,
        },
        source: new VectorSource({
          features: layer.source,
        }),
        style: layer.style,
        declutter: true,
      })
    );
  }
}

type Layer = {
  source: Feature<Geometry>[];
  style:
    | ((feature: FeatureLike, resolution: number) => Style | Array<Style>)
    | Style
    | Style[];
  declutter: boolean;
  zIndex?: number;
};
// The method used to extract elevations from the DEM.
// In this case the format used is
// red + green * 2 + blue * 3
//
// Other frequently used methods include the Mapbox format
// (red * 256 * 256 + green * 256 + blue) * 0.1 - 10000
// and the Terrarium format
// (red * 256 + green + blue / 256) - 32768
function elevation(xOffset: number, yOffset: number) {
  const red = ["band", 1, xOffset, yOffset];
  const green = ["band", 2, xOffset, yOffset];
  const blue = ["band", 3, xOffset, yOffset];
  return ["-", ["+", ["*", 256 * 256, red], ["*", 256, green], blue], 32768];
}

// Generates a shaded relief image given elevation data.  Uses a 3x3
// neighborhood for determining slope and aspect.
const dp = ["*", 2, ["resolution"]];
const z0x = ["*", ["var", "vert"], elevation(-1, 0)];
const z1x = ["*", ["var", "vert"], elevation(1, 0)];
const dzdx = ["/", ["-", z1x, z0x], dp];
const z0y = ["*", ["var", "vert"], elevation(0, -1)];
const z1y = ["*", ["var", "vert"], elevation(0, 1)];
const dzdy = ["/", ["-", z1y, z0y], dp];
const slope = ["atan", ["^", ["+", ["^", dzdx, 2], ["^", dzdy, 2]], 0.5]];
const aspect = ["clamp", ["atan", ["-", 0, dzdx], dzdy], -Math.PI, Math.PI];
const sunEl = ["*", Math.PI / 180, ["var", "sunEl"]];
const sunAz = ["*", Math.PI / 180, ["var", "sunAz"]];

const cosIncidence = [
  "+",
  ["*", ["sin", sunEl], ["cos", slope]],
  ["*", ["*", ["cos", sunEl], ["sin", slope]], ["cos", ["-", sunAz, aspect]]],
];
const scaled = ["*", 255, cosIncidence];
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
  background-color: #f4f2f1;
}
#style-code {
  width: 100px;
  height: 100px;
}
</style>
