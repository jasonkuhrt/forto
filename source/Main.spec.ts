import * as B from "./BoundingBox"
import * as Forto from "./Main"
import * as Ori from "./Ori"
import * as Settings from "./Settings"
import * as F from "./Prelude"

// TODO Property Test ideas
// * When measuring zones, the zones along an orientation always have the
//   same cross-length.

describe("measureZones", () => {
  it("calculates the size of four zones between Target and Frame", () => {
    const frame = B.make(110, 110)
    const target = B.translate(50, 50, B.make(10, 10))
    expect(Forto.measureZones(target, frame)).toEqual([
      { side: Ori.Side.Top, width: 110, height: 50 },
      { side: Ori.Side.Bottom, width: 110, height: 50 },
      { side: "Left", width: 50, height: 110 },
      { side: "Right", width: 50, height: 110 },
    ])
  })

  it("if target exceeds a frame side, zones of that side have a negative main-length", () => {
    const frame = B.make(10, 10)
    const target1 = B.translate(-1, -1, B.make(2, 2))
    expect(Forto.measureZones(target1, frame)).toEqual([
      { side: Ori.Side.Top, width: 10, height: -1 },
      { side: Ori.Side.Bottom, width: 10, height: 9 },
      { side: "Left", width: -1, height: 10 },
      { side: "Right", width: 9, height: 10 },
    ])
    const target2 = B.translate(9, 9, B.make(2, 2))
    expect(Forto.measureZones(target2, frame)).toEqual([
      { side: Ori.Side.Top, width: 10, height: 9 },
      { side: Ori.Side.Bottom, width: 10, height: -1 },
      { side: "Left", width: 9, height: 10 },
      { side: "Right", width: -1, height: 10 },
    ])
  })
})

describe("calcFit", () => {
  const zone = { side: Ori.Side.Top, width: 50, height: 50 }

  it("returns percentage area remaining of zone", () => {
    const popover = B.make(25, 25)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone).areaPercentageRemaining).toEqual(
      0.75,
    )
  })

  it("returns percentage area remaining of zone even if popover exceeds bounds", () => {
    const popover = B.make(100, 40)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone).areaPercentageRemaining).toEqual(
      0.2,
    )
  })

  it("returns percentage area remaining never lower than 0", () => {
    const popover = B.make(50, 50)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone).areaPercentageRemaining).toEqual(0)
  })

  it("returns percentage area remaining never lower than 0 even if popover exceeds bounds", () => {
    const popover = B.make(100, 100)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone).areaPercentageRemaining).toEqual(0)
  })

  it("returns percentage area of popover that would be cropped", () => {
    const popover = B.make(25, 50)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone)).toEqual({
      ...zone,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.5,
    })
  })

  describe("returns negative if popover cropped", () => {
    it("width", () => {
      const popover = B.make(10 + 90, 10)
      const tip = B.make(0, 0)
      expect(Forto.calcFit(popover, tip, zone).popoverNegAreaPercent).toEqual(
        0.5,
      )
    })
    it("height", () => {
      const popover = B.make(10, 10 + 90)
      const tip = B.make(0, 0)
      expect(Forto.calcFit(popover, tip, zone).popoverNegAreaPercent).toEqual(
        0.5,
      )
    })
    it("width/height", () => {
      const popover = B.make(10 + 90, 10 + 90)
      const tip = B.make(0, 0)
      expect(Forto.calcFit(popover, tip, zone).popoverNegAreaPercent).toEqual(
        0.75,
      )
    })
  })
  it("if zone size is 0 then returns 100 percent cropped", () => {
    const zone2 = { ...zone, width: 0, height: 0 }
    const popover = B.make(10, 10)
    const tip = B.make(0, 0)
    expect(Forto.calcFit(popover, tip, zone2).popoverNegAreaPercent).toEqual(1)
  })

  describe("measures the bounding-box around popover + tip's main-length added to main-axis", () => {
    it("cropped height", () => {
      const popover = B.make(1, 1 + 90)
      const tip = B.make(1, 9)
      expect(Forto.calcFit(popover, tip, zone).popoverNegAreaPercent).toEqual(
        0.5,
      )
    })

    it("cropped width", () => {
      const zone2 = { ...zone, side: Ori.Side.Right }
      const popover = B.make(1 + 90, 1)
      const tip = B.make(1, 9)
      expect(Forto.calcFit(popover, tip, zone2).popoverNegAreaPercent).toEqual(
        0.5,
      )
    })
  })
})

