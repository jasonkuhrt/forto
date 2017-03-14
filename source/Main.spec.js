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
    .toMatchObject({
      top: { width: 110, height: 50 },
      bottom: { width: 110, height: 50 },
      left: { width: 50, height: 110 },
      right: { width: 50, height: 110 },
    })
  })

  it("if target exceeds a frame side, zones of that side have a negative main-length", () => {
    const frame = B.make(10,10)
    const target1 = B.translate(-1,-1,B.make(2,2))
    expect(Forto.measureZones(target1, frame))
    .toMatchObject({
      top: { width: 10, height: -1 },
      bottom: { width: 10, height: 9 },
      left: { width: -1, height: 10 },
      right: { width: 9, height: 10 },
    })
    const target2 = B.translate(9,9,B.make(2,2))
    expect(Forto.measureZones(target2, frame))
    .toMatchObject({
      top: { width: 10, height: 9 },
      bottom: { width: 10, height: -1 },
      left: { width: 9, height: 10 },
      right: { width: -1, height: 10 },
    })
  })
})
