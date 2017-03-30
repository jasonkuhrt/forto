const Path = require("path")

const path = Path.join.bind(null, __dirname)

module.exports = {
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
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
}
