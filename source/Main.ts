// TODO
// * API

import * as F from "./prelude"
import * as BB from "./BoundingBox"
import * as Ori from "./Ori"

type Pos = {
  x: number
  y: number
}

type Size = {
  height: number
  width: number
}

type Orientation = "Horizontal" | "Vertical"

/**
 * Calculate the mid point between two numbers.
 */
const centerBetween = (x: number, o: number): number => {
  return x > o ? 0 : x + (o - x) / 2
}

const centerOf = (orientation: Orientation, x: Size) => {
  return orientation === "Horizontal" ? x.width / 2 : x.height / 2
}

/**
 * Return a number no greater than a certain maximum.
 */
const upperLimit = (ceiling: number, n: number): number => {
  return n <= ceiling ? n : ceiling
}

/**
 * Calculate the area of a rectangular shape.
 */
const area = (size: Size): number => {
  return size.width * size.height
}

/**
 * Numeric comparator.
 */
const compare = (a: number, b: number): number => {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Calculate the half of a number.
 */
const center = (n: number): number => {
  return n / 2
}

enum Order {
  Before = "Before",
  After = "After",
}

/**
 * Create a bounding box from size and position data.
 */
const BoundingBoxFromSizePosition = (size: Size, pos: Pos): BB.BoundingBox => ({
  ...size,
  left: pos.x,
  top: pos.y,
  bottom: pos.y + size.height,
  right: pos.x + size.width,
})

type MeasuredZone = Size & Ori.OfASidea

const measureZones = (
  target: BB.BoundingBox,
  frame: BB.BoundingBox,
): MeasuredZone[] => {
  return [
    {
      side: Ori.Side.Top,
      width: frame.width,
      height: target.top - frame.top,
    },
    {
      side: Ori.Side.Bottom,
      width: frame.width,
      height: frame.bottom - target.bottom,
    },
    {
      side: Ori.Side.Left,
      width: target.left - frame.left,
      height: frame.height,
    },
    {
      side: Ori.Side.Right,
      width: frame.right - target.right,
      height: frame.height,
    },
  ]
}

// Ori.orderOf = (ofASide) : Order => (
//   ["Left", "Top"].indexOf(ofASide.side) ? after : before
// )

const calcFit = (
  popover: BB.BoundingBox,
  tip: BB.BoundingBox,
  measuredZone: MeasuredZone,
) => {
  const popoverTip = Ori.isHorizontal(measuredZone)
    ? { width: popover.width + tip.height, height: popover.height }
    : { width: popover.width, height: popover.height + tip.height }
  const heightRem = measuredZone.height - popoverTip.height
  const widthRem = measuredZone.width - popoverTip.width
  const measuredZoneArea = area(measuredZone)
  const areaPercentageRemaining = F.precision(
    2,
    (measuredZoneArea -
      F.min(popoverTip.height, measuredZone.height) *
        F.min(popoverTip.width, measuredZone.height)) /
      measuredZoneArea,
  )
  // console.log(measuredZone.side, measuredZoneArea, areaPercentageRemaining)
  const popoverNegAreaH =
    heightRem >= 0 ? 0 : Math.abs(heightRem * popoverTip.width)
  const popoverNegAreaW =
    widthRem >= 0
      ? 0
      : Math.abs(
          widthRem * (popoverTip.height - Math.abs(upperLimit(0, heightRem))),
        )
  const popoverNegArea = popoverNegAreaH + popoverNegAreaW
  const popoverNegAreaPercent = popoverNegArea / area(popoverTip)

  return {
    ...measuredZone,
    popoverNegAreaPercent,
    areaPercentageRemaining,
  }
}

const rankZonesWithPreference = (prefZones: Ori.Side[], zoneFits: Zone[]) =>
  zoneFits.sort((a, b) => {
    if (a.popoverNegAreaPercent < b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent > b.popoverNegAreaPercent) return 1
    const prefA = prefZones.indexOf(a.side) > -1
    const prefB = prefZones.indexOf(b.side) > -1
    if (prefA && !prefB) return -1
    if (!prefA && prefB) return 1
    return compare(area(a), area(b)) * -1
  })

const rankZonesWithThresholdPreference = (
  prefZones: Ori.Side[],
  threshold: number,
  zoneFits: Zone[],
) =>
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
  threshold: number,
  zonesRanked: Zone[],
  previousZone: Ori.Side,
) => {
  const topRankedZoneFit = zonesRanked[0]
  if (previousZone === topRankedZoneFit.side) return zonesRanked

  const previousZoneFitNow = F.find(
    ({ side }) => previousZone === side,
    zonesRanked,
  )! // TODO document why we have this non-null guarantee

  if (
    previousZoneFitNow.popoverNegAreaPercent > 0 &&
    topRankedZoneFit.popoverNegAreaPercent === 0
  )
    return zonesRanked

  const newZoneImprovementPercentage = F.precision(
    2,
    F.percentageDifference(
      topRankedZoneFit.areaPercentageRemaining,
      previousZoneFitNow.areaPercentageRemaining,
    ),
  )

  if (newZoneImprovementPercentage < threshold) {
    zonesRanked.splice(zonesRanked.indexOf(previousZoneFitNow), 1)
    zonesRanked.unshift(previousZoneFitNow)
    return zonesRanked
  }

  return zonesRanked
}

