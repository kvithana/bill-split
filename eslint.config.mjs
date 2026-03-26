import coreWebVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      // New in react-hooks v7; conflicts with reading sessionStorage / matchMedia in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default eslintConfig
