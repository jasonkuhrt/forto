import * as F from "ramda"
import resolve from "rollup-plugin-node-resolve"
import rollupTypesript from "rollup-plugin-typescript2"

const pkg = require("./package.json")
const external = F.keys(F.omit(["lodash-es"], pkg.dependencies))

export default {
  input: "source/Main.ts",
  plugins: [rollupTypesript({ clean: true }), resolve()],
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