describe("rankZones", () => {
  const b: Forto.Zone = {
    side: Ori.Side.Bottom,
    width: 100,
    height: 100,
    areaPercentageRemaining: 100,
    popoverNegAreaPercent: 0,
  }
  const t: Forto.Zone = {
    side: Ori.Side.Top,
    width: 50,
    height: 50,
    areaPercentageRemaining: 100,
    popoverNegAreaPercent: 0,
  }
  const test = (zoneFits: Forto.Zone[], zoneFitsRanked: Forto.Zone[]) => {
    expect(
      Forto.rankZones(Settings.checkAndNormalize({}), zoneFits, null),
    ).toEqual(zoneFitsRanked)
  }
  it("should rank second-class lower than first-class even if smaller area", () => {
    const $b = { ...b, popoverNegAreaPercent: 1 }
    test([$b, t], [t, $b])
  })
  it("should rank larger areas higher amongst first-class", () => {
    test([t, b], [b, t])
  })
  it("should rank larger areas higher amongst equal second-class", () => {
    const $b = { ...b, popoverNegAreaPercent: 1 }
    const $t = { ...t, popoverNegAreaPercent: 1 }
    test([$t, $b], [$b, $t])
  })
  it("should rank less negative higher amongst non-equal second-classe", () => {
    const $b = { ...b, popoverNegAreaPercent: 10 }
    const $t = { ...t, popoverNegAreaPercent: 1 }
    test([$b, $t], [$t, $b])
  })
  it("if two zones are of equal worth maintain their existing order", () => {
    const $b: Forto.Zone = {
      side: Ori.Side.Bottom,
      width: 1,
      height: 1,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 100,
    }
    const $t: Forto.Zone = {
      side: Ori.Side.Top,
      width: 2,
      height: 2,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 100,
    }
    const $r: Forto.Zone = {
      side: Ori.Side.Right,
      width: 2,
      height: 2,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 100,
    }
    const $l: Forto.Zone = {
      side: Ori.Side.Left,
      width: 2,
      height: 2,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 100,
    }
    const zoneFits = [$b, $t, $l, $r]
    test(zoneFits, zoneFits)
  })
})

describe("rankZones with preference", () => {
  const b: Forto.Zone = {
    side: Ori.Side.Bottom,
    width: 100,
    height: 100,
    popoverNegAreaPercent: 1,
    areaPercentageRemaining: 100,
  }
  const t: Forto.Zone = {
    side: Ori.Side.Top,
    width: 50,
    height: 50,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  }
  const test = (
    zoneFits: Forto.Zone[],
    preferredZones: Forto.Settings.SidesShorthand[],
    zoneFitsRanked: Forto.Zone[],
  ) => {
    expect(
      Forto.rankZones(
        Settings.checkAndNormalize({ preferredZones }),
        zoneFits,
        null,
      ),
    ).toEqual(zoneFitsRanked)
  }
  it("if mixed classes, if single pref in second-class, still rank first-class better", () => {
    test([b, t], [Ori.Side.Bottom], [t, b])
  })
  it("if mixed classes, if multiple prefs in mixed classes, then ignore prefs of second class and rank preferred first class best even if not greatest area", () => {
    const $b: Forto.Zone = { ...b, popoverNegAreaPercent: 0 }
    const $t: Forto.Zone = { ...b, popoverNegAreaPercent: 1 }
    const l: Forto.Zone = {
      side: Forto.Ori.Side.Left,
      width: 200,
      height: 200,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 100,
    }
    test([$b, $t, l], [Ori.Side.Top, Ori.Side.Bottom], [$b, l, $t])
  })
  it("if first classes, if single pref in first class then it should be ranked highest even if not greatest area", () => {
    const $b = { ...b, popoverNegAreaPercent: 0 }
    test([$b, t], [Ori.Side.Top], [t, $b])
  })
  it("if first classes, if multiple prefs in first class, rank best pref that with greatest area", () => {
    const $b = { ...b, popoverNegAreaPercent: 0 }
    test([t, $b], [Ori.Side.Top, Ori.Side.Bottom], [$b, t])
  })
  it("if second classes, if single pref in second class, then it should be ranked highest even if not least cropped area", () => {
    const $t = { ...t, popoverNegAreaPercent: 1 }
    const $b = { ...b, popoverNegAreaPercent: 2 }
    test([$b, $t], [Ori.Side.Top], [$t, $b])
  })
  it("if second classes, if multiple prefs in second class, rank best pref that with least crop area", () => {
    const $t = { ...t, popoverNegAreaPercent: 1 }
    const $b = { ...b, popoverNegAreaPercent: 2 }
    test([$b, $t], [Ori.Side.Top, Ori.Side.Bottom], [$t, $b])
  })
})

