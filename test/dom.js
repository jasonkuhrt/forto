/* eslint-disable */
import Dom from "../source/dom"
import F from "ramda"
import * as FRP from "most"

FRP.Stream.prototype.collect = function (n) {
  return this.take(n).reduce(
    (acc, x) => { acc.push(x); return acc },
    []
  )
}
FRP.Stream.prototype.collectAll = function () {
  return this.reduce(
    (acc, x) => { acc.push(x); return acc },
    []
  )
}

const makeDiv = () =>
  document.createElement("div")

const makePixel = () => {
  const el = makeDiv()
  Object.assign(el.style, {
    width: "1px",
    height: "1px",
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
    left: "0px"
  },
  tip: {
    width: "0px",
    height: "0px",
    position: "absolute",
    top: "0px",
    left: "0px"
  },
}



const temporary = makeDiv()

before(() => {
  temporary.id = "temporary"
  document.body.appendChild(temporary)
  F.mapObjIndexed(
    (el, name) => {
      if (name === "target") {
        arrangement.frame.appendChild(el)
      } else {
        document.body.appendChild(el)
      }
    },
    arrangement
  )
})

beforeEach(() => {
  window.scrollTo(0,0)
  F.forEachObjIndexed(
    (styles, name) => {
      Object.assign(arrangement[name].style, styles)
    },
    arrStyles
  )
})

afterEach(() => {
  document.body.querySelector("#temporary").innerHTML = ""
})

const makeLayoutStream = () => (
  FRP
  .from(Dom.observe(arrangement))
  .skip(4) // Initial binding fires element resize events
)

describe("observeDomEvent", () => {
  it("observing element resize event fires event upon initial subscribing", () => {
    const el = makeDiv()
    temporary.appendChild(el)
    const stream = Dom.observeDomEvent("resize", el)
    return FRP
      .from(stream)
      .collect(1)
      .then(([el2]) => {
        Assert(el === el2)
      })
  })
  it("can re-observe", () => {
    let el = makeDiv()
    temporary.appendChild(el)
    const stream = Dom.observeDomEvent("resize", el)
    return FRP
      .from(stream)
      .take(1)
      .drain()
      .then(() => {
        const stream2 = Dom.observeDomEvent("resize", el)
        return FRP
          .from(stream2)
          .take(1)
          .drain()
      })
  })
})



it("accepts an arrangement, returns an observable", () => {
  const observable = Dom.observe(arrangement)
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
  const promise = FRP
    .from(Dom.observeWithPolling(1000, arrangement))
    .skip(4) // Initial binding fires element resize events
    .collect(1)
  arrangement.frame.insertBefore(makePixel(), arrangement.target)
  return promise
})

it("if position change of frame there is a change event", () => {
  const promise = FRP
    .from(Dom.observeWithPolling(1000, arrangement))
    .skip(4) // Initial binding fires element resize events
    .collect(1)
  document.body.insertBefore(makePixel(), arrangement.frame)
  return promise
})

// Test that changes in position of arrangement elements do not trigger a
// change if using normal event based observation (as opposed to not using
// poll-based observation).
it("if position change there is no change event, via frame")
it("if position change there is no change event, via target")
it("if position change there is no change event, via popover")
it("if position change there is no change event, via tip")

it("if frame can and does scroll a new layout is calculated")
it("the frame can be the window instead of an element")
