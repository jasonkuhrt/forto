import babel from "rollup-plugin-babel"

const pkg = require("./package.json")
const external = Object.keys(pkg.dependencies)

const plugins = [
  babel({
    babelrc: false,
    ignore: ["node_modules/**"],
    presets: [
      [
        "es2015",
        {
          modules: false,
        },
      ],
      "stage-1",
    ],
    plugins: ["external-helpers"],
  }),
]

export default {
  entry: "source/Main.js",
  plugins,
  external,
  targets: [
    {
      dest: pkg.main,
      format: "umd",
      moduleName: pkg.name,
      sourceMap: true,
    },
    {
      dest: pkg.module,
      format: "es",
      sourceMap: true,
    },
  ],
}
