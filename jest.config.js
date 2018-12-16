module.exports = {
  verbose: true,
  preset: "jest-puppeteer-preset",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testRegex: ".*spec.ts$",
  moduleFileExtensions: ["ts", "js"],
  collectCoverage: true,
  collectCoverageFrom: ["**/source/**/*.ts"],
  globals: {
    "ts-jest": {
      diagnostics: false,
      tsConfig: "tsconfig.spec.json",
    },
  },
}
