/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{svelte,js}',
    './node_modules/svetamat/**/*.svelte',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          150: '#d4d4d8',
        },
      },
    }
  },
  variants: {
    boxShadow: ['responsive', 'hover', 'focus', 'active'],
  },
  plugins: []
}
