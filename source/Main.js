// TODO
// * API

import * as F from "./prelude"

const min = (x, o) => (x <= o ? x : o)
const max = (x, o) => (x >= o ? x : o)
const centerBetween = (x, o) => (x > o ? 0 : x + (o - x) / 2)
const centerOf = (orientation, x) =>
  orientation === "Horizontal" ? x.width / 2 : x.height / 2
const upperLimit = (ceiling, n) => (n <= ceiling ? n : ceiling)
const area = size => size.width * size.height

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const center = n => n / 2

const Sides = {
  Top: "Top",
  Bottom: "Bottom",
  Left: "Left",
  Right: "Right",
}

const Orders = {
  Before: "Before",
  After: "After",
}

const BoundingBoxFromSizePosition = (size, position) => ({
  ...size,
  left: position.x,
  top: position.y,
  bottom: position.y + size.height,
  right: position.x + size.width,
})

const measureZones = (target, frame) => [
  {
    side: Sides.Top,
    width: frame.width,
    height: target.top - frame.top,
  },
  {
    side: Sides.Bottom,
    width: frame.width,
    height: frame.bottom - target.bottom,
  },
  {
    side: Sides.Left,
    width: target.left - frame.left,
    height: frame.height,
  },
  {
    side: Sides.Right,
    width: frame.right - target.right,
    height: frame.height,
  },
]

const Oris = {
  Horizontal: "Horizontal",
  Vertical: "Vertical",
}

const Ori = {}

Ori.isHorizontal = ofASide =>
  [Sides.Right, Sides.Left].indexOf(ofASide.side) !== -1

Ori.fromSide = ofASide =>
  [Sides.Right, Sides.Left].indexOf(ofASide.side) !== -1
    ? Oris.Horizontal
    : Oris.Vertical

Ori.crossDim = ori => (ori === Oris.Horizontal ? "height" : "width")

Ori.mainDim = ori => (ori === Oris.Vertical ? "width" : "height")

Ori.mainAxis = ori => (ori === Oris.Horizontal ? "x" : "y")

Ori.crossAxis = ori => (ori === Oris.Horizontal ? "y" : "x")

Ori.mainEnd = ori => (ori === Oris.Horizontal ? "right" : "bottom")

Ori.mainStart = ori => (ori === Oris.Horizontal ? "left" : "top")

Ori.crossEnd = ori => (ori === Oris.Horizontal ? "bottom" : "right")

Ori.crossStart = ori => (ori === Oris.Horizontal ? "top" : "left")

Ori.mainLength = ori => (ori === Oris.Horizontal ? "width" : "height")

Ori.crossLength = ori => (ori === Oris.Horizontal ? "height" : "width")
Ori.opposite = ori =>
  ori === Oris.Horizontal ? Oris.Vertical : Oris.Horizontal

// Ori.orderOf = (ofASide) : Order => (
//   ["Left", "Top"].indexOf(ofASide.side) ? after : before
// )

const calcFit = (popover, tip, measuredZone) => {
  const popoverTip = Ori.isHorizontal(measuredZone)
    ? { width: popover.width + tip.height, height: popover.height }
    : { width: popover.width, height: popover.height + tip.height }
  const heightRem = measuredZone.height - popoverTip.height
  const widthRem = measuredZone.width - popoverTip.width
  const measuredZoneArea = area(measuredZone)
  const areaPercentageRemaining = F.precision(
    2,
    (measuredZoneArea -
      min(popoverTip.height, measuredZone.height) *
        min(popoverTip.width, measuredZone.height)) /
      measuredZoneArea
  )
  // console.log(measuredZone.side, measuredZoneArea, areaPercentageRemaining)
  const popoverNegAreaH = heightRem >= 0
    ? 0
    : Math.abs(heightRem * popoverTip.width)
  const popoverNegAreaW = widthRem >= 0
    ? 0
    : Math.abs(
        widthRem * (popoverTip.height - Math.abs(upperLimit(0, heightRem)))
      )
  const popoverNegArea = popoverNegAreaH + popoverNegAreaW
  const popoverNegAreaPercent = popoverNegArea / area(popoverTip)
  return Object.assign({}, measuredZone, {
    popoverNegAreaPercent,
    areaPercentageRemaining,
  })
}

const rankZonesWithPreference = (prefZones, zoneFits) =>
  zoneFits.sort((a, b) => {
    if (a.popoverNegAreaPercent < b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent > b.popoverNegAreaPercent) return 1
    const prefA = prefZones.indexOf(a.side) > -1
    const prefB = prefZones.indexOf(b.side) > -1
    if (prefA && !prefB) return -1
    if (!prefA && prefB) return 1
    return compare(area(a), area(b)) * -1
  })

