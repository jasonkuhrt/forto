import CP from "child_process"
import FS from "fs"
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

    const makeLayoutStream = arrangement =>
      FRP.from(Dom.observe({}, arrangement))

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

session.it("accepts an arrangement, returns an observable", () => {
  const arrangement = initArrangement()
  const o = Dom.observe({}, arrangement)
  expect(typeof o.subscribe).toEqual("function")
})

session.it(
  `if any arrangement elements' dimensions change a new layout is calculated`,
  () => {
    const arrangement = initArrangement()
    const promise = makeLayoutStream(arrangement).collect(1)
    sleep(1000).then(() => {
      H.incWidth(1, arrangement.target)
    })
    return promise
  },
)

session.it("if position change of target there is a change event", () => {
  const arrangement = initArrangement()
  const promise = FRP.from(Dom.observeWithPolling(1000, arrangement)).collect(1)
  arrangement.frame.insertBefore(H.makePixel(), arrangement.target)
  return promise
})

session.it("if position change of frame there is a change event", () => {
  const arrangement = initArrangement()
  const promise = FRP.from(Dom.observeWithPolling(1000, arrangement)).collect(1)
  document.body.insertBefore(H.makePixel(), arrangement.frame)
  return promise
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
  session.it(`via change of frame`, () => {
    return testForElement("frame")
  })
  session.it(`via change of popover`, () => {
    return testForElement("popover")
  })
  session.it(`via change of target`, () => {
    return testForElement("target")
  })
  session.it(`via change of tip`, () => {
    return testForElement("tip")
  })
})

// Test that changes in position of arrangement elements trigger a change
// if using poll-based observation.

session.it(
  "if frame can scroll, and does scroll, a new layout is calculated",
  () => {
    const arrangement = initArrangement()
    const promise = FRP.from(Dom.observeWithPolling(1000, arrangement)).collect(
      1,
    )
    arrangement.frame.scrollTop = 100
    return promise
  },
)

session.it(
  "if frame is window, and frame scrolls, a new layout is calculated",
  () => {
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

    const promise = FRP.from(Dom.observe({}, a)).collect(1)

    // Do a scroll that should trigger layout recalculation
    a.frame.scrollBy(0, 100)

    return promise
  },
)

session.it("a new zone will be assigned if it becomes the new best fit", () => {
  const arrangement = initArrangement()
  setTimeout(() => {
    arrangement.target.style.height = "80px"
  }, 10)

  // Initial binding fires element resize events that we do not care about
  // The second event will be triggered by the height resize above
  return FRP.from(Dom.observe({}, arrangement))
    .collect(2)
    .then(results => {
      // Check that we went from one zone to another
      expect(results[0].zone.side).toBe("Bottom")
      expect(results[1].zone.side).toBe("Right")
    })
})

session.it("if ZCT set, does not change zone unless good enough", () => {
  sleep(10).then(() => {
    a.target.style.height = "50px"
  })
  const a = initArrangement()
  a.popover.style.height = "50px"
  a.popover.style.width = "50px"
  // In this test zone-right is an improvement but does not exceed
  // the threshold
  return FRP.from(Dom.observe({ zoneChangeThreshold: 0.45 }, a))
    .collect(1)
    .then(results => {
      expect(results[0].zone.side).toEqual("Bottom")
    })
})

describe("observeWithoutPolling", () => {
  session.it("accepts settings e.g. elligibleZones", () => {
    sleep(10).then(() => {
      a.target.style.height = "100px"
    })
    const a = initArrangement()
    return FRP.from(
      Dom.observeWithoutPolling({ elligibleZones: ["Bottom"] }, a),
    )
      .collect(1)
      .then(results => {
        expect(results[0].zone.side).toEqual("Bottom")
      })
  })
})

describe("observeWithPolling", () => {
  session.it("accepts settings e.g. elligibleZones", () => {
    sleep(10).then(() => {
      a.target.style.height = "100px"
    })
    const a = initArrangement()
    return FRP.from(
      Dom.observeWithPolling({ elligibleZones: ["Bottom"] }, a, 1),
    )
      .collect(1)
      .then(results => {
        expect(results[0].zone.side).toEqual("Bottom")
      })
  })
})

// REFACTOR tests for this observe and almost copy-paste of tests
// for observeWithoutPollig and observeWithPolling. Just the function
// name is different.
describe("observe", () => {
  session.it("can be used without polling", () => {
    sleep(10).then(() => {
      a.target.style.height = "100px"
    })
    const a = initArrangement()
    return FRP.from(Dom.observe({ elligibleZones: ["Bottom"] }, a))
      .collect(1)
      .then(results => {
        expect(results[0].zone.side).toEqual("Bottom")
      })
  })

  session.it("can be used with polling", () => {
    sleep(10).then(() => {
      a.target.style.height = "100px"
    })
    const a = initArrangement()
    return FRP.from(
      Dom.observe({ pollIntervalMs: 1, elligibleZones: ["Bottom"] }, a),
    )
      .collect(1)
      .then(results => {
        expect(results[0].zone.side).toEqual("Bottom")
      })
  })
})
