import Par from "parcel-bundler"
import * as Path from "path"
import FS from "fs"
import CP from "child_process"

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
      Path.join(__dirname, "../dist/puppeteer.setup.js"),
      "utf8",
    ),
  })

  await page.setViewport({ width: 1920, height: 1080 })

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

    const initArrangement = () => {
      const arrangement: Dom.Arrangement = {
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

      F.forEachObjIndexed((styles, name) => {
        Object.assign(arrangement[name].style, styles)
      }, arrangementStyles)

      return arrangement
    }

    const resetDOM = () => {
      document.body.innerHTML = ""
      window.scrollTo(0, 0)
    }

    const makeLayoutStream = arrangement =>
      FRP.from(Dom.observe({}, arrangement)).skip(4) // Initial binding fires element resize events

    // Expose globals
    window.resetDOM = resetDOM
    window.initArrangement = initArrangement
    window.makeLayoutStream = makeLayoutStream
    window.arrangementStyles = arrangementStyles
  })
})

beforeEach(async () => {
  await page.evaluate(() => {
    resetDOM()
  })
})

describe("observeDomEvent", () => {
  it("observing element resize event fires event upon initial subscribing", async () => {
    const { el, el2 } = await page.evaluate(() => {
      const el = H.makeDiv()
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
      let el = H.makeDiv()
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
    const arrangement = initArrangement()
    const o = Dom.observe({}, arrangement)
    return typeof o.subscribe
  })
  expect(subscribeType).toEqual("function")
})

it(`if any arrangement elements' dimensions change a new layout is calculated`, async () => {
  await page.evaluate(() => {
    const arrangement = initArrangement()
    const promise = makeLayoutStream(arrangement).collect(1)
    setTimeout(() => {
      H.incWidth(1, arrangement.target)
    }, 1000)
    return promise
  })
})

it("if position change of target there is a change event", async () => {
  await page.evaluate(() => {
    const arrangement = initArrangement()
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
      .skip(4) // Initial binding fires element resize events
      .collect(1)
    arrangement.frame.insertBefore(H.makePixel(), arrangement.target)
    return promise
  })
})

it("if position change of frame there is a change event", async () => {
  await page.evaluate(() => {
    const arrangement = initArrangement()
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
      .skip(4) // Initial binding fires element resize events
      .collect(1)
    document.body.insertBefore(H.makePixel(), arrangement.frame)
    return promise
  })
})

describe("if any arrangement elements' dimensions change a new layout is calculated", () => {
  beforeEach(async () => {
    await page.evaluate(() => {
      window.testForElement = (elemName: string): Promise => {
        const arrangement = initArrangement()
        const promise = makeLayoutStream(arrangement).collect(1)
        H.incWidth(1, arrangement[elemName])
        return promise
      }
    })
  })
  it(`via change of frame`, async () => {
    await page.evaluate(() => {
      return testForElement("frame")
    })
  })
  it(`via change of popover`, async () => {
    await page.evaluate(() => {
      return testForElement("popover")
    })
  })
  it(`via change of target`, async () => {
    await page.evaluate(() => {
      return testForElement("target")
    })
  })
  it(`via change of tip`, async () => {
    await page.evaluate(() => {
      return testForElement("tip")
    })
  })
})

// Test that changes in position of arrangement elements trigger a change
// if using poll-based observation.

it("if frame can scroll, and does scroll, a new layout is calculated", async () => {
  await page.evaluate(() => {
    const arrangement = initArrangement()
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
      .skip(4) // Initial binding fires element resize events
      .collect(1)
    arrangement.frame.scrollTop = 100
    return promise
  })
})

it("if frame is window, and frame scrolls, a new layout is calculated", async () => {
  await page.evaluate(() => {
    document.body.appendChild(
      H.makeDiv({ style: { height: "10000px", width: "1px" } }),
    )

    const a = {
      frame: window,
      popover: H.makePixel(),
      tip: H.makePixel(),
      target: H.makePixel(),
    }

    F.pipe(
      F.omit(["frame"]),
      F.values,
      F.forEach(x => document.body.appendChild(x)),
    )(a)

    const promise = FRP.from(Dom.observe({}, a))
      // Initial binding fires element resize events
      // window does not fire
      .skip(3)
      .collect(1)

    // Do a scroll that should trigger layout recalculation
    a.frame.scrollBy(0, 100)

    return promise
  })
})

it("a new zone will be assigned if it becomes the new best fit", async () => {
  const [r1, r2] = await page.evaluate(() => {
    const arrangement = initArrangement()
    setTimeout(() => {
      arrangement.target.style.height = "80px"
    }, 10)

    // Initial binding fires element resize events that we do not care about
    // The second eventn will be triggered by the height resize above
    return FRP.from(Dom.observe({}, arrangement))
      .skip(3)
      .collect(2)
  })
  // Check that we went from one zone to another
  expect(r1.zone.side).toBe("Bottom")
  expect(r2.zone.side).toBe("Right")
})

it("if ZCT set, does not change zone unless good enough", async () => {
  const [r1, r2] = await page.evaluate(() => {
    setTimeout(() => {
      a.target.style.height = "50px"
    }, 10)
    const a = initArrangement()
    a.popover.style.height = "50px"
    a.popover.style.width = "50px"
    // In this test zone-right is an improvement but does not exceed
    // the threshold
    return FRP.from(Dom.observe({ zoneChangeThreshold: 0.45 }, a))
      .skip(3) // Initial binding fires element resize events
      .collect(2)
  })
  expect(r1.zone.side).toEqual("Bottom")
  expect(r2.zone.side).toEqual("Bottom")
})
