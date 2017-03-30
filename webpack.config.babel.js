import Path from "path"

const path = Path.join.bind(null, __dirname)

export default {
  entry: [
    "./source/Main.js",
    "./test/dom.js",
  ],
  output: {
    filename: "[name].js",
    path: path("./build")
  },
  module: {
    rules: [
      {
        test: /.*\.js$/,
        loader: "babel-loader"
      }
    ]
  }
}
