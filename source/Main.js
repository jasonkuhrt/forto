import F from "./prelude"

const min = (x, o) => (
  x <= o ? x : o
)
const max = (x, o) => (
  x >= o ? x : o
)
const centerBetween = (x, o) => (
  x > o
    ? 0
    : x + ((o - x) / 2)
)
const centerOf = (orientation, x) => (
  orientation === "Horizontal"
    ? x.width / 2
    : x.height / 2
)
const upperLimit = (ceiling, n) => (
  n <= ceiling ? n : ceiling
)
const area = (size) => (
  size.width * size.height
)

const compare = (a, b) => (
  a < b ? -1 :
  a > b ? 1 :
          0
)

const center = (n) => n / 2


// TODO
// * preferred zones
// * Tip disabling
// * Optimal zone measurements that factor in Thresholds
// * API

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

const measureZones = (target, frame) => {
  return [
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
}


const Oris = {
  Horizontal: "Horizontal",
  Vertical: "Vertical",
}

const Ori = {}

Ori.isHorizontal = (ofASide) => (
  [ Sides.Right, Sides.Left ].indexOf(ofASide.side) !== -1
)

Ori.fromSide = (ofASide) => (
  [ Sides.Right, Sides.Left ].indexOf(ofASide.side) !== -1
    ? Oris.Horizontal
    : Oris.Vertical
)

Ori.crossDim = (ori) => (
  ori === Oris.Horizontal ? "height" : "width"
)

Ori.mainDim = (ori) => (
  ori === Oris.Vertical ? "width" : "height"
)

Ori.mainAxis = (ori) => (
  ori === Oris.Horizontal ? "x" : "y"
)

Ori.crossAxis = (ori) => (
  ori === Oris.Horizontal ? "y" : "x"
)

Ori.mainEnd = (ori) => (
  ori === Oris.Horizontal ? "right" : "bottom"
)

Ori.mainStart = (ori) => (
  ori === Oris.Horizontal ? "left" : "top"
)

Ori.crossEnd = (ori) => (
  ori === Oris.Horizontal ? "bottom" : "right"
)

Ori.crossStart = (ori) => (
  ori === Oris.Horizontal ? "top" : "left"
)

Ori.mainLength = (ori) => (
  ori === Oris.Horizontal ? "width" : "height"
)

Ori.crossLength = (ori) => (
  ori === Oris.Horizontal ? "height" : "width"
)
Ori.opposite = (ori) => (
  ori === Oris.Horizontal ? Oris.Vertical : Oris.Horizontal
)

// Ori.orderOf = (ofASide) : Order => (
//   ["Left", "Top"].indexOf(ofASide.side) ? after : before
// )


const calcFit = (popover, tip, measuredZone) => {
  const popoverTip =
    Ori.isHorizontal(measuredZone)
      ? { width: popover.width + tip.height, height: popover.height }
      : { width: popover.width, height: popover.height + tip.height }
  const diffH = measuredZone.height - popoverTip.height
  const diffW = measuredZone.width - popoverTip.width
  const popoverNegAreaH = diffH >= 0 ? 0 : Math.abs(diffH * popoverTip.width)
  const popoverNegAreaW = diffW >= 0 ? 0 : Math.abs(diffW * (popoverTip.height - Math.abs(upperLimit(0, diffH))))
  const popoverNegArea = popoverNegAreaH + popoverNegAreaW
  const popoverNegAreaPercent = popoverNegArea / area(popoverTip)
  return (
    Object.assign({}, measuredZone, {
      popoverNegAreaPercent,
    })
  )
}



const rankZones = (zoneFits) => (
  zoneFits.sort((a, b) => {
    return (
      a.popoverNegAreaPercent < b.popoverNegAreaPercent ?
        -1 :
      a.popoverNegAreaPercent > b.popoverNegAreaPercent ?
        1 :
      // Either neither have negative area or both have equally negative area.
      // In either case check which has the largest area.
        // NOTE we inverse compare since it treats larger as coming later
        // but for us larger is better and hence should come first.
        compare(area(a), area(b)) * -1
    )
  })
)

const optimalZone = (settings, arrangement) => {
  // TODO We can optimize measureZones to apply the elligibleZones logic
  // so that it does not needlessly create objects.
  const zonesMeasured =
    settings.elligibleZones
      ? measureZones(arrangement.target, arrangement.frame)
        // TODO includes is ES2016 only
        .filter((zone) => settings.elligibleZones.includes(zone.side))
      : measureZones(arrangement.target, arrangement.frame)

  return (
    F.first(
      rankZones(
        zonesMeasured
        .map((zone) => calcFit(arrangement.popover, arrangement.tip, zone))
      )
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
  p[Ori.mainAxis(ori)] =
    [ "Left", "Top" ].indexOf(zone.side) !== -1
      ? target[Ori.mainStart(ori)] - popover[Ori.mainDim(ori)]
      : target[Ori.mainEnd(ori)]

  /* Align the popover's cross-axis center with that of target. Only the
  target length within frame should be considered. That is, find the
  cross-axis center of the part of target within the frame bounds, ignoring any
  length outside said frame bounds. */
  let targetCrossAxisCrossPos = target[crossStart] + center(target[crossLength])
  const frameTargetEndDiff = frame[crossEnd] - target[crossEnd]
  if (frameTargetEndDiff < 0)
    {targetCrossAxisCrossPos += center(frameTargetEndDiff)}
  const frameTargetStartDiff = target[crossStart] - frame[crossStart]
  if (frameTargetStartDiff < 0)
    {targetCrossAxisCrossPos -= center(frameTargetStartDiff)}

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
  const innerMostBefore = max(
    popover[crossStart],
    target[crossStart]
  )
  const innerMostAfter = min(
    popover[crossEnd],
    target[crossEnd]
  )
  return {
    [Ori.crossAxis(orientation)]:
      centerBetween(innerMostBefore, innerMostAfter)
      - centerOf(Ori.opposite(orientation), tip),
    [Ori.mainAxis(orientation)]: 0,
  }
}

const expandEligibleZoneShorthand = (elligibleZones) => {
  if (elligibleZones === Oris.Horizontal) return [ Sides.Left, Sides.Right ]
  if (elligibleZones === Oris.Vertical) return [ Sides.Top, Sides.Bottom ]
  if (elligibleZones === Orders.Before) return [ Sides.Top, Sides.Left ]
  if (elligibleZones === Orders.After) return [ Sides.Bottom, Sides.Right ]
  return [elligibleZones]
}

const checkAndNormalizeSettings = (settings) => {
  const isBounded = F.defaultsTo(true, settings.isBounded)
  const elligibleZones =
    F.isExists(settings.elligibleZones)
      ? expandEligibleZoneShorthand(settings.elligibleZones)
      : null
  return {
    isBounded,
    elligibleZones,
  }
}

const calcLayout = (settingsUnchecked, arrangement) => {
  const settings = checkAndNormalizeSettings(settingsUnchecked)
  const zone = optimalZone(settings, arrangement)
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
  const tipPosition = calcTipPosition(
    Ori.fromSide(zone),
    arrangement.target,
    popoverBoundingBox,
    arrangement.tip
  )
  return ({
    popover: popoverPosition,
    tip: tipPosition,
  })
}



export default {
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
  calcTipPosition,
  calcLayout,
}

export {
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
  calcTipPosition,
  calcLayout,
}
