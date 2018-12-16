const F = require("lodash")
const baseConfig = require("./jest.config.js")

const config = F.cloneDeep(baseConfig)

// Remove puppeteer preset
delete config.preset

config.testPathIgnorePatterns = [".*DOM.*"]

module.exports = config
