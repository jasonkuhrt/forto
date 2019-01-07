/**
 * - node-resolve plugin is required by ts plugin
 */

import * as F from "ramda"
import pluginResolve from "rollup-plugin-node-resolve"
import pluginTypescript from "rollup-plugin-typescript2"

const pkg = require("./package.json")
const external = F.keys(F.omit(["lodash-es"], pkg.dependencies))

export default {
  input: "source/Main.ts",
  plugins: [pluginTypescript({ clean: true }), pluginResolve()],
  external,
  output: [
    {
      file: pkg.main,
      format: "umd",
      name: pkg.name,
      sourcemap: true,
      globals: {
        tslib: "tslib",
        "zen-observable": "Observable",
        "element-resize-detector": "ElementResizeDetector",
        "lodash.isequal": "isEqual",
      },
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
  ],
}
