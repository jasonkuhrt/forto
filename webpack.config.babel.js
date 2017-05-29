const Path = require("path")

const path = Path.join.bind(null, __dirname)

export default {
  entry: ["./source/Main.js", "./test/Main.js"],
  output: {
    filename: "[name].js",
    path: path("./build"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
}
