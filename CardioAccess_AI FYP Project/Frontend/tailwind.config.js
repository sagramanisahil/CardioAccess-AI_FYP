
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "sans-serif"],
      },

      colors: {
        navy: {
          950: "#102A43",
          900: "#1A3A5C",
          800: "#243E5F",
        },

        clinic: {
          bg: "#F4F8FC",
          surface: "#FFFFFF",
          line: "#E2E8F0",

          blue: "#2563EB",
          blueDark: "#1D4ED8",
          blueLight: "#EFF6FF",

          cyan: "#06B6D4",
          accent: "#0D9488",
          violet: "#7C3AED",
          amber: "#F59E0B",

          ink: "#102A43",
          mute: "#64748B",

          success: "#15803D",
          warning: "#B45309",
          danger: "#B91C1C",
        },
      },

      backgroundImage: {
        "clinic-gradient":
          "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",

        "teal-gradient":
          "linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)",

        "violet-gradient":
          "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",

        "warm-gradient":
          "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
      },

      boxShadow: {
        card:
          "0 4px 20px rgba(16, 42, 67, 0.06)",

        lift:
          "0 16px 36px rgba(37, 99, 235, 0.13)",

        glow:
          "0 8px 24px rgba(37, 99, 235, 0.20)",
      },

      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },
    },
  },

  plugins: [],
};
