import { defineConfig } from "vite";
import { resolve } from "node:path";
// Builds the KBI Portal into dist/portal/. Run after scripts/build.mjs (which creates dist/ and the rest of the site).
// Firebase and SheetJS are split into their own files so the app shell stays small.
export default defineConfig({
  root: import.meta.dirname,
  base: "/portal/",
  publicDir: resolve(import.meta.dirname, "public"),
  build: {
    outDir: resolve(import.meta.dirname, "../dist/portal"),
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { firebase: ["firebase/app", "firebase/auth", "firebase/firestore"], sheetjs: ["xlsx"] } } },
  },
  test: { include: ["tests/**/*.test.js"], exclude: ["tests/rules.test.js"] },
});
