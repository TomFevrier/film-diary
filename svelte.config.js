import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// BASE_PATH = URL sub-path the site is served from ("/<repo-name>" on GitHub project pages, "/films" …).
// Empty or "/" = served from the root of a domain.
const base = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: undefined }),
    paths: { base, relative: true },
    prerender: { handleHttpError: 'warn' }
  }
};
