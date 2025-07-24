const typescript = require("@rollup/plugin-typescript");
module.exports = {
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      file: "dist/mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "dist/mini-vue.esm.js",
    },
  ],
  plugins: [typescript()],
};