const rankZonesWithThresholdPreference = (prefZones, threshold, zoneFits) =>
  zoneFits.sort((a, b) => {
    if (!a.popoverNegAreaPercent && b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent && !b.popoverNegAreaPercent) return 1
    const areaA = area(a)
    const areaB = area(b)
    const prefA = prefZones.indexOf(a.side) > -1
    const prefB = prefZones.indexOf(b.side) > -1
    if (a.popoverNegAreaPercent && b.popoverNegAreaPercent) {
      if (
        prefA &&
        !prefB &&
        1 - b.popoverNegAreaPercent / a.popoverNegAreaPercent < threshold
      )
        return -1
      if (
        !prefA &&
        prefB &&
        1 - a.popoverNegAreaPercent / b.popoverNegAreaPercent < threshold
      )
        return 1
      if (a.popoverNegAreaPercent < b.popoverNegAreaPercent) return -1
      if (a.popoverNegAreaPercent > b.popoverNegAreaPercent) return 1
    }
    // TODO use new zone rem area value?
    if (prefA && !prefB && (areaB - areaA) / areaB > threshold) return -1
    if (!prefA && prefB && (areaA - areaB) / areaA > threshold) return 1
    return compare(areaA, areaB) * -1
  })

const adjustRankingForChangeThreshold = (
  threshold,
  zonesRanked,
  previousZone
) => {
  const topRankedZoneFit = zonesRanked[0]
  if (previousZone === topRankedZoneFit.side) return zonesRanked

  const previousZoneFitNow = zonesRanked.find(
    ({ side }) => previousZone === side
  )
  if (
    previousZoneFitNow.popoverNegAreaPercent > 0 &&
    topRankedZoneFit.popoverNegAreaPercent === 0
  )
    return zonesRanked

  const newZoneImprovementPercentage = F.precision(
    2,
    topRankedZoneFit.areaPercentageRemaining -
      previousZoneFitNow.areaPercentageRemaining
  )

  if (newZoneImprovementPercentage < threshold) {
    zonesRanked.splice(zonesRanked.indexOf(previousZoneFitNow), 1)
    zonesRanked.unshift(previousZoneFitNow)
    return zonesRanked
  }

  return zonesRanked
}

const rankZonesSimple = zoneFits =>
  zoneFits.sort((a, b) => {
    if (a.popoverNegAreaPercent < b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent > b.popoverNegAreaPercent) return 1
    // Either neither have negative area or both have equally negative area.
    // In either case check which has the largest area.
    // NOTE we inverse compare since it treats larger as coming later
    // but for us larger is better and hence should come first.
    return compare(area(a), area(b)) * -1
  })

const rankZones = (settings, zoneFits, previousZone) => {
  let zoneFitsRanked

  if (settings.preferredZones) {
    zoneFitsRanked = settings.preferZoneUntilPercentWorse
      ? rankZonesWithThresholdPreference(
          settings.preferredZones,
          settings.preferZoneUntilPercentWorse,
          zoneFits
        )
      : rankZonesWithPreference(settings.preferredZones, zoneFits)
  } else {
    zoneFitsRanked = rankZonesSimple(zoneFits)
  }

  if (settings.zoneChangeThreshold && previousZone) {
    zoneFitsRanked = adjustRankingForChangeThreshold(
      settings.zoneChangeThreshold,
      zoneFitsRanked,
      previousZone
    )
  }

  return zoneFitsRanked
}

const optimalZone = (settings, arrangement, previousZoneSide) => {
  // TODO We can optimize measureZones to apply the elligibleZones logic
  // so that it does not needlessly create objects.
  const zonesMeasured = settings.elligibleZones
    ? measureZones(arrangement.target, arrangement.frame).filter(
        zone => settings.elligibleZones.indexOf(zone.side) > -1
      )
    : measureZones(arrangement.target, arrangement.frame)

  // Preferred zones
  // Pick the preferred First Class zone or if none specifed that with the
  // greatest area. If there are no First Class zones then pick the preferred
  // Second Class zone or if none specified that with the least area cropped.
  return F.first(
    rankZones(
      settings,
      zonesMeasured.map(zone =>
        calcFit(arrangement.popover, arrangement.tip, zone)
      ),
      previousZoneSide
    )
  )
}

