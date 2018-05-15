// import * as F from "ramda"
// import * as Pup from "puppeteer"
// import * as Main from "./Main"
// import * as TH from "../test/Helpers"
// import * as Dom from "./Dom"

const width = 1920
const height = 1080

beforeAll(async () => {
  await page.addScriptTag({
    path: "./dist/config.js",
  })
  await page.setViewport({ width, height })
  page.on("console", msg => {
    for (const arg of msg.args()) {
      console.log(arg._remoteObject)
      console.log(`${arg}`)
    }
  })
})

// beforeEach(async () => {
//   await page.evaluate(() => {
//     window.scrollTo(0, 0)
//     F.forEachObjIndexed((styles, name) => {
//       Object.assign(arrangement[name].style, styles)
//     }, arrangementStyles)
//   })
// })

afterEach(async () => {
  await page.evaluate(() => {
    const el = document.body.querySelector("#test")
    if (el) el.remove()
  })
})

describe("observeDomEvent", () => {
  it("observing element resize event fires event upon initial subscribing", async () => {
    const { el, el2 } = await page.evaluate(() => {
      const el = H.makeDiv({ id: "test" })
      document.body.appendChild(el)
      const stream = Dom.observeDomEvent("resize", el)
      return FRP.from(stream)
        .collect(1)
        .then(([el2]: HTMLElement[]) => ({ el, el2 }))
    })
    expect(el).toEqual(el2)
  })

  it("can re-observe", async () => {
    await page.evaluate(() => {
      let el = H.makeDiv({ id: "test" })
      document.body.appendChild(el)
      const stream = Dom.observeDomEvent("resize", el)
      return FRP.from(stream)
        .take(1)
        .drain()
        .then(() => {
          const stream2 = Dom.observeDomEvent("resize", el)
          return FRP.from(stream2)
            .take(1)
            .drain()
        })
    })
  })
})