describe("rankZones with preference up to thrshold", () => {
  const b: Forto.Zone = {
    side: Ori.Side.Bottom,
    width: 10,
    height: 10,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  }
  const t: Forto.Zone = {
    side: Ori.Side.Top,
    width: 10,
    height: 5,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  }
  const test = (
    zoneFits: Forto.Zone[],
    preferredZones: Forto.Settings.SidesShorthand[],
    preferZoneUntilPercentWorse: number,
    zoneFitsRanked: Forto.Zone[],
  ) => {
    expect(
      Forto.rankZones(
        Settings.checkAndNormalize({
          preferredZones,
          preferZoneUntilPercentWorse,
        }),
        zoneFits,
        null,
      ),
    ).toEqual(zoneFitsRanked)
  }
  it("preference is taken if better than alternatives", () => {
    test([b, t], [Ori.Side.Top], 0.49, [t, b])
  })
  it("preference is not taken if worse than an alternative by equal to or greater than threshold", () => {
    test([b, t], [Ori.Side.Top], 0.5, [b, t])
  })
  it("given threshold has no effect between selecting two preferences", () => {
    test([t, b], [Ori.Side.Top, Ori.Side.Bottom], 0.9, [b, t])
  })
  it("threshold preference does not override class boundry", () => {
    const $b = { ...b, popoverNegAreaPercent: 1 }
    test([$b, t], [Ori.Side.Bottom], 1, [t, $b])
  })
  it("preference threshold amongst class 2 zones both prefered ranks by least cropped", () => {
    const $b = { ...b, popoverNegAreaPercent: 30 }
    const $t = { ...t, popoverNegAreaPercent: 20 }
    test([$b, $t], [Ori.Side.Bottom, Ori.Side.Top], 0.9, [$t, $b])
  })
  it("preference threshold amongst class 2 zones, one prefered, picks preference when within threshold", () => {
    const $b = { ...b, popoverNegAreaPercent: 30 }
    const $t = { ...t, popoverNegAreaPercent: 20 }
    test([$t, $b], [Ori.Side.Bottom], 0.9, [$b, $t])
  })
  it("preference threshold amongst class 2 zones, one prefered, ignores preference when gte threshold", () => {
    const $b = { ...b, popoverNegAreaPercent: 50 }
    const $t = { ...t, popoverNegAreaPercent: 25 }
    test([$b, $t], [Ori.Side.Bottom], 0.5, [$t, $b])
  })
})

describe("optimalZone (elligible unspecified)", () => {
  const arrangement = {
    frame: B.make(110, 110),
    target: B.translate(50, 10, B.make(10, 10)),
    popover: B.make(9, 9),
    tip: B.make(1, 1),
  }
  const optimalZone: any = Forto.optimalZone.bind(null, {
    elligibleZones: null,
  } as any)

  it("should return the optimal zone", () => {
    expect(optimalZone(arrangement)).toEqual({
      side: Ori.Side.Bottom,
      height: 90,
      width: 110,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.99,
    })
  })
  // TODO test that optimal zone given a previous zone side and zone threshold setting will honour the
})

describe("optimalZone (elligible specified)", () => {
  const arrangement = {
    frame: B.make(110, 110),
    target: B.translate(50, 10, B.make(10, 10)),
    popover: B.make(9, 9),
    tip: B.make(1, 1),
  }

  it("should only return a single possible zone if elligible choice is singular", () => {
    const zone = Forto.optimalZone(
      Settings.checkAndNormalize({ elligibleZones: [Ori.Side.Top] }),
      arrangement,
      null,
    )
    expect(zone).toEqual({
      side: Ori.Side.Top,
      height: 10,
      width: 110,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.92,
    })
  })

  it("should return optimal zone within those elligible", () => {
    const zone = Forto.optimalZone(
      Settings.checkAndNormalize({
        elligibleZones: [Ori.Side.Top, Ori.Side.Bottom],
      }),
      arrangement,
      null,
    )
    expect(zone).toEqual({
      side: Ori.Side.Bottom,
      height: 90,
      width: 110,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.99,
    })
  })
})