const rankZonesSimple = (zoneFits: Zone[]): Zone[] => {
  return zoneFits.sort((a, b) => {
    if (a.popoverNegAreaPercent < b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent > b.popoverNegAreaPercent) return 1
    // Either neither have negative area or both have equally negative area.
    // In either case check which has the largest area.
    // NOTE we inverse compare since it treats larger as coming later
    // but for us larger is better and hence should come first.
    return compare(area(a), area(b)) * -1
  })
}

const rankZones = (
  settings: Settings,
  zoneFits: Zone[],
  previousZone: null | Ori.Side,
) => {
  let zoneFitsRanked

  if (settings.preferredZones) {
    zoneFitsRanked = settings.preferZoneUntilPercentWorse
      ? rankZonesWithThresholdPreference(
          settings.preferredZones,
          settings.preferZoneUntilPercentWorse,
          zoneFits,
        )
      : rankZonesWithPreference(settings.preferredZones, zoneFits)
  } else {
    zoneFitsRanked = rankZonesSimple(zoneFits)
  }

  if (settings.zoneChangeThreshold && previousZone) {
    zoneFitsRanked = adjustRankingForChangeThreshold(
      settings.zoneChangeThreshold,
      zoneFitsRanked,
      previousZone,
    )
  }

  return zoneFitsRanked
}

type Arrangement = {
  frame: BB.BoundingBox
  target: BB.BoundingBox
  popover: BB.BoundingBox
  tip: BB.BoundingBox
}

const optimalZone = (
  settings: Settings,
  arrangement: Arrangement,
  previousZoneSide: null | Ori.Side,
): Zone => {
  // TODO We can optimize measureZones to apply the elligibleZones logic
  // so that it does not needlessly create objects.
  const zonesMeasured =
    settings.elligibleZones === null
      ? measureZones(arrangement.target, arrangement.frame)
      : measureZones(arrangement.target, arrangement.frame).filter(
          zone => settings.elligibleZones!.indexOf(zone.side) > -1,
        )

  // Preferred zones
  // Pick the preferred First Class zone or if none specifed that with the
  // greatest area. If there are no First Class zones then pick the preferred
  // Second Class zone or if none specified that with the least area cropped.
  return F.head(
    rankZones(
      settings,
      zonesMeasured.map(zone =>
        calcFit(arrangement.popover, arrangement.tip, zone),
      ),
      previousZoneSide,
    ),
  )! // TODO Document why we have non-null guarantee.
}

const calcPopoverPosition = (
  settings: Settings,
  frame: BB.BoundingBox,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  zone: Zone,
) => {
  const ori = Ori.fromSide(zone)
  const p = { x: 0, y: 0 }
  const crossAxis = Ori.crossAxis(ori)
  const crossEnd = Ori.crossEnd(ori)
  const crossStart = Ori.crossStart(ori)
  const crossLength = Ori.crossLength(ori)

  /* Place the popover next to the target. */
  p[Ori.mainAxis(ori)] =
    ["Left", "Top"].indexOf(zone.side) !== -1
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

const calcTipPosition = (
  orientation: Ori.Ori,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  tip: BB.BoundingBox,
): Pos => {
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)
  // const crossLength = Ori.crossEnd(orientation)
  const innerMostBefore = F.max(popover[crossStart], target[crossStart])
  const innerMostAfter = F.min(popover[crossEnd], target[crossEnd])
  return {
    [Ori.crossAxis(orientation)]:
      centerBetween(innerMostBefore, innerMostAfter) -
      centerOf(Ori.opposite(orientation), tip),
    [Ori.mainAxis(orientation)]: 0,
  } as Pos
}

