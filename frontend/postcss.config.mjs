/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- A CORREÇÃO
    autoprefixer: {},
  },
};

export default config;