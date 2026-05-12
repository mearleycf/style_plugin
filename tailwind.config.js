/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/ui/**/*.{html,js,ts}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0d99ff",
          hover: "#004c84",
          active: "#95d2ff",
        },
        ui: {
          primary: "#fbfdff",
          secondary: "#e8e8e8",
          tertiary: "#cccccc",
          surface: "#ffffff",
          hover: "#f7f9ff",
          dirty: "#fff8e1",
          dirtyHover: "#fff3cc",
          bound: "#e3f2fd",
          clear: "#fff3f3",
          text: "#1a1a1a",
          muted: "#555555",
          subtle: "#888888",
        },
        status: {
          ok: "#4caf50",
          error: "#f44336",
          pending: "#ff9800",
        },
      },
      fontFamily: {
        ui: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "sans-serif",
        ],
      },
      fontSize: {
        ui: "11px",
        micro: "10px",
      },
      boxShadow: {
        picker: "0 4px 16px rgba(0,0,0,.18)",
      },
    },
  },
  plugins: [],
};
