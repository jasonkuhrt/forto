/* eslint-disable */
import F from "ramda"
import * as FRP from "most"
import * as Dom from "../source/dom"

const A = {
  true: x => {
    if (!x) throw new Error(`Expected ${x} to be true`)
  }
}

FRP.Stream.prototype.collect = function(n) {
  return this.take(n).reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}
FRP.Stream.prototype.collectAll = function() {
  return this.reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

const makeDiv = style => {
  const el = document.createElement("div")
  if (style) {
    Object.assign(el.style, style)
  }
  return el
}

const makePixel = () => {
  const el = makeDiv()
  Object.assign(el.style, {
    width: "1px",
    height: "1px"
  })
  return el
}

const arrangement = {
  target: makeDiv(),
  frame: makeDiv(),
  popover: makeDiv(),
  tip: makeDiv()
}
const arrStyles = {
  frame: {
    width: "100px",
    height: "100px",
    overflow: "auto"
  },
  target: {
    width: "10px",
    height: "10px"
  },
  popover: {
    width: "4px",
    height: "4px",
    position: "absolute",
    top: "0px",
    left: "0px"
  },
  tip: {
    width: "0px",
    height: "0px",
    position: "absolute",
    top: "0px",
    left: "0px"
  }
}

const temporary = makeDiv()

before(() => {
  temporary.id = "temporary"
  document.body.appendChild(temporary)

  document.body.appendChild(arrangement.frame)
  document.body.appendChild(arrangement.popover)
  document.body.appendChild(arrangement.tip)
  arrangement.frame.appendChild(arrangement.target)
  /* Force a scroll on frame */
  const divThatIsTall = makeDiv()
  divThatIsTall.id = "tallDiv"
  Object.assign(divThatIsTall.style, {
    width: "1px",
    height: arrangement.frame.offsetHeight + 1000 + "px"
  })
  arrangement.frame.appendChild(divThatIsTall)
})

beforeEach(() => {
  window.scrollTo(0, 0)
  F.forEachObjIndexed((styles, name) => {
    Object.assign(arrangement[name].style, styles)
  }, arrStyles)
})

afterEach(() => {
  document.body.querySelector("#temporary").innerHTML = ""
})

const makeLayoutStream = () => FRP.from(Dom.observe({}, arrangement)).skip(4) // Initial binding fires element resize events

describe("observeDomEvent", () => {
  it("observing element resize event fires event upon initial subscribing", () => {
    const el = makeDiv()
    temporary.appendChild(el)
    const stream = Dom.observeDomEvent("resize", el)
    return FRP.from(stream).collect(1).then(([el2]) => {
      Assert(el === el2)
    })
  })
  it("can re-observe", () => {
    let el = makeDiv()
    temporary.appendChild(el)
    const stream = Dom.observeDomEvent("resize", el)
    return FRP.from(stream).take(1).drain().then(() => {
      const stream2 = Dom.observeDomEvent("resize", el)
      return FRP.from(stream2).take(1).drain()
    })
  })
})

it("accepts an arrangement, returns an observable", () => {
  const observable = Dom.observe({}, arrangement)
  Assert(observable.subscribe, "has .subscribe")
})

F.mapObjIndexed((elem, elemName) => {
  it(`if any arrangement elements' dimensions change a new layout is calculated, via ${elemName}`, () => {
    const promise = makeLayoutStream().collect(1)
    elem.style.width = `${parseInt(elem.style.width, 10) + 1}px`
    return promise
  })
}, arrangement)

// Test that changes in position of arrangement elements trigger a change
// if using poll-based observation.

it("if position change of target there is a change event", () => {
  const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
    .skip(4) // Initial binding fires element resize events
    .collect(1)
  arrangement.frame.insertBefore(makePixel(), arrangement.target)
  return promise
})

it("if position change of frame there is a change event", () => {
  const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
    .skip(4) // Initial binding fires element resize events
    .collect(1)
  document.body.insertBefore(makePixel(), arrangement.frame)
  return promise
})

it("if frame can and does scroll a new layout is calculated", () => {
  const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
    .skip(4) // Initial binding fires element resize events
    .collect(1)
  arrangement.frame.scrollTop = 1
  return promise
})

it("if window-based frame does scroll a new layout is calculated", () => {
  document.body.appendChild(makeDiv({ height: "10000px", width: "1px" }))
  const arrangement2 = {
    frame: window,
    popover: makePixel(),
    tip: makePixel(),
    target: makePixel()
  }
  F.pipe(
    F.omit(["frame"]),
    F.values,
    F.forEach(x => document.body.appendChild(x))
  )(arrangement2)
  const promise = FRP.from(Dom.observe({}, arrangement2))
    .skip(3) // Initial binding fires element resize events
    .collect(1)
  arrangement2.frame.scrollBy(0, 100)
  return promise
})

it("a new zone will be assigned if it becomes the new best fit", () => {
  const a = arrangement
  const promise = FRP.from(Dom.observe({}, a))
    .skip(3) // Initial binding fires element resize events
    .collect(2)
    .then(([r1, r2]) => {
      A.true(r1.zone.side === "Bottom")
      A.true(r2.zone.side === "Right")
    })
  setTimeout(() => {
    a.target.style.height = "80px"
  }, 10)
  return promise
})

it("if ZCT set, does not change zone unless good enough", () => {
  const a = arrangement
  a.popover.style.height = "50px"
  a.popover.style.width = "50px"
  // In this test zone-right is an improvement of 22% therefore not meeting the
  // threshold set below and therefore preventing Forto from changing the
  // popover's zone.
  const promise = FRP.from(Dom.observe({ zoneChangeThreshold: 0.23 }, a))
    .skip(3) // Initial binding fires element resize events
    .collect(2)
    .then(([r1, r2]) => {
      A.true(r1.zone.side === "Bottom")
      A.true(r2.zone.side === "Bottom")
    })
  setTimeout(() => {
    a.target.style.height = "50px"
  }, 10)
  return promise
})
