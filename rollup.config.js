import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "./src/index.js",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
    },
    {
      file: "dist/index.ejs",
      format: "esm",
    },
  ],
  plugins: [commonjs(), terser()],
};
