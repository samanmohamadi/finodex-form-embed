import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

// Vite library build → single self-contained IIFE bundle that exposes
// `window.FinodexForms`. Drop the file on a CDN, point a <script src=…> tag
// at it, and it works on any site.
export default defineConfig({
  plugins: [preact()],
  define: {
    // Baked-in default API base; can be overridden per-form via data attribute
    // or programmatic option.
    __DEFAULT_API_BASE__: JSON.stringify(
      process.env.VITE_DEFAULT_API_BASE || "https://api.finodex.net"
    ),
  },
  build: {
    target: "es2019",
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/main.tsx"),
      name: "FinodexForms",
      formats: ["iife"],
      fileName: () => "finodex-forms.js",
    },
    rollupOptions: {
      output: {
        // Inline the CSS into the JS bundle so the embed is a single file.
        assetFileNames: "finodex-forms.[ext]",
        inlineDynamicImports: true,
      },
    },
  },
});
