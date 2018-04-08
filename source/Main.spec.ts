import F from "ramda"
import * as Forto from "./Main"
import * as B from "./BoundingBox"

// TODO Property Test ideas
// * When measuring zones, the zones along an orientation always have the
//   same cross-length.

describe("measureZones", () => {
  it("calculates the size of four zones between Target and Frame", () => {
    const frame = B.make(110, 110)
    const target = B.translate(50, 50, B.make(10, 10))
    expect(Forto.measureZones(target, frame)).toEqual([
      { side: "Top", width: 110, height: 50 },
      { side: "Bottom", width: 110, height: 50 },
      { side: "Left", width: 50, height: 110 },
      { side: "Right", width: 50, height: 110 },
    ])
  })

  it("if target exceeds a frame side, zones of that side have a negative main-length", () => {
    const frame = B.make(10, 10)
    const target1 = B.translate(-1, -1, B.make(2, 2))
    expect(Forto.measureZones(target1, frame)).toEqual([
      { side: "Top", width: 10, height: -1 },
      { side: "Bottom", width: 10, height: 9 },
      { side: "Left", width: -1, height: 10 },
      { side: "Right", width: 9, height: 10 },
    ])
    const target2 = B.translate(9, 9, B.make(2, 2))
    expect(Forto.measureZones(target2, frame)).toEqual([
      { side: "Top", width: 10, height: 9 },
      { side: "Bottom", width: 10, height: -1 },
      { side: "Left", width: 9, height: 10 },
      { side: "Right", width: -1, height: 10 },
    ])
  })
})

describe("calcFit", () => {
  const zone = { side: "Top", width: 50, height: 50 }

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
    const zone2 = Object.assign({}, zone, { width: 0, height: 0 })
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
      const zone2 = Object.assign({}, zone, { side: "Right" })
      const popover = B.make(1 + 90, 1)
      const tip = B.make(1, 9)
      expect(Forto.calcFit(popover, tip, zone2).popoverNegAreaPercent).toEqual(
        0.5,
      )
    })
  })
})

describe("rankZones", () => {
  const b = {
    side: "Bottom",
    width: 100,
    height: 100,
    popoverNegAreaPercent: 0,
  }
  const t = { side: "Top", width: 50, height: 50, popoverNegAreaPercent: 0 }
  const test = (zoneFits, zoneFitsRanked) => {
    expect(Forto.rankZones({}, zoneFits)).toEqual(zoneFitsRanked)
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
    const $b = {
      side: "Bottom",
      width: 1,
      height: 1,
      popoverNegAreaPercent: 0,
    }
    const $t = { side: "Top", width: 2, height: 2, popoverNegAreaPercent: 0 }
    const $r = { side: "Right", width: 2, height: 2, popoverNegAreaPercent: 0 }
    const $l = { side: "Left", width: 2, height: 2, popoverNegAreaPercent: 0 }
    const zoneFits = [$b, $t, $l, $r]
    test(zoneFits, zoneFits)
  })
})

describe("rankZones with preference", () => {
  const b = {
    side: "Bottom",
    width: 100,
    height: 100,
    popoverNegAreaPercent: 1,
  }
  const t = { side: "Top", width: 50, height: 50, popoverNegAreaPercent: 0 }
  const test = (zoneFits, preferredZones, zoneFitsRanked) => {
    expect(Forto.rankZones({ preferredZones }, zoneFits)).toEqual(
      zoneFitsRanked,
    )
  }
  it("if mixed classes, if single pref in second-class, still rank first-class better", () => {
    test([b, t], "Bottom", [t, b])
  })
  it("if mixed classes, if multiple prefs in mixed classes, then ignore prefs of second class and rank preferred first class best even if not greatest area", () => {
    const $b = { ...b, popoverNegAreaPercent: 0 }
    const $t = { ...b, popoverNegAreaPercent: 1 }
    const l = {
      side: "Left",
      width: 200,
      height: 200,
      popoverNegAreaPercent: 0,
    }
    test([$b, $t, l], ["Top", "Bottom"], [$b, l, $t])
  })
  it("if first classes, if single pref in first class then it should be ranked highest even if not greatest area", () => {
    const $b = { ...b, popoverNegAreaPercent: 0 }
    test([$b, t], ["Top"], [t, $b])
  })
  it("if first classes, if multiple prefs in first class, rank best pref that with greatest area", () => {
    const $b = { ...b, popoverNegAreaPercent: 0 }
    test([t, $b], ["Top", "Bottom"], [$b, t])
  })
  it("if second classes, if single pref in second class, then it should be ranked highest even if not least cropped area", () => {
    const $t = { ...t, popoverNegAreaPercent: 1 }
    const $b = { ...b, popoverNegAreaPercent: 2 }
    test([$b, $t], ["Top"], [$t, $b])
  })
  it("if second classes, if multiple prefs in second class, rank best pref that with least crop area", () => {
    const $t = { ...t, popoverNegAreaPercent: 1 }
    const $b = { ...b, popoverNegAreaPercent: 2 }
    test([$b, $t], ["Top", "Bottom"], [$t, $b])
  })
})

