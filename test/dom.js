/* eslint-disable */
import F from "ramda"
import * as FRP from "most"
import * as Dom from "../source/dom"

const A = {
  true: x => {
    if (!x) throw new Error(`Expected ${x} to be true`)
  },
}

beforeEach(() => {
  window.scrollTo(0, 0)
  F.forEachObjIndexed((styles, name) => {
    Object.assign(arrangement[name].style, styles)
  }, arrStyles)
})

// F.mapObjIndexed((elem, elemName) => {
//   it(`if any arrangement elements' dimensions change a new layout is calculated, via ${elemName}`, () => {
//     const promise = makeLayoutStream().collect(1)
//     elem.style.width = `${parseInt(elem.style.width, 10) + 1}px`
//     return promise
//   })
// }, arrangement)

// Test that changes in position of arrangement elements trigger a change
// if using poll-based observation.

// it("if frame can and does scroll a new layout is calculated", () => {
//   const promise = FRP.from(Dom.observeWithPolling(1000, arrangement))
//     .skip(4) // Initial binding fires element resize events
//     .collect(1)
//   arrangement.frame.scrollTop = 1
//   return promise
// })

it("if window-based frame does scroll a new layout is calculated", () => {
  document.body.appendChild(makeDiv({ height: "10000px", width: "1px" }))
  const arrangement2 = {
    frame: window,
    popover: makePixel(),
    tip: makePixel(),
    target: makePixel(),
  }
  F.pipe(
    F.omit(["frame"]),
    F.values,
    F.forEach(x => document.body.appendChild(x)),
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
