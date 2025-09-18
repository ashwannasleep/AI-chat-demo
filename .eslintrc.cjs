module.exports = {
  env: { browser: true, es2021: true },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "detect" } },
  rules: { "react/prop-types": "off" },
  overrides: [
    {
      files: ["**/*.test.js", "**/*.test.jsx", "**/*.spec.js", "**/*.spec.jsx"],
      env: { jest: true },
      globals: { test: "readonly", expect: "readonly" }
    },
    {
      files: ["server/**/*.js"],
      env: { node: true, es2021: true },
      rules: { "no-undef": "off" }
    }
  ]
};
