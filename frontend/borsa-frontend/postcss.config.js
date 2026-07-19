import purgecss from '@fullhuman/postcss-purgecss';

export default {
  plugins: [
    process.env.NODE_ENV === 'production' && purgecss({
      content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}'
      ],
      // Regex extractor for identifying CSS classes used in JS/JSX files
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [
          'html', 'body', 'root',
          /active$/, /show$/, /fade$/, /collapse$/, /collapsing$/,
          /^modal/, /^dropdown/, /^nav/, /^btn/, /^card/,
          /is-invalid/, /aria-invalid/, /aria-describedby/,
          /glow/, /shimmer/, /pulse/
        ],
        deep: [/plyr/, /recharts/]
      }
    })
  ].filter(Boolean)
};
