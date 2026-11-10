/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#102A43",
          900: "#1A3A5C",
          800: "#243E5F",
        },
        clinic: {
          bg: "#F4F8FC",
          line: "#E2E8F0",
          blue: "#2563EB",
          cyan: "#06B6D4",
          accent: "#0D9488",
          violet: "#7C3AED",
          ink: "#102A43",
          mute: "#64748B",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.8) inset, 0 10px 28px rgba(16, 42, 67, 0.07), 0 2px 6px rgba(37, 99, 235, 0.05)",
        lift: "0 22px 50px rgba(16, 42, 67, 0.16)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },
    },
  },
  plugins: [],
};
