import FS from "fs"
import CP from "child_process"
import * as Path from "path"

const session = {
  it: (description: string, f: (...args: unknown[]) => any) => {
    it(description, () => {
      return page.evaluate(f)
    })
  },
}

beforeAll(async () => {
  CP.execSync("yarn build:test")

  page.on("console", msg => {
    for (const arg of msg.args()) {
      console.log(arg._remoteObject)
      console.log(`${arg}`)
    }
  })

  await page.addScriptTag({
    // path: "./dist/config.js",
    content: FS.readFileSync(
      Path.join(__dirname, "../../dist/puppeteer.setup.js"),
      "utf8",
    ),
  })
})

beforeEach(async () => {
  await page.evaluate(() => {
    resetDOM()
  })
})

describe("domEvent", () => {
  session.it(
    "observing element resize event fires event upon initial subscribing",
    () => {
      const el = H.makeDiv()
      document.body.appendChild(el)
      const stream = Observable.domEvent("resize", el)
      return FRP.from(stream)
        .collect(1)
        .then(([el2]: HTMLElement[]) => {
          expect(el).toEqual(el2)
        })
    },
  )

  session.it("can re-observe", () => {
    let el = H.makeDiv()
    document.body.appendChild(el)
    const stream = Observable.domEvent("resize", el)
    return FRP.from(stream)
      .take(1)
      .drain()
      .then(() => {
        const stream2 = Observable.domEvent("resize", el)
        return FRP.from(stream2)
          .take(1)
          .drain()
      })
  })
})
