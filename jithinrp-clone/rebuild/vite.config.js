import { defineConfig } from 'vite';

export default defineConfig({
  // static assets (fonts, images, video, music) are served from /public at the site root
  build: { target: 'es2022' },
});