describe("rankZones with preference up to thrshold", () => {
  const b = {
    side: "Bottom",
    width: 10,
    height: 10,
    popoverNegAreaPercent: 0,
  }
  const t = { side: "Top", width: 10, height: 5, popoverNegAreaPercent: 0 }
  const test = (
    zoneFits,
    preferredZones,
    preferZoneUntilPercentWorse,
    zoneFitsRanked,
  ) => {
    expect(
      Forto.rankZones(
        { preferredZones, preferZoneUntilPercentWorse },
        zoneFits,
      ),
    ).toEqual(zoneFitsRanked)
  }
  it("preference is taken if better than alternatives", () => {
    test([b, t], "Top", 0.49, [t, b])
  })
  it("preference is not taken if worse than an alternative by equal to or greater than threshold", () => {
    test([b, t], "Top", 0.5, [b, t])
  })
  it("given threshold has no effect between selecting two preferences", () => {
    test([t, b], ["Top", "Bottom"], 0.9, [b, t])
  })
  it("threshold preference does not override class boundry", () => {
    const $b = { ...b, popoverNegAreaPercent: 1 }
    test([$b, t], ["Bottom"], 1, [t, $b])
  })
  it("preference threshold amongst class 2 zones both prefered ranks by least cropped", () => {
    const $b = { ...b, popoverNegAreaPercent: 30 }
    const $t = { ...t, popoverNegAreaPercent: 20 }
    test([$b, $t], ["Bottom", "Top"], 0.9, [$t, $b])
  })
  it("preference threshold amongst class 2 zones, one prefered, picks preference when within threshold", () => {
    const $b = { ...b, popoverNegAreaPercent: 30 }
    const $t = { ...t, popoverNegAreaPercent: 20 }
    test([$t, $b], ["Bottom"], 0.9, [$b, $t])
  })
  it("preference threshold amongst class 2 zones, one prefered, ignores preference when gte threshold", () => {
    const $b = { ...b, popoverNegAreaPercent: 50 }
    const $t = { ...t, popoverNegAreaPercent: 25 }
    test([$b, $t], "Bottom", 0.5, [$t, $b])
  })
})

describe("optimalZone (elligible unspecified)", () => {
  const arrangement = {
    frame: B.make(110, 110),
    target: B.translate(50, 10, B.make(10, 10)),
    popover: B.make(9, 9),
    tip: B.make(1, 1),
  }
  const optimalZone = Forto.optimalZone.bind(null, { elligibleZones: null })

  it("should return the optimal zone", () => {
    expect(optimalZone(arrangement)).toEqual({
      side: "Bottom",
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
    const zone = Forto.optimalZone({ elligibleZones: ["Top"] }, arrangement)
    expect(zone).toEqual({
      side: "Top",
      height: 10,
      width: 110,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.92,
    })
  })

  it("should return optimal zone within those elligible", () => {
    const zone = Forto.optimalZone(
      { elligibleZones: ["Top", "Bottom"] },
      arrangement,
    )
    expect(zone).toEqual({
      side: "Bottom",
      height: 90,
      width: 110,
      popoverNegAreaPercent: 0,
      areaPercentageRemaining: 0.99,
    })
  })
})

describe("calcPopoverPosition (bounded)", () => {
  const calcPopoverPositionBounded = Forto.calcPopoverPosition.bind(null, {
    isBounded: true,
  })
  const frame = B.make(400, 400)
  const target = B.translate(200, 100, B.make(10, 10))
  const zone = {
    side: "Bottom",
    height: 100,
    width: 400,
    popoverNegAreaPercent: 0,
  }
  it("moves popover of less cross-length than target to match its cross-axis to target", () => {
    const popover = B.make(6, 6)
    expect(calcPopoverPositionBounded(frame, target, popover, zone)).toEqual({
      x: 202,
      y: 100 + 10,
    })
  })
  it("moves popover of greater cross-length than target to match its cross-axis to target", () => {
    const popover = B.make(12, 12)
    expect(calcPopoverPositionBounded(frame, target, popover, zone)).toEqual({
      x: 199,
      y: 100 + 10,
    })
  })

  // Test Popover position when frame bounds would be crossed

  it("popover can meet but not exceed frame end bounds to match cross-axis", () => {
    const target2 = B.translate(400 - 10, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: 400 - 20,
      y: 100 + 10,
    })
  })
  it("popover can meet but not exceed frame start bounds to match cross-axis", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: 0,
      y: 100 + 10,
    })
  })
  it("if popover does not fit within frame cross-length then center it within frame", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(400 + 10, 10)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: -1 * 10 / 2,
      y: 100 + 10,
    })
  })

  // Test cross axis matching when target exceeds bounds

  it("does not include cropped cross end of target when calculating targets cross-axis", () => {
    const target2 = B.translate(380, 100, B.make(30, 30))
    const popover = B.make(10, 10)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: 385,
      y: 100 + 30,
    })
  })
  it("does not include cropped cross start of target when calculating targets cross-axis", () => {
    const target2 = B.translate(-10, 100, B.make(30, 30))
    const popover = B.make(10, 10)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: 5,
      y: 100 + 30,
    })
  })
  it("does not include cropped cross start+end of target when calculating targets cross-axis", () => {
    const target2 = B.translate(-10, 100, B.make(420, 10))
    const popover = B.make(10, 10)
    expect(calcPopoverPositionBounded(frame, target2, popover, zone)).toEqual({
      x: 200 - 5,
      y: 100 + 10,
    })
  })
})

