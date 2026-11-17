// The prerendered /fr/ page declares French in <html lang>, which app.html (shared by all pages) sets to English.
export const handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) =>
      /\/fr\/$/.test(event.url.pathname) ? html.replace('<html lang="en"', '<html lang="fr"') : html
  });
