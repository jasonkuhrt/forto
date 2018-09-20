import * as BB from "./BoundingBox"
import * as DOM from "./Dom"
import * as Layout from "./Layout"
import * as Ori from "./Ori"
import * as F from "./Prelude"
import * as Settings from "./Settings"

type MeasuredZone = Layout.Size & Ori.OfASidea

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
  const measuredZoneArea = Layout.area(measuredZone)
  const areaPercentageRemaining = F.precision(
    2,
    (measuredZoneArea -
      F.min(popoverTip.height, measuredZone.height) *
        F.min(popoverTip.width, measuredZone.height)) /
      measuredZoneArea,
  )
  const popoverNegAreaH =
    heightRem >= 0 ? 0 : Math.abs(heightRem * popoverTip.width)
  const popoverNegAreaW =
    widthRem >= 0
      ? 0
      : Math.abs(
          widthRem * (popoverTip.height - Math.abs(F.upperLimit(0, heightRem))),
        )
  const popoverNegArea = popoverNegAreaH + popoverNegAreaW
  const popoverNegAreaPercent = popoverNegArea / Layout.area(popoverTip)

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
    return F.compare(Layout.area(a), Layout.area(b)) * -1
  })

const rankZonesWithThresholdPreference = (
  prefZones: Ori.Side[],
  threshold: number,
  zoneFits: Zone[],
) =>
  zoneFits.sort((a, b) => {
    if (!a.popoverNegAreaPercent && b.popoverNegAreaPercent) return -1
    if (a.popoverNegAreaPercent && !b.popoverNegAreaPercent) return 1
    const areaA = Layout.area(a)
    const areaB = Layout.area(b)
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
    return F.compare(areaA, areaB) * -1
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
    return F.compare(Layout.area(a), Layout.area(b)) * -1
  })
}

const rankZones = (
  settings: Settings.Settings,
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
  settings: Settings.Settings,
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
  settings: Settings.Settings,
  frame: BB.BoundingBox,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  tip: null | BB.BoundingBox,
  zone: Zone,
) => {
  const ori = Ori.fromSide(zone)
  const p = { x: 0, y: 0 }
  const crossAxis = Ori.crossAxis(ori)
  const crossEnd = Ori.crossEnd(ori)
  const crossStart = Ori.crossStart(ori)
  const crossLength = Ori.crossLength(ori)

  /* Place the popover next to the target. */
  const isBefore = F.hasAny(["Left", "Top"], zone.side)
  const tipLength = tip ? tip[Ori.mainLength(ori)] : 0
  p[Ori.mainAxis(ori)] = isBefore
    ? target[Ori.mainStart(ori)] - (popover[Ori.mainDim(ori)] + tipLength)
    : target[Ori.mainEnd(ori)] + tipLength

  /* Align the popover's cross-axis center with that of target. Only the
  target length within frame should be considered. That is, find the
  cross-axis center of the part of target within the frame bounds, ignoring any
  length outside said frame bounds. */
  let targetCrossAxisCrossPos =
    target[crossStart] + Layout.center(target[crossLength])
  const frameTargetEndDiff = frame[crossEnd] - target[crossEnd]
  if (frameTargetEndDiff < 0) {
    targetCrossAxisCrossPos += Layout.center(frameTargetEndDiff)
  }
  const frameTargetStartDiff = target[crossStart] - frame[crossStart]
  if (frameTargetStartDiff < 0) {
    targetCrossAxisCrossPos -= Layout.center(frameTargetStartDiff)
  }

  p[crossAxis] = targetCrossAxisCrossPos - Layout.center(popover[crossLength])

  if (settings.isBounded) {
    const crossLengthDiff = frame[crossLength] - popover[crossLength]
    if (crossLengthDiff < 0) {
      /* If the popover exceeds Frame bounds on both ends then
      center it between them. */
      p[crossAxis] = Layout.center(crossLengthDiff)
    } else if (p[crossAxis] + popover[crossLength] > frame[crossEnd]) {
      p[crossAxis] = frame[crossEnd] - popover[crossLength]
    } else if (p[crossAxis] < 0) {
      p[crossAxis] = 0
    }
  }
  return p
}

