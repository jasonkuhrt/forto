import rollupTypesript from "rollup-plugin-typescript"
import typescript from "typescript"
import resolve from "rollup-plugin-node-resolve"
import * as F from "ramda"
import closure from "rollup-plugin-closure-compiler-js"

const pkg = require("./package.json")
const external = F.keys(F.omit(["lodash-es"], pkg.dependencies))

export default {
  input: "source/Main.ts",
  plugins: [
    rollupTypesript({
      typescript,
    }),
    resolve(),
    closure(),
  ],
  external,
  output: [
    {
      file: pkg.main,
      format: "umd",
      name: pkg.name,
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
  ],
}
