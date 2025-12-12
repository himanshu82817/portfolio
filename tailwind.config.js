/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- Enables the dark mode toggle feature
  content: [
    "./src/**/*.{html,ts}", // <--- Scans all HTML and TS files in src folder
  ],
  theme: {
    extend: {
      colors: {
        primary: "#39E079",
        "on-primary": "#181811",
        "secondary-container": "#f2f0c2",
        tertiary: "#6b4eff",
        "tertiary-container": "#eaddff",
        "on-tertiary-container": "#21005d",
        "background-light": "#f6f8f7",
        "background-dark": "#122017",
        "surface-variant": "#f0f0eb",
        "surface-elevated": "#ffffff",
        outline: "#79747e"
      },
      fontFamily: {
        display: ["Spline Sans", "sans-serif"],
        body: ["Spline Sans", "sans-serif"]
      },
      boxShadow: {
        "elevation-1": "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
        "elevation-2": "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
        "elevation-3": "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "spin-slow": "spin 12s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}