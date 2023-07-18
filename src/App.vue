<template>
  <div id="app">
    <h1>Trail map generator</h1>
    <div class="main">
      <div id="map-preview"></div>
      <div id="maplibre"></div>
      <!-- <div id="style-code">
        <textarea name="style" id="" cols="30" rows="10"></textarea>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import maplibre from "maplibre-gl";
import type { LayerSpecification, Map as maplibreGlMap } from "maplibre-gl";
import mlcontour from "maplibre-contour";
import {
  MaplibreExportControl,
  Size,
  PageOrientation,
  Format,
  DPI,
} from "@watergis/maplibre-gl-export";
import "@watergis/maplibre-gl-export/dist/maplibre-gl-export.css";
import { View, Map as OlMap } from "ol";
import GeoJson from "ol/format/GeoJSON";
import Link from "ol/interaction/Link";
// import OSM from "ol/source/OSM";
// import TileLayer from "ol/layer/WebGLTile";
// import { Raster, XYZ } from "ol/source";
// import ImageLayer from "ol/layer/Image";
// import Feature from "ol/Feature";
// import Geometry from "ol/geom/Geometry";
import { Style, Circle, Text, Fill, Stroke } from "ol/style";
import type { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
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
import EidfjordWater from "./geojson-data/Eidfjord-water.geojson";
// [highway]["highway"!~"footway"]["highway"!~"path"]["highway"!~"piste"]
import EidfjordHighway from "./geojson-data/Eidfjord-highway.geojson";
// [waterway]
import EidfjordWaterway from "./geojson-data/Eidfjord-waterway.geojson";

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
    source: EidfjordPeaks,
    style: (feature) => getPeakStyle(feature),
    declutter: true,
    zIndex: 850,
  },
  hill: {
    source: EidfjordHills,
    style: (feature) => getPointStyle(feature, 14),
    declutter: true,
    zIndex: 800,
  },
  path: {
    source: EidfjordPaths,
    style: pathStyle,
    declutter: true,
    zIndex: 100,
  },
  piste: {
    source: EidfjordPiste,
    style: pisteStyle,
    declutter: true,
    zIndex: 150,
  },
  farm: {
    source: EidfjordFarms,
    style: (feature) => getPointStyle(feature, 18),
    declutter: true,
    zIndex: 500,
  },
  hamlet: {
    source: EidfjordHamlets,
    style: (feature) => getPointStyle(feature, 18),
    declutter: true,
    zIndex: 550,
  },
  water: {
    source: EidfjordWater,
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
    source: EidfjordWaterway,
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
    source: EidfjordHighway,
    style: [
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

const maplibreLayers: LayerSpecification[] = [
  {
    id: "water",
    source: EidfjordWater,
    type: "fill",
    paint: {
      "fill-color": "#cee0e4",
      "fill-outline-color": "#000",
      "fill-antialias": false,
    },
  },
  {
    id: "waterway",
    source: EidfjordWaterway,
    type: "line",
    paint: {
      "line-color": "#cee0e4",
      "line-width": 1,
    },
  },
  {
    id: "highway",
    source: EidfjordHighway,
    type: "line",
    paint: {
      "line-color": "#aaa",
      "line-width": 1.5,
    },
  },
  {
    id: "peak",
    source: EidfjordPeaks,
    type: "circle",
    paint: {
      "circle-radius": 2,
      "circle-color": "#000",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "hill",
    source: EidfjordHills,
    type: "circle",
    paint: {
      "circle-radius": 2,
      "circle-color": "#000",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
  },
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
    id: "farm",
    source: EidfjordFarms,
    type: "circle",
    paint: {
      "circle-radius": 2,
      "circle-color": "#000",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "hamlet",
    source: EidfjordHamlets,
    type: "circle",
    paint: {
      "circle-radius": 2,
      "circle-color": "#000",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
  },
];

onMounted(() => {
  const openLayersMap = new OlMap({
    target: "map-preview",
    view: new View({
      center: [800647.3315749887, 60.38762736055437],
      zoom: 10,
      maxZoom: 20,
      projection: "EPSG:4326",
    }),
  });

  openLayersMap.addInteraction(new Link());

  addLayers(openLayersMap, layers);
  (window as unknown as any).olMap = openLayersMap;

  const demSource = new mlcontour.DemSource({
    url: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
    encoding: "terrarium",
    maxzoom: 12,
    // offload contour line computation to a web worker
    worker: true,
  });

  demSource.setupMaplibre(maplibre);

  const maplibreMap = new maplibre.Map({
    container: "maplibre",
    zoom: 10,
    center: [7.1907702, 60.3464172],
    hash: false,
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        hillshadeSource: {
          type: "raster-dem",
          // share cached raster-dem tiles with the contour source
          tiles: [demSource.sharedDemProtocolUrl],
          tileSize: 512,
          maxzoom: 12,
        },
        contourSourceFeet: {
          type: "vector",
          tiles: [
            demSource.contourProtocolUrl({
              overzoom: 1,
              thresholds: {
                // zoom: [minor, major]
                11: [200, 1000],
                12: [100, 500],
                13: [100, 500],
                14: [50, 200],
                15: [20, 100],
              },
              elevationKey: "ele",
              levelKey: "level",
              contourLayer: "contours",
            }),
          ],
          maxzoom: 15,
        },
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": "#f4f2f1",
          },
        },
        // {
        //   id: "hills",
        //   type: "hillshade",
        //   source: "hillshadeSource",
        //   paint: {
        //     "hillshade-exaggeration": 0.1,
        //   },
        // },
        {
          id: "contours",
          type: "line",
          source: "contourSourceFeet",
          "source-layer": "contours",
          paint: {
            "line-opacity": 0.5,
            "line-color": "#333",
            // "major" contours have level=1, "minor" have level=0
            "line-width": ["match", ["get", "level"], 1, 1, 0.5],
          },
        },
        {
          id: "contour-text",
          type: "symbol",
          source: "contourSourceFeet",
          "source-layer": "contours",
          filter: [">", ["get", "level"], 0],
          paint: {
            "text-halo-color": "white",
            "text-halo-width": 1,
          },
          layout: {
            "symbol-placement": "line",
            "text-size": 10,
            "text-field": ["concat", ["get", "ele"], " m"],
            "text-font": ["Noto Sans Bold"],
          },
        },
      ],
    },
  });

  maplibreMap.addControl(new maplibre.NavigationControl());
  maplibreMap.addControl(new maplibre.ScaleControl({}));

  // create control with specified options
  maplibreMap.addControl(
    new MaplibreExportControl({
      PageSize: Size.A2,
      PageOrientation: PageOrientation.Portrait,
      Format: Format.PNG,
      DPI: DPI[400],
      Crosshair: true,
      PrintableArea: true,
    }),
    "top-right"
  );

  maplibreMap.on("load", () => {
    addLayersToMaplibre(maplibreMap, maplibreLayers);
  });

  (window as any).maplibreMap = maplibreMap;
});

function addLayers(map: OlMap, layersObj: { [key: string]: Layer }) {
  for (const layerName in layersObj) {
    const layer = layersObj[layerName];
    map.addLayer(
      new VectorLayer({
        zIndex: layer.zIndex,
        properties: {
          name: layerName,
        },
        source: new VectorSource({
          url: layer.source,
          format: new GeoJson(),
          // features: layer.source,
        }),
        style: layer.style,
        declutter: true,
      })
    );
  }
}

function addLayersToMaplibre(
  map: maplibreGlMap,
  layersArr: LayerSpecification[]
) {
  for (const layer of layersArr) {
    if ("source" in layer) {
      map.addSource(layer.id, {
        type: "geojson",
        data: layer.source,
      });
      map.addLayer({
        id: layer.id,
        type: layer.type,
        source: layer.id,
        paint: layer.paint as any,
      });
    }
  }
}

type Layer = {
  source: string;
  style:
    | ((feature: FeatureLike, resolution: number) => Style | Array<Style>)
    | Style
    | Style[];
  declutter: boolean;
  zIndex?: number;
};

// // The method used to extract elevations from the DEM.
// // In this case the format used is
// // red + green * 2 + blue * 3
// //
// // Other frequently used methods include the Mapbox format
// // (red * 256 * 256 + green * 256 + blue) * 0.1 - 10000
// // and the Terrarium format
// // (red * 256 + green + blue / 256) - 32768
// function elevation(xOffset: number, yOffset: number) {
//   const red = ["band", 1, xOffset, yOffset];
//   const green = ["band", 2, xOffset, yOffset];
//   const blue = ["band", 3, xOffset, yOffset];
//   return ["-", ["+", ["*", 256 * 256, red], ["*", 256, green], blue], 32768];
// }

// // Generates a shaded relief image given elevation data.  Uses a 3x3
// // neighborhood for determining slope and aspect.
// const dp = ["*", 2, ["resolution"]];
// const z0x = ["*", ["var", "vert"], elevation(-1, 0)];
// const z1x = ["*", ["var", "vert"], elevation(1, 0)];
// const dzdx = ["/", ["-", z1x, z0x], dp];
// const z0y = ["*", ["var", "vert"], elevation(0, -1)];
// const z1y = ["*", ["var", "vert"], elevation(0, 1)];
// const dzdy = ["/", ["-", z1y, z0y], dp];
// const slope = ["atan", ["^", ["+", ["^", dzdx, 2], ["^", dzdy, 2]], 0.5]];
// const aspect = ["clamp", ["atan", ["-", 0, dzdx], dzdy], -Math.PI, Math.PI];
// const sunEl = ["*", Math.PI / 180, ["var", "sunEl"]];
// const sunAz = ["*", Math.PI / 180, ["var", "sunAz"]];

// const cosIncidence = [
//   "+",
//   ["*", ["sin", sunEl], ["cos", slope]],
//   ["*", ["*", ["cos", sunEl], ["sin", slope]], ["cos", ["-", sunAz, aspect]]],
// ];
// const scaled = ["*", 255, cosIncidence];
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

#map-preview,
#maplibre {
  width: 50%;
  height: 100%;
  background-color: #f4f2f1;
}
#style-code {
  width: 100px;
  height: 100px;
}
</style>
