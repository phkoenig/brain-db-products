module.exports = {
  // ...

  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(253, 242, 248)",
          100: "rgb(252, 231, 243)",
          200: "rgb(251, 207, 232)",
          300: "rgb(249, 168, 212)",
          400: "rgb(244, 114, 182)",
          500: "rgb(236, 72, 153)",
          600: "rgb(219, 39, 119)",
          700: "rgb(190, 24, 93)",
          800: "rgb(157, 23, 77)",
          900: "rgb(131, 24, 67)",
        },
        neutral: {
          0: "rgb(255, 255, 255)",
          50: "rgb(250, 250, 249)",
          100: "rgb(245, 245, 244)",
          200: "rgb(231, 229, 228)",
          300: "rgb(214, 211, 209)",
          400: "rgb(168, 162, 158)",
          500: "rgb(120, 113, 108)",
          600: "rgb(87, 83, 78)",
          700: "rgb(68, 64, 60)",
          800: "rgb(41, 37, 36)",
          900: "rgb(28, 25, 23)",
          950: "rgb(12, 10, 9)",
        },
        error: {
          50: "rgb(254, 252, 232)",
          100: "rgb(254, 249, 195)",
          200: "rgb(254, 240, 138)",
          300: "rgb(253, 224, 71)",
          400: "rgb(250, 204, 21)",
          500: "rgb(234, 179, 8)",
          600: "rgb(202, 138, 4)",
          700: "rgb(161, 98, 7)",
          800: "rgb(133, 77, 14)",
          900: "rgb(113, 63, 18)",
        },
        warning: {
          50: "rgb(253, 244, 255)",
          100: "rgb(250, 232, 255)",
          200: "rgb(245, 208, 254)",
          300: "rgb(240, 171, 252)",
          400: "rgb(232, 121, 249)",
          500: "rgb(217, 70, 239)",
          600: "rgb(192, 38, 211)",
          700: "rgb(162, 28, 175)",
          800: "rgb(134, 25, 143)",
          900: "rgb(112, 26, 117)",
        },
        success: {
          50: "rgb(240, 253, 250)",
          100: "rgb(204, 251, 241)",
          200: "rgb(153, 246, 228)",
          300: "rgb(94, 234, 212)",
          400: "rgb(45, 212, 191)",
          500: "rgb(20, 184, 166)",
          600: "rgb(13, 148, 136)",
          700: "rgb(15, 118, 110)",
          800: "rgb(17, 94, 89)",
          900: "rgb(19, 78, 74)",
        },
        "brand-primary": "rgb(219, 39, 119)",
        "default-font": "rgb(28, 25, 23)",
        "subtext-color": "rgb(120, 113, 108)",
        "neutral-border": "rgb(231, 229, 228)",
        white: "rgb(255, 255, 255)",
        "default-background": "rgb(255, 255, 255)",
      },
      fontSize: {
        caption: [
          "12px",
          {
            lineHeight: "16px",
            fontWeight: "400",
            letterSpacing: "0em",
          },
        ],
        "caption-bold": [
          "12px",
          {
            lineHeight: "16px",
            fontWeight: "600",
            letterSpacing: "0em",
          },
        ],
        body: [
          "14px",
          {
            lineHeight: "20px",
            fontWeight: "400",
            letterSpacing: "0em",
          },
        ],
        "body-bold": [
          "14px",
          {
            lineHeight: "20px",
            fontWeight: "600",
            letterSpacing: "0em",
          },
        ],
        "heading-3": [
          "16px",
          {
            lineHeight: "20px",
            fontWeight: "700",
            letterSpacing: "0em",
          },
        ],
        "heading-2": [
          "20px",
          {
            lineHeight: "24px",
            fontWeight: "700",
            letterSpacing: "0em",
          },
        ],
        "heading-1": [
          "30px",
          {
            lineHeight: "36px",
            fontWeight: "700",
            letterSpacing: "0em",
          },
        ],
        "monospace-body": [
          "14px",
          {
            lineHeight: "20px",
            fontWeight: "400",
            letterSpacing: "0em",
          },
        ],
      },
      fontFamily: {
        caption: "Outfit",
        "caption-bold": "Outfit",
        body: "Outfit",
        "body-bold": "Outfit",
        "heading-3": "Outfit",
        "heading-2": "Outfit",
        "heading-1": "Outfit",
        "monospace-body": "monospace",
      },
      boxShadow: {
        sm: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
        default: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
        md: "0px 4px 16px -2px rgba(0, 0, 0, 0.08), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)",
        lg: "0px 12px 32px -4px rgba(0, 0, 0, 0.08), 0px 4px 8px -2px rgba(0, 0, 0, 0.08)",
        overlay:
          "0px 12px 32px -4px rgba(0, 0, 0, 0.08), 0px 4px 8px -2px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        2: "6px",
        sm: "8px",
        md: "16px",
        DEFAULT: "16px",
        lg: "24px",
        full: "9999px",
      },
      container: {
        padding: {
          DEFAULT: "16px",
          sm: "calc((100vw + 16px - 640px) / 2)",
          md: "calc((100vw + 16px - 768px) / 2)",
          lg: "calc((100vw + 16px - 1024px) / 2)",
          xl: "calc((100vw + 16px - 1280px) / 2)",
          "2xl": "calc((100vw + 16px - 1536px) / 2)",
        },
      },
      spacing: {
        112: "28rem",
        144: "36rem",
        192: "48rem",
        256: "64rem",
        320: "80rem",
      },
      screens: {
        mobile: {
          max: "767px",
        },
      },
    },
  },
};