describe("calcPopoverPosition (bounded)", () => {
  const settings: Forto.Settings.Settings = {
    isBounded: true,
    zoneChangeThreshold: 0,
    elligibleZones: null,
    preferredZones: null,
    preferZoneUntilPercentWorse: null,
    tipSize: 0,
  }
  const frame = B.make(400, 400)
  const target = B.translate(200, 100, B.make(10, 10))
  const zone: Forto.Zone = {
    side: Ori.Side.Bottom,
    height: 100,
    width: 400,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  }

  it("moves popover of less cross-length than target to match its cross-axis to target", () => {
    const popover = B.make(6, 6)
    expect(
      Forto.calcPopoverPosition(settings, frame, target, popover, null, zone),
    ).toEqual({
      x: 202,
      y: 100 + 10,
    })
  })

  it("moves popover of greater cross-length than target to match its cross-axis to target", () => {
    const popover = B.make(12, 12)
    expect(
      Forto.calcPopoverPosition(settings, frame, target, popover, null, zone),
    ).toEqual({
      x: 199,
      y: 100 + 10,
    })
  })

  // Test Popover position when frame bounds would be crossed

  it("popover can meet but not exceed frame end bounds to match cross-axis", () => {
    const target2 = B.translate(400 - 10, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 400 - 20,
      y: 100 + 10,
    })
  })
  it("popover can meet but not exceed frame start bounds to match cross-axis", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 0,
      y: 100 + 10,
    })
  })
  it("if popover does not fit within frame cross-length then center it within frame", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(400 + 10, 10)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: (-1 * 10) / 2,
      y: 100 + 10,
    })
  })

  // Test cross axis matching when target exceeds bounds

  it("does not include cropped cross end of target when calculating targets cross-axis", () => {
    const target2 = B.translate(380, 100, B.make(30, 30))
    const popover = B.make(10, 10)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 385,
      y: 100 + 30,
    })
  })
  it("does not include cropped cross start of target when calculating targets cross-axis", () => {
    const target2 = B.translate(-10, 100, B.make(30, 30))
    const popover = B.make(10, 10)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 5,
      y: 100 + 30,
    })
  })
  it("does not include cropped cross start+end of target when calculating targets cross-axis", () => {
    const target2 = B.translate(-10, 100, B.make(420, 10))
    const popover = B.make(10, 10)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 200 - 5,
      y: 100 + 10,
    })
  })
})

describe("calcPopoverPosition (unbounded)", () => {
  const settings: Forto.Settings.Settings = {
    isBounded: false,
    zoneChangeThreshold: 0,
    elligibleZones: null,
    preferredZones: null,
    preferZoneUntilPercentWorse: null,
    tipSize: 0,
  }
  const frame = B.make(400, 400)
  const zone: Forto.Zone = {
    side: Ori.Side.Bottom,
    height: 100,
    width: 400,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  }

  it("popover can exceed frame end bounds to match cross-axis", () => {
    const target2 = B.translate(400 - 10, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: 400 - 15,
      y: 100 + 10,
    })
  })
  it("popover can exceed frame start bounds to match cross-axis", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: -5,
      y: 100 + 10,
    })
  })
  it("if popover does not fit within frame cross-length then center it within frame", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(400 + 10, 10)
    expect(
      Forto.calcPopoverPosition(settings, frame, target2, popover, null, zone),
    ).toEqual({
      x: -200,
      y: 100 + 10,
    })
  })
})

