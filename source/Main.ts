import * as BB from "./BoundingBox"
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
  const pos = { x: 0, y: 0 }
  const crossAxis = Ori.crossAxis(ori)
  const crossEnd = Ori.crossEnd(ori)
  const crossStart = Ori.crossStart(ori)
  const crossLength = Ori.crossLength(ori)
  const isBefore = F.hasAny(["Left", "Top"], zone.side)
  const tipLength = tip ? settings.tipSize! : 0

  /* Along main axis, place the popover next to the target. */
  // TODO Refactor
  if (settings.boundingMode === "always") {
    pos[Ori.mainAxis(ori)] = isBefore
      ? F.min(target[Ori.mainStart(ori)], frame[Ori.mainEnd(ori)]) -
        (popover[Ori.mainDim(ori)] + tipLength)
      : F.max(target[Ori.mainEnd(ori)], frame[Ori.mainStart(ori)]) + tipLength
  } else {
    pos[Ori.mainAxis(ori)] = isBefore
      ? target[Ori.mainStart(ori)] - (popover[Ori.mainDim(ori)] + tipLength)
      : target[Ori.mainEnd(ori)] + tipLength
  }

  /* Along the cross axis, align the popover to the target's center. Only the
  target's length _within_ the frame should be measured.*/
  const applicableTargetCrossStart = F.max(
    target[crossStart],
    frame[crossStart],
  )

  const applicableTargetCrossEnd = F.min(target[crossEnd], frame[crossEnd])

  const targetCrossAxisPos = Layout.centerBetween(
    applicableTargetCrossStart,
    applicableTargetCrossEnd,
  )

  pos[crossAxis] = targetCrossAxisPos - Layout.center(popover[crossLength])

  if (settings.isBounded) {
    /* Constrain popover cross pos to layout within frame bounds. The exception is
    if popover overflows in which case a centering layout is used. */
    const crossLengthDiff = frame[crossLength] - popover[crossLength]
    if (crossLengthDiff < 0) {
      pos[crossAxis] = Layout.center(crossLengthDiff)
    } else if (pos[crossAxis] + popover[crossLength] > frame[crossEnd]) {
      pos[crossAxis] = frame[crossEnd] - popover[crossLength]
    } else if (pos[crossAxis] < frame[crossStart]) {
      pos[crossAxis] = frame[crossStart]
    }
  }

  return pos
}

/**
 * Calculate the tip position relative to the popover.
 */
const calcTipPosition = (
  zone: Zone,
  target: BB.BoundingBox,
  popover: BB.BoundingBox,
  tip: BB.BoundingBox,
  // TODO
  tipSize: number = 0,
): Layout.Pos => {
  const isAfter = zone.side === "Left" || zone.side === "Top"
  const orientation = Ori.fromSide(zone)
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)
  // console.log('popover[crossStart], target[crossStart]', popover[crossStart], target[crossStart])
  const innerMostBefore = F.max(popover[crossStart], target[crossStart])
  // console.log('popover[crossEnd], target[crossEnd]', popover[crossEnd], target[crossEnd])
  const innerMostAfter = F.min(popover[crossEnd], target[crossEnd])

  tip // TODO remove
  // console.log(innerMostBefore, innerMostAfter)
  // console.log(
  //   "Layout.centerBetween(innerMostBefore, innerMostAfter)",
  //   Layout.centerBetween(innerMostBefore, innerMostAfter),
  // )
  const pos = {
    [Ori.crossAxis(orientation)]:
      innerMostAfter - innerMostBefore < tipSize * 2
        ? target[crossStart] > popover[crossStart]
          ? popover.height - tipSize
          : tipSize
        : Layout.centerBetween(innerMostBefore, innerMostAfter) -
          // Make the measurement relative to the popover by excluding space up to the popover's start.
          popover[crossStart],
    // If the tip is to be positioned "after the popover" (meaning rightward or belowward)
    // then we have to offset the tip position by popover length to get it over there.
    [Ori.mainAxis(orientation)]: isAfter
      ? popover[Ori.mainDim(orientation)]
      : 0,
  } as Layout.Pos
  // TODO document that in vertical case (main position) we substract
  // tipSize because rotation does not actually change where paints
  // from and that... in horizontal case (cross position) to center
  // the tip. This assumes that the arrow is intrinsically (0deg) of
  // shape ">" making for an e.g. 8x16 dimension box.
  pos.y -= tipSize
  return pos
}

type Zone = Layout.Size & {
  side: Ori.Side
  areaPercentageRemaining: number
  popoverNegAreaPercent: number
}

type ArrangementUnchecked = {
  frame: BB.BoundingBox
  target: BB.BoundingBox
  popover: BB.BoundingBox
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
  const isTipEnabled = Boolean(settings.tipSize)
  const arrangement = (isTipEnabled
    ? arrangementUnchecked
    : {
        ...arrangementUnchecked,
        tip: BB.make(0, 0),
      }) as Arrangement

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
    ? // TODO: Expose calculating absolute tip position via setting
      calcTipPosition(
        zone,
        arrangement.target,
        // Since the tip is positionned relative to the popover
        // and since part of the tip positionning algorithm relies
        // on the absolute position of popover we therefore must
        // get an updated boundig box for popover in lieu of the
        // brand new position we just calculated for it.
        BB.fromSizePosition(arrangement.popover, popoverPosition),
        arrangement.tip,
        settings.tipSize || 0,
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
 * forto algorithm. This function relieves the caller from having to
 * manage that state.
 */
const createLayoutCalculator = (
  settings: Settings.SettingsUnchecked,
): LayoutCalculator => {
  let previousZoneSide: Ori.Side

  return newBounds => {
    const layout = calcLayout(settings, newBounds, previousZoneSide || null)
    previousZoneSide = layout.zone.side
    return layout
  }
}

export {
  Settings,
  adjustRankingForChangeThreshold,
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
  calcTipPosition,
  calcLayout,
  Arrangement,
  ArrangementUnchecked,
  Calculation,
  Zone,
  MeasuredZone,
  createLayoutCalculator,
  Ori,
}