type SidesShorthand = Ori.Ori | Order | Ori.Side

const expandSideShorthand = (elligibleZones: SidesShorthand): Ori.Side[] => {
  switch (elligibleZones) {
    case Ori.Ori.Horizontal:
      return [Ori.Side.Left, Ori.Side.Right]
    case Ori.Ori.Vertical:
      return [Ori.Side.Top, Ori.Side.Bottom]
    case Order.Before:
      return [Ori.Side.Top, Ori.Side.Left]
    case Order.After:
      return [Ori.Side.Bottom, Ori.Side.Right]
    default:
      return [elligibleZones]
  }
}

const checkAndNormalizeSettings = (settings: SettingsUnchecked): Settings => {
  const isBounded = F.defaultsTo(true, settings.isBounded)
  const zoneChangeThreshold = settings.zoneChangeThreshold || null
  const preferZoneUntilPercentWorse = F.isExists(
    settings.preferZoneUntilPercentWorse,
  )
    ? settings.preferZoneUntilPercentWorse
    : null
  const elligibleZones =
    settings.elligibleZones === undefined || settings.elligibleZones === null
      ? null
      : expandSideShorthand(settings.elligibleZones)
  const preferredZones =
    settings.preferredZones === undefined || settings.preferredZones === null
      ? null
      : expandSideShorthand(settings.preferredZones)
  if (elligibleZones && preferredZones) {
    const impossiblePreferredZones = F.omit(elligibleZones, preferredZones)
    if (impossiblePreferredZones.length) {
      console.warn(
        "Your preferred zones (%s) are impossible to use because you specified elligible zones that do not include them (%s)",
        preferredZones,
        elligibleZones,
      )
    }
  }

  return {
    isBounded,
    elligibleZones,
    preferredZones,
    zoneChangeThreshold,
    preferZoneUntilPercentWorse,
  }
}

type Zone = Size & {
  side: Ori.Side
  areaPercentageRemaining: number
  popoverNegAreaPercent: number
}

type SettingsUnchecked = {
  zoneChangeThreshold?: number
  preferZoneUntilPercentWorse?: number
  isBounded?: boolean
  elligibleZones?: SidesShorthand
  preferredZones?: SidesShorthand
}

type Settings = {
  isBounded: boolean
  zoneChangeThreshold: null | number
  elligibleZones: null | Ori.Side[]
  preferredZones: null | Ori.Side[]
  preferZoneUntilPercentWorse: null | number
}

type ArrangementUnchecked = Arrangement & {
  tip: null | BB.BoundingBox
}

type Calculation = {
  popover: Pos
  tip: null | Pos
  zone: Zone
}

const calcLayout = (
  settingsUnchecked: SettingsUnchecked,
  arrangementUnchecked: ArrangementUnchecked,
  previousZoneSide: null | Ori.Side,
): Calculation => {
  const settings = checkAndNormalizeSettings(settingsUnchecked)
  const isTipEnabled = Boolean(arrangementUnchecked.tip)
  const arrangement: Arrangement = isTipEnabled
    ? arrangementUnchecked
    : {
        ...arrangementUnchecked,
        tip: BB.make(0, 0),
      }
  const zone = optimalZone(settings, arrangement, previousZoneSide)
  const popoverPosition = calcPopoverPosition(
    settings,
    arrangement.frame,
    arrangement.target,
    arrangement.popover,
    zone,
  )
  const popoverBoundingBox = BoundingBoxFromSizePosition(
    arrangement.popover,
    popoverPosition,
  )
  const tipPosition = isTipEnabled
    ? calcTipPosition(
        Ori.fromSide(zone),
        arrangement.target,
        popoverBoundingBox,
        arrangement.tip,
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
  Order,
  Arrangement,
  SettingsUnchecked,
  SidesShorthand,
  Calculation,
  Zone,
  Pos,
}
