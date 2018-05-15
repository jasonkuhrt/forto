// import * as F from "ramda"
// import * as Pup from "puppeteer"
// import * as Main from "./Main"
// import * as TH from "../test/Helpers"
// import * as Dom from "./Dom"

const width = 1920
const height = 1080

beforeAll(async () => {
  page.on("console", msg => {
    for (const arg of msg.args()) {
      console.log(arg._remoteObject)
      console.log(`${arg}`)
    }
  })

  await page.addScriptTag({
    path: "./dist/config.js",
  })

  await page.setViewport({ width, height })

  await page.evaluate(() => {
    const arrangementStyles = {
      frame: {
        width: "100px",
        height: "100px",
        overflow: "auto",
      },
      target: {
        width: "10px",
        height: "10px",
      },
      popover: {
        width: "4px",
        height: "4px",
        position: "absolute",
        top: "0px",
        left: "0px",
      },
      tip: {
        width: "0px",
        height: "0px",
        position: "absolute",
        top: "0px",
        left: "0px",
      },
    }

    let arrangement: Dom.Arrangement = {
      target: H.makeDiv(),
      frame: H.makeDiv(),
      popover: H.makeDiv(),
      tip: H.makeDiv(),
    }

    document.body.appendChild(arrangement.frame)
    document.body.appendChild(arrangement.popover)
    document.body.appendChild(arrangement.tip)
    arrangement.frame.appendChild(arrangement.target)
    /* Force a scroll on frame */
    H.insertTallerChild(arrangement.frame)

    const makeLayoutStream = () =>
      FRP.from(Dom.observe({}, arrangement)).skip(4) // Initial binding fires element resize events

    const setupObserveWithPolling = () => {}

    const makePixel = () => {
      return H.makeDiv({
        style: {
          width: "1px",
          height: "1px",
        },
      })
    }

    // Expose globals
    window.makePixel = makePixel
    window.makeLayoutStream = makeLayoutStream
    window.arrangementStyles = arrangementStyles
    window.arrangement = arrangement
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

it("accepts an arrangement, returns an observable", async () => {
  const subscribeType = await page.evaluate(() => {
    const o = Dom.observe({}, arrangement)
    return typeof o.subscribe
  })
  expect(subscribeType).toEqual("function")
})

// it(`if any arrangement elements' dimensions change a new layout is calculated`, async () => {
//   const a = await page.evaluate(() => {
//     const promise = makeLayoutStream().collect(1)
//     console.log(3)
//     setTimeout(() => {
//       arrangement.target.style.width = `${parseInt(
//         arrangement.target.style.width,
//         10,
//       ) + 1}px`
//     }, 1000)
//     return promise
//   })
//   console.log(a)
// })

it("if position change of target there is a change event", async () => {
  await page.evaluate(() => {
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
      .skip(4) // Initial binding fires element resize events
      .collect(1)
    arrangement.frame.insertBefore(makePixel(), arrangement.target)
    return promise
  })
})

it("if position change of frame there is a change event", async () => {
  await page.evaluate(() => {
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
      .skip(4) // Initial binding fires element resize events
      .collect(1)
    document.body.insertBefore(makePixel(), arrangement.frame)
    return promise
  })
})

// it("if frame can and does scroll a new layout is calculated", async () => {
//   await page.evaluate(() => {
//     const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
//       .skip(4) // Initial binding fires element resize events
//       .collect(1)
//     arrangement.frame.scrollTop = 1
//     return promise
//   })
// })
