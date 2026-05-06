import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "@agent-native/core/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

function tauriStubPlugin(): Plugin {
  const TAURI_RE = /^@tauri-apps\//;
  return {
    name: "tauri-stub",
    resolveId(id) {
      if (TAURI_RE.test(id)) return "\0tauri-stub";
    },
    load(id) {
      if (id === "\0tauri-stub") return "export default {}";
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), tauriStubPlugin(), reactRouter()],
  tailwind: false, // We add it ourselves since the framework's require() can't load the ESM package
  ssrStubs: ["shiki"],
});
