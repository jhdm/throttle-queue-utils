module.exports = {
  env: {
    node: true,
    "jest/globals": true
  },
  extends: [
    "airbnb-typescript/base",
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:jest/recommended",
    "plugin:jest/style",
  ],
  plugins: ["@typescript-eslint", "jest"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "import/prefer-default-export": "off"
  },
  parser: "@typescript-eslint/parser",
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src']
        ],
        extensions: ['.ts'],
      },
    },
  },
  overrides: [{
    files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/**/*.spec.{j,t}s?(x)"],
    env: {
      jest: true
    }
  }]
};
