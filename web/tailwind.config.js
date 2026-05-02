/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{svelte,js}',
    './node_modules/svetamat/**/*.svelte',
  ],
  theme: {
    extend: {}
  },
  variants: {
    boxShadow: ['responsive', 'hover', 'focus', 'active'],
  },
  plugins: [
    require('tailwindcss-elevation')(['responsive', 'hover', 'active']),
  ]
}
