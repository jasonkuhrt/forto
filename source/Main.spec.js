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
  const popover = B.make(9,9)
  const tip = B.make(1,1)
  const zone = { side: "top", width: 100, height: 50 }
  it("returns percentage area of popover that would be cropped", () => {
    expect(Forto.calcFit(popover, tip, zone))
    .toMatchObject({
      ...zone,
      popoverNegAreaPercent: 0,
    })
  })
})