describe("calcTipPosition", () => {
  type Scenarios = {
    zone: Forto.Zone
    givenPopoverPos: { x: number; y: number }
    tipPos: (
      args: { popover: B.BoundingBox; tip: B.BoundingBox },
    ) => { x: number; y: number }
  }[][]

  const zoneOf = (side: Ori.Side): Forto.Zone => ({
    side,
    // following props do not matter for test
    height: 0,
    width: 0,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 100,
  })
  const leftZone = zoneOf(Ori.Side.Left)
  const rightZone = zoneOf(Ori.Side.Right)
  // const topZone = zoneOf(Ori.Side.Top)
  // const bottomZone = zoneOf(Ori.Side.Bottom)

  const target = B.translate(200, 100, B.make(10, 10))
  const tip = B.make(8, 16)
  const tipSize = 2 // aka. > aka. w=2 h=4 (2x4) 0deg

  // it("finds centered tip position relative to popover", () => {
  //   /*
  //   PT
  //   */
  //   const target = B.translate(200, 100, B.make(10, 10))
  //   const popover = B.translate(200 - 10, 100, B.make(10, 10))
  //   const pos = Forto.calcTipPosition(zone, target, popover, tip)
  //   expect(pos).toEqual({
  //     x: popover.width,
  //     y: popover.height / 2,
  //   })
  // })

  // Very odd: these tests seem to indicate tip positioning of top-left
  // yet in the react-popover is configured for center-left origin...
  it.each([
    /*
     P
    T
    */
    [
      {
        zone: rightZone,
        givenPopoverPos: { x: 210, y: 90 },
        tipPos: ({ popover }) => ({
          x: 0,
          y: popover.height - tipSize * 2,
        }),
      },
    ],
    /*
    PT
    */
    [
      {
        zone: leftZone,
        givenPopoverPos: { x: 190, y: 100 },
        tipPos: ({ popover }) => ({
          x: popover.width,
          y: popover.height / 2 - tipSize,
        }),
      },
    ],
    /*
     T
    P
    */
    [
      {
        zone: leftZone,
        givenPopoverPos: { x: 190, y: 110 },
        tipPos: ({ popover }) => ({
          x: popover.width,
          y: 0,
        }),
      },
    ],
  ] as Scenarios)(
    "case %#: will place tip cross position to popover edge but not beyond",
    ({ zone, givenPopoverPos, tipPos }) => {
      const popover = B.translate(
        givenPopoverPos.x,
        givenPopoverPos.y,
        B.make(10, 10),
      )
      const pos = Forto.calcTipPosition(zone, target, popover, tip, tipSize)
      expect(pos).toEqual(tipPos({ popover, tip }))
    },
  )

  // it("refers to popover before/target aftert if it should", () => {
  //   /*
  //     T
  //   P
  //   */
  //   const target = B.translate(200, 100, B.make(30, 30))
  //   const popover = B.translate(200 - 30, 110, B.make(30, 30))
  //   const pos = Forto.calcTipPosition(zone, target, popover, tip)
  //   expect(pos).toEqual({
  //     x: popover.width,
  //     y: tip.height / 2, // 10
  //   })
  // })
})

