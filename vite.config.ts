import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable Cloudflare Workers plugin — we deploy to Vercel (Node.js runtime)
  cloudflare: false,
  tanstackStart: {
    server: {
      preset: "vercel",
      entry: "server",
    },
  },
});