const calcTipPosition = (
  zone: Zone,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  tip: BB.BoundingBox,
): Layout.Pos => {
  const isAfter = zone.side === "Left" || zone.side === "Top"
  const orientation = Ori.fromSide(zone)
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)
  const innerMostBefore = F.max(popover[crossStart], target[crossStart])
  const innerMostAfter = F.min(popover[crossEnd], target[crossEnd])
  return {
    [Ori.crossAxis(orientation)]:
      Layout.centerBetween(innerMostBefore, innerMostAfter) -
      (Layout.centerOf(Ori.opposite(orientation), tip) + popover[crossStart]),
    [Ori.mainAxis(orientation)]: isAfter
      ? popover[Ori.mainDim(orientation)]
      : tip[Ori.mainDim(orientation)] * -1,
  } as Layout.Pos
}

const calcAbsoluteTipPosition = (
  zone: Zone,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  tip: BB.BoundingBox,
): Layout.Pos => {
  const orientation = Ori.fromSide(zone)
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)

  const isBefore = zone.side === "Left" || zone.side === "Top"

  const tipCrossCenterLength = Layout.centerOf(Ori.opposite(orientation), tip)
  const innerMostBefore = F.max(popover[crossStart], target[crossStart])
  const innerMostAfter = F.min(popover[crossEnd], target[crossEnd])
  const innerCenterLength = Layout.centerBetween(
    innerMostBefore,
    innerMostAfter,
  )

  const crossAxisPos = Layout.withinBounds(
    innerMostBefore,
    // max bound factors in element forward-rendering
    innerMostAfter - tip[Ori.crossLength(orientation)],
    innerCenterLength - tipCrossCenterLength,
  )

  /* Position the tip's main-axis position
  We need to "pull back" the tip if comes before the target
  in the coordinate system, since elements "render forward".

  We need to "push ahead" the tip if comes after the target
  in the coordinate system. Note in this case the
  "render forward" works in our favour so we don't have to
  "offset" it.
  */
  const mainAxisPos = isBefore
    ? target[Ori.mainStart(orientation)] - tip[Ori.mainLength(orientation)]
    : target[Ori.mainEnd(orientation)]

  return {
    [Ori.crossAxis(orientation)]: crossAxisPos,
    [Ori.mainAxis(orientation)]: mainAxisPos,
  } as Layout.Pos
}

type Zone = Layout.Size & {
  side: Ori.Side
  areaPercentageRemaining: number
  popoverNegAreaPercent: number
}

type ArrangementUnchecked = Arrangement & {
  tip: null | BB.BoundingBox
}

type Calculation = {
  popover: Layout.Pos
  tip: null | Layout.Pos
  zone: Zone
}

const calcLayout = (
  givenSettings: Settings.SettingsUnchecked,
  arrangementUnchecked: ArrangementUnchecked,
  previousZoneSide: null | Ori.Side,
): Calculation => {
  const settings = Settings.checkAndNormalize(givenSettings)
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
    arrangement.tip,
    zone,
  )
  const tipPosition = isTipEnabled
    ? // Expose calculating absolute tip position via setting
      calcTipPosition(
        zone,
        arrangement.target,
        arrangement.popover,
        arrangement.tip,
      )
    : null

  return {
    popover: popoverPosition,
    tip: tipPosition,
    zone,
  }
}

type LayoutCalculator = (newBounds: Arrangement) => Calculation

/**
 * Create a layout calculator. The reason it is not pure is that some
 * local state is kept to track the previous zone, data needed by the
 * forto algorithm. This function hides the caller from having to manage that
 * state.
 */
const createLayoutCalculator = (
  settings: Settings.SettingsUnchecked,
): LayoutCalculator => {
  let previousZoneSide: Ori.Side

  const calc: LayoutCalculator = newBounds => {
    const layout = calcLayout(settings, newBounds, previousZoneSide || null)
    previousZoneSide = layout.zone.side
    return layout
  }

  return calc
}

export {
  DOM,
  Settings,
  adjustRankingForChangeThreshold,
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
  calcTipPosition,
  calcAbsoluteTipPosition,
  calcLayout,
  Arrangement,
  Calculation,
  Zone,
  MeasuredZone,
  createLayoutCalculator,
  Ori,
}