describe("calcLayout", () => {
  const settingsDefault: Forto.Settings.SettingsUnchecked = {
    tipSize: 2,
  }
  const arrangementDefault: Forto.ArrangementUnchecked = {
    frame: B.make(100, 100),
    target: B.translate(90, 50, B.make(10, 10)),
    popover: B.make(10, 10),
    tip: B.make(2, 4),
  }

  it("calculates the layout start to finish", () => {
    expect(Forto.calcLayout(settingsDefault, arrangementDefault, null)).toEqual(
      {
        popover: { x: 78, y: 50 },
        tip: { x: 10, y: 3 },
        zone: {
          side: "Left",
          height: 100,
          width: 90,
          areaPercentageRemaining: 0.98,
          popoverNegAreaPercent: 0,
        },
      },
    )
  })

  type Spec = {
    targetW?: number
    targetH?: number
    popoverW?: number
    popoverH?: number
    targetX?: number
    targetY?: number
    targetPos?: [number, number]
    frameW?: number
    frameH?: number
    frameX?: number
    frameY?: number
    framePos?: [number, number]
  }

  const I = (spec: Spec = {}): Forto.ArrangementUnchecked => {
    const {
      frameH = 110,
      frameW = 110,
      frameX = 0,
      frameY = 0,
      targetH = 10,
      targetW = 10,
      popoverW = 10,
      popoverH = 10,
      targetX = 50,
      targetY = 50,
    } = spec

    const { targetPos = [targetX, targetY], framePos = [frameX, frameY] } = spec

    const popover = B.make(popoverW, popoverH)
    const target = B.make(targetW, targetH)

    const arrangement = {
      frame: B.make(frameW, frameH),
      target,
      popover,
      tip: B.make(2, 4),
    }

    arrangement.target = B.translate(
      targetPos[0],
      targetPos[1],
      arrangement.target,
    )

    arrangement.frame = B.translate(framePos[0], framePos[1], arrangement.frame)

    return arrangement
  }

  type Scenarios = [
    string,
    {
      settings?: Forto.Settings.SettingsUnchecked
      i: Forto.ArrangementUnchecked
      o: F.Omit<Forto.Calculation, "zone" | "tip">
    }
  ][]

  const scenarios: Scenarios = [
    [
      "frame offset (left zone, target TR)",
      {
        i: I({ framePos: [10, 10], frameH: 50, targetPos: [110, 10] }),
        o: { popover: { x: 100, y: 10 } },
      },
    ],
    [
      "always bounded",
      {
        settings: { boundingMode: "always" },
        i: I({ targetPos: [0, -100] }),
        o: { popover: { x: 0, y: 0 } },
      },
    ],
  ]

  it.each(scenarios)(
    "calculates the layout: %s",
    (_, { i, o, settings = {} }) => {
      const layout = Forto.calcLayout(settings, i, null)
      expect({ popover: layout.popover }).toEqual(o)
    },
  )

  it("tip is optional", () => {
    const settings = {
      ...settingsDefault,
      tipSize: null,
    }
    const arrangement = {
      ...arrangementDefault,
      tip: null,
    }
    expect(Forto.calcLayout(settings, arrangement, null)).toEqual({
      popover: { x: 80, y: 50 },
      tip: null,
      zone: {
        side: "Left",
        width: 90,
        height: 100,
        areaPercentageRemaining: 0.99,
        popoverNegAreaPercent: 0,
      },
    })
  })

  // These tests are intentionally lightweight, given we have test coverage
  // for adjustRankingForChangeThreshold
  describe("with setting zone-change-threshold", () => {
    const prevZone = Ori.Side.Top
    const arrangement = {
      frame: B.make(10, 40),
      target: B.translate(0, 11, B.make(10, 10)),
      popover: B.make(10, 10),
      tip: null,
    }

    it("upon recalc if top-ranked zone is not superior to previous zone by given threshold then remain with previous zone", () => {
      const settings = { zoneChangeThreshold: 10 }
      const layout = Forto.calcLayout(settings, arrangement, prevZone)
      expect(layout).toEqual({
        popover: { x: 0, y: 1 },
        tip: null,
        zone: {
          side: Ori.Side.Top,
          width: 10,
          height: 11,
          areaPercentageRemaining: 0.09,
          popoverNegAreaPercent: 0,
        },
      })
    })

    it("upon recalc if top-ranked zone is superior to previous zone by given threshold then change to new zone", () => {
      const settings = { zoneChangeThreshold: 1 }
      const layout = Forto.calcLayout(settings, arrangement, prevZone)
      expect(layout).toEqual({
        popover: { x: 0, y: 21 },
        tip: null,
        zone: {
          side: Ori.Side.Bottom,
          width: 10,
          height: 19,
          areaPercentageRemaining: 0.47,
          popoverNegAreaPercent: 0,
        },
      })
    })
  })
})

describe("adjustRankingForChangeThreshold", () => {
  const t = {
    side: Ori.Side.Top,
    width: 10,
    height: 10,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 0.5,
  }
  const b = {
    side: Ori.Side.Bottom,
    width: 50,
    height: 100,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 0.4,
  }

  it("if top ranked zone is class 1 and previous zone is class 2 then maintain rankings", () => {
    const zonesRanked = [t, { ...b, popoverNegAreaPercent: 5 }]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, Ori.Side.Bottom),
    ).toEqual(zonesRanked)
  })

  it("if top ranked zone is previous zone then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, Ori.Side.Top),
    ).toEqual(zonesRanked)
  })

  it("if top ranked zone is below superiority threshold for change then restore previous zone to top rank", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, Ori.Side.Bottom),
    ).toEqual([b, t])
  })

  it("if top ranked zone is greater than superiority threshold for change then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.05, zonesRanked, Ori.Side.Bottom),
    ).toEqual([t, b])
  })

  it("if top ranked zone is equal to superiority threshold for change then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.1, zonesRanked, Ori.Side.Bottom),
    ).toEqual([t, b])
  })
})
