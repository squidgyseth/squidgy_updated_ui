import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          light: "#E5E5E7",
          purple: "#E5E5E7",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Squidgy brand colors
        squidgy: {
          purple: "#5E17EB",
          pink: "#A61D92",
          red: "#FB252A",
          blue: "#6017E8",
          primary: "#5E17EB",
        },
        // Platform whitelabel colors (CSS variable based)
        platform: {
          primary: "var(--platform-primary)",
          secondary: "var(--platform-secondary)",
          accent: "var(--platform-accent)",
        },
        text: {
          primary: "#232534",
          secondary: "#444652",
          subtle: "#656671",
          success: "#028833",
        },
        bg: {
          message: "#F5F5F5",
          selected: "#F3ECFF",
          hover: "#F9F9F9",
        },
        grey: {
          200: "#444652",
          500: "rgba(35, 37, 52, 0.40)",
          700: "#D3D3D6",
          800: "#E5E5E7",
          900: "#F0F0F1",
        },
        green: {
          100: "#E5F6EC",
          600: "#028833",
        },
        "grey-500T": "rgba(35, 37, 52, 0.40)",
        "grey-700T": "rgba(35, 37, 52, 0.20)",
        "primary-600": "#F3ECFF",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        button: "8px",
        modal: "16px",
      },
      backgroundImage: {
        'squidgy-gradient': 'linear-gradient(107deg, #FB252A 3.11%, #A61D92 50.44%, #6017E8 100.58%)',
        'header-gradient': 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)',
        'platform-gradient': 'linear-gradient(107deg, var(--platform-gradient-start) 3.11%, var(--platform-gradient-mid) 50.44%, var(--platform-gradient-end) 100.58%)',
      },
      fontFamily: {
        'open-sans': ['Open Sans', 'Inter', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