const calcPopoverPosition = (settings, frame, target, popover, zone) => {
  const ori = Ori.fromSide(zone)
  const p = { x: 0, y: 0 }
  const crossAxis = Ori.crossAxis(ori)
  const crossEnd = Ori.crossEnd(ori)
  const crossStart = Ori.crossStart(ori)
  const crossLength = Ori.crossLength(ori)

  /* Place the popover next to the target. */
  p[Ori.mainAxis(ori)] = ["Left", "Top"].indexOf(zone.side) !== -1
    ? target[Ori.mainStart(ori)] - popover[Ori.mainDim(ori)]
    : target[Ori.mainEnd(ori)]

  /* Align the popover's cross-axis center with that of target. Only the
  target length within frame should be considered. That is, find the
  cross-axis center of the part of target within the frame bounds, ignoring any
  length outside said frame bounds. */
  let targetCrossAxisCrossPos = target[crossStart] + center(target[crossLength])
  const frameTargetEndDiff = frame[crossEnd] - target[crossEnd]
  if (frameTargetEndDiff < 0) {
    targetCrossAxisCrossPos += center(frameTargetEndDiff)
  }
  const frameTargetStartDiff = target[crossStart] - frame[crossStart]
  if (frameTargetStartDiff < 0) {
    targetCrossAxisCrossPos -= center(frameTargetStartDiff)
  }

  p[crossAxis] = targetCrossAxisCrossPos - center(popover[crossLength])

  if (settings.isBounded) {
    const crossLengthDiff = frame[crossLength] - popover[crossLength]
    if (crossLengthDiff < 0) {
      /* If the popover exceeds Frame bounds on both ends then
      center it between them. */
      p[crossAxis] = center(crossLengthDiff)
    } else if (p[crossAxis] + popover[crossLength] > frame[crossEnd]) {
      p[crossAxis] = frame[crossEnd] - popover[crossLength]
    } else if (p[crossAxis] < 0) {
      p[crossAxis] = 0
    }
  }
  return p
}

const calcTipPosition = (orientation, target, popover, tip) => {
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)
  // const crossLength = Ori.crossEnd(orientation)
  const innerMostBefore = max(popover[crossStart], target[crossStart])
  const innerMostAfter = min(popover[crossEnd], target[crossEnd])
  return {
    [Ori.crossAxis(orientation)]:
      centerBetween(innerMostBefore, innerMostAfter) -
        centerOf(Ori.opposite(orientation), tip),
    [Ori.mainAxis(orientation)]: 0,
  }
}

const expandSideShorthand = elligibleZones => {
  if (elligibleZones === Oris.Horizontal) return [Sides.Left, Sides.Right]
  if (elligibleZones === Oris.Vertical) return [Sides.Top, Sides.Bottom]
  if (elligibleZones === Orders.Before) return [Sides.Top, Sides.Left]
  if (elligibleZones === Orders.After) return [Sides.Bottom, Sides.Right]
  return [elligibleZones]
}

const checkAndNormalizeSettings = settings => {
  const isBounded = F.defaultsTo(true, settings.isBounded)
  const zoneChangeThreshold = settings.zoneChangeThreshold || null
  const elligibleZones = F.isExists(settings.elligibleZones)
    ? expandSideShorthand(settings.elligibleZones)
    : null
  const preferredZones = F.isExists(settings.preferredZones)
    ? expandSideShorthand(settings.preferredZones)
    : null
  if (elligibleZones && preferredZones) {
    const impossiblePreferredZones = F.omit(elligibleZones, preferredZones)
    if (impossiblePreferredZones.length) {
      console.warn(
        "Your preferred zones (%s) are impossible to use because you specified elligible zones that do not include them (%s)",
        preferredZones,
        elligibleZones
      )
    }
  }
  return {
    isBounded,
    elligibleZones,
    preferredZones,
    zoneChangeThreshold,
  }
}

const calcLayout = (
  settingsUnchecked,
  arrangementUnchecked,
  previousZoneSide
) => {
  const settings = checkAndNormalizeSettings(settingsUnchecked)
  const isTipEnabled = Boolean(arrangementUnchecked.tip)
  const arrangement = isTipEnabled
    ? arrangementUnchecked
    : { ...arrangementUnchecked, tip: { width: 0, height: 0 } }
  const zone = optimalZone(settings, arrangement, previousZoneSide)
  const popoverPosition = calcPopoverPosition(
    settings,
    arrangement.frame,
    arrangement.target,
    arrangement.popover,
    zone
  )
  const popoverBoundingBox = BoundingBoxFromSizePosition(
    arrangement.popover,
    popoverPosition
  )
  const tipPosition = isTipEnabled
    ? calcTipPosition(
        Ori.fromSide(zone),
        arrangement.target,
        popoverBoundingBox,
        arrangement.tip
      )
    : null
  return {
    popover: popoverPosition,
    tip: tipPosition,
    zone,
  }
}

export {
  adjustRankingForChangeThreshold,
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
  calcTipPosition,
  calcLayout,
}
