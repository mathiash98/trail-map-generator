import type { Map as MapboxMap } from "mapbox-gl";
export function addLayersToMap(
  map: MapboxMap,
  layersArr: (mapboxgl.AnyLayer & { query: string; place: string })[]
) {
  for (const layer of layersArr) {
    addLayerToMap(map, layer, `${layer.place}-${layer.id}`);
  }
}

export function addLayerToMap(
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