describe("calcPopoverPosition (unbounded)", () => {
  const calcPopoverPositionUnbounded = Forto.calcPopoverPosition.bind(null, {
    isBounded: false,
  })
  const frame = B.make(400, 400)
  const zone = {
    side: "Bottom",
    height: 100,
    width: 400,
    popoverNegAreaPercent: 0,
  }

  it("popover can exceed frame end bounds to match cross-axis", () => {
    const target2 = B.translate(400 - 10, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(calcPopoverPositionUnbounded(frame, target2, popover, zone)).toEqual(
      {
        x: 400 - 15,
        y: 100 + 10,
      },
    )
  })
  it("popover can exceed frame start bounds to match cross-axis", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(20, 20)
    expect(calcPopoverPositionUnbounded(frame, target2, popover, zone)).toEqual(
      {
        x: -5,
        y: 100 + 10,
      },
    )
  })
  it("if popover does not fit within frame cross-length then center it within frame", () => {
    const target2 = B.translate(0, 100, B.make(10, 10))
    const popover = B.make(400 + 10, 10)
    expect(calcPopoverPositionUnbounded(frame, target2, popover, zone)).toEqual(
      {
        x: -200,
        y: 100 + 10,
      },
    )
  })
})

describe("calcTipPosition", () => {
  const orientation = "Horizontal"
  const tip = { width: 4, height: 4 }
  it("finds centered tip position", () => {
    const target = B.translate(200, 100, B.make(10, 10))
    const popover = B.translate(200 - 10, 100, B.make(10, 10))
    expect(Forto.calcTipPosition(orientation, target, popover, tip)).toEqual({
      x: 0,
      y: 103,
    })
  })
  it("refers to popover before/popover after if it should", () => {
    const target = B.translate(200, 100, B.make(30, 30))
    const popover = B.translate(200 - 10, 110, B.make(10, 10))
    expect(Forto.calcTipPosition(orientation, target, popover, tip)).toEqual({
      x: 0,
      y: 113,
    })
  })
  it("refers to popover before/target aftert if it should", () => {
    const target = B.translate(200, 100, B.make(30, 30))
    const popover = B.translate(200 - 30, 110, B.make(30, 30))
    expect(Forto.calcTipPosition(orientation, target, popover, tip)).toEqual({
      x: 0,
      y: 118,
    })
  })
})

describe("calcLayout", () => {
  const settingsDefault = {}
  const arrangementDefault = {
    frame: B.make(100, 100),
    target: B.translate(90, 50, B.make(10, 10)),
    popover: B.make(10, 10),
    tip: B.make(2, 2),
  }
  it("calculates the layout start to finish", () => {
    expect(Forto.calcLayout(settingsDefault, arrangementDefault)).toEqual({
      popover: { x: 80, y: 50 },
      tip: { x: 0, y: 54 },
      zone: {
        side: "Left",
        height: 100,
        width: 90,
        areaPercentageRemaining: 0.99,
        popoverNegAreaPercent: 0,
      },
    })
  })
  it("tip is optional", () => {
    expect(
      Forto.calcLayout(settingsDefault, { ...arrangementDefault, tip: null }),
    ).toEqual({
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
    const prevZone = "Top"
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
          side: "Top",
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
          side: "Bottom",
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
    side: "Top",
    width: 10,
    height: 10,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 0.5,
  }
  const b = {
    side: "Bottom",
    width: 50,
    height: 100,
    popoverNegAreaPercent: 0,
    areaPercentageRemaining: 0.4,
  }

  it("if top ranked zone is class 1 and previous zone is class 2 then maintain rankings", () => {
    const zonesRanked = [t, { ...b, popoverNegAreaPercent: 5 }]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, "Bottom"),
    ).toEqual(zonesRanked)
  })

  it("if top ranked zone is previous zone then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, "Top"),
    ).toEqual(zonesRanked)
  })

  it("if top ranked zone is below superiority threshold for change then restore previous zone to top rank", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.5, zonesRanked, "Bottom"),
    ).toEqual([b, t])
  })

  it("if top ranked zone is greater than superiority threshold for change then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.05, zonesRanked, "Bottom"),
    ).toEqual([t, b])
  })

  it("if top ranked zone is equal to superiority threshold for change then maintain rankings", () => {
    const zonesRanked = [t, b]
    expect(
      Forto.adjustRankingForChangeThreshold(0.1, zonesRanked, "Bottom"),
    ).toEqual([t, b])
  })
})
