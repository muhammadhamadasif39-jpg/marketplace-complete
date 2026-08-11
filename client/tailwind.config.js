/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Matches the Bazario storefront design: deep indigo + saffron-orange
        brand: {
          DEFAULT: "#181A2A", // ink
          accent: "#FF6A39", // saffron
          accentDark: "#E5501F",
          teal: "#03A696",
          marigold: "#FFC93C",
        },
      },
      fontFamily: {
        display: ["'Baloo 2'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
