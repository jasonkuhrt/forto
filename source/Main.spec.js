// @flow
import type { MeasuredZone } from "./Main"
import Forto from "./Main"
import B from "./BoundingBox"

// TODO Property Test ideas
// * When measuring zones, the zones along an orientation always have the
//   same cross-length.

describe("measureZones", () => {
  it("calculates the size of four zones between Target and Frame", () => {
    const frame = B.make(110,110)
    const target = B.translate(50,50,B.make(10,10))
    expect(Forto.measureZones(target, frame))
    .toMatchObject([
      { side: "Top", width: 110, height: 50 },
      { side: "Bottom", width: 110, height: 50 },
      { side: "Left", width: 50, height: 110 },
      { side: "Right", width: 50, height: 110 },
    ])
  })

  it("if target exceeds a frame side, zones of that side have a negative main-length", () => {
    const frame = B.make(10,10)
    const target1 = B.translate(-1,-1,B.make(2,2))
    expect(Forto.measureZones(target1, frame))
    .toMatchObject([
      { side: "Top", width: 10, height: -1 },
      { side: "Bottom", width: 10, height: 9 },
      { side: "Left", width: -1, height: 10 },
      { side: "Right", width: 9, height: 10 },
    ])
    const target2 = B.translate(9,9,B.make(2,2))
    expect(Forto.measureZones(target2, frame))
    .toMatchObject([
      { side: "Top", width: 10, height: 9 },
      { side: "Bottom", width: 10, height: -1 },
      { side: "Left", width: 9, height: 10 },
      { side: "Right", width: -1, height: 10 },
    ])
  })
})


describe("calcFit", () => {
  const zone : MeasuredZone = { side: "Top", width: 50, height: 50 }
  it("returns percentage area of popover that would be cropped", () => {
    const popover = B.make(10,10)
    const tip = B.make(0,0)
    expect(Forto.calcFit(popover, tip, zone))
    .toMatchObject({
      ...zone,
      popoverNegAreaPercent: 0,
    })
  })

  describe("returns negative if popover cropped", () => {
    it("width", () => {
      const popover = B.make(10 + 90,10)
      const tip = B.make(0,0)
      expect(Forto.calcFit(popover, tip, zone))
      .toMatchObject({
        ...zone,
        popoverNegAreaPercent: 0.5,
      })
    })
    it("height", () => {
      const popover = B.make(10,10 + 90)
      const tip = B.make(0,0)
      expect(Forto.calcFit(popover, tip, zone))
      .toMatchObject({
        ...zone,
        popoverNegAreaPercent: 0.5,
      })
    })
    it("width/height", () => {
      const popover = B.make(10 + 90,10 + 90)
      const tip = B.make(0,0)
      expect(Forto.calcFit(popover, tip, zone))
      .toMatchObject({
        ...zone,
        popoverNegAreaPercent: 0.75,
      })
    })
  })
  it("if zone size is 0 then returns 100 percent cropped", () => {
    const zone2 = Object.assign({}, zone, { width: 0, height: 0 })
    const popover = B.make(10,10)
    const tip = B.make(0,0)
    expect(Forto.calcFit(popover, tip, zone2))
    .toMatchObject({
      ...zone2,
      popoverNegAreaPercent: 1,
    })
  })

  describe("measures the bounding-box around popover + tip's main-length added to main-axis", () => {
    it("cropped height", () => {
      const popover = B.make(1,1 + 90)
      const tip = B.make(1,9)
      expect(Forto.calcFit(popover, tip, zone))
      .toMatchObject({
        ...zone,
        popoverNegAreaPercent: 0.5,
      })
    })
    it("cropped width", () => {
      const zone2 = Object.assign({}, zone, { side: "Right" })
      const popover = B.make(1 + 90,1)
      const tip = B.make(1,9)
      expect(Forto.calcFit(popover, tip, zone2))
      .toMatchObject({
        ...zone2,
        popoverNegAreaPercent: 0.5,
      })
    })
  })
})
