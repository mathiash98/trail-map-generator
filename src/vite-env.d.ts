/// <reference types="vite/client" />

/**
 * Define the output of .geojson files as a string.
 * `geojson` has been included in vite.config.ts as assets,
 * so they will be imported with a url reference,
 * and not the actual json content.
 */
declare module "*.geojson" {
  const viteUrlReference: string;
  export default viteUrlReference;
}
