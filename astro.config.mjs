// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [tailwind(), preact({ compat: true }), 
  ],
  output: 'server'
});