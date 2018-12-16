module.exports = {
  preset: "jest-puppeteer-preset",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testRegex: ".*spec.ts$",
  moduleFileExtensions: ["ts", "js"],
  collectCoverageFrom: ["**/source/**/*.ts", "!**/build/**/*"],
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
}
