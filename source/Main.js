/* eslint-disable */
// @flow

import F from "./prelude"

const min = (x : number, o : number) : number => (
  x <= o ? x : o
)
const max = (x : number, o : number) : number => (
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
const area = (size : any) : number => (
  size.width * size.height
)

const compare = (a : number, b : number) => (
  a <   b ? -1 :
  a >   b ?  1 :
             0
)

const center = (n) => n / 2


// TODO
// * Optimal zone measurements that factor in Thresholds
// * preferred zones
// * elligible zones
// * mode unbounded
// * Tip disabling
// * API
type Orientation =
  | "Horizontal"
  | "Vertical"

const horizontal : Orientation = "Horizontal"
const vertical : Orientation = "Vertical"

type Position = {
  x : number,
  y : number,
}

// type Order =
//   | "Before"
//   | "After"
//
// const before : Order = "Before"
// const after : Order = "After"

type Side =
  | "Top"
  | "Bottom"
  | "Left"
  | "Right"
// type EligibleZones =
//   | "Vertical"
//   | "Horizontal"
//   | "Before"
//   | "After"
//   | "Top"
//   | "Bottom"
//   | "Left"
//   | "Right"

// type Config = {
//   elligibleZones: EligibleZones,
// }
type Zone = {
  side : Side,
}
type Size = {
  width : number,
  height : number,
}
type BoundingBox = {
  top : number,
  bottom : number,
  left : number,
  right : number,
  width : number,
  height : number,
}

type MeasuredZone = {
  side : Side,
  width : number,
  height : number,
}

type FittedZone = {
  side : Side,
  width : number,
  height : number,
  popoverNegAreaPercent : number
}

const BoundingBoxFromSizePosition = (
  size : Size,
  position : Position
) : BoundingBox => ({
  ...size,
  left: position.x,
  top: position.y,
  bottom: position.y + size.height,
  right: position.x + size.width,
})

const measureZones = (
  target: BoundingBox,
  frame: BoundingBox
) : Array<MeasuredZone> => {
  return [
    {
      side: "Top",
      width: frame.width,
      height: target.top - frame.top,
    },
    {
      side: "Bottom",
      width: frame.width,
      height: frame.bottom - target.bottom,
    },
    {
      side: "Left",
      width: target.left - frame.left,
      height: frame.height,
    },
    {
      side: "Right",
      width: frame.right - target.right,
      height: frame.height,
    },
  ]
}

const Ori = {}

Ori.isHorizontal = (ofASide) : boolean => (
  ["Right", "Left"].indexOf(ofASide.side) !== -1
)

Ori.fromSide = (ofASide) : Orientation => (
  ["Right", "Left"].indexOf(ofASide.side) !== -1 ? "Horizontal" : "Vertical"
)

Ori.crossDim = (ori : Orientation) => (
  ori === horizontal ? "height" : "width"
)

Ori.mainDim = (ori : Orientation) => (
  ori === vertical ? "width" : "height"
)

Ori.mainAxis = (ori : Orientation) => (
  ori === horizontal ? "x" : "y"
)

Ori.crossAxis = (ori : Orientation) => (
  ori === horizontal ? "y" : "x"
)

Ori.mainEnd = (ori : Orientation) => (
  ori === horizontal ? "right" : "bottom"
)

Ori.mainStart = (ori : Orientation) => (
  ori === horizontal ? "left" : "top"
)

Ori.crossEnd = (ori : Orientation) => (
  ori === horizontal ? "bottom" : "right"
)

Ori.crossStart = (ori : Orientation) => (
  ori === horizontal ? "top" : "left"
)

Ori.mainLength = (ori : Orientation) => (
  ori === horizontal ? "width" : "height"
)

Ori.crossLength = (ori : Orientation) => (
  ori === horizontal ? "height" : "width"
)
Ori.opposite = (ori : Orientation) => (
  ori === horizontal ? vertical : horizontal
)

// Ori.orderOf = (ofASide) : Order => (
//   ["Left", "Top"].indexOf(ofASide.side) ? after : before
// )


const calcFit = (
  popover : Size,
  tip : BoundingBox,
  measuredZone : MeasuredZone
) : FittedZone => {
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



const rankZones = (zoneFits : Array<FittedZone>) : Array<FittedZone> => (
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

const optimalZone = (
  frame : BoundingBox,
  target : BoundingBox,
  popover : Size,
  tip : any
) : Zone => {
  return (
    F.first(
      rankZones(
        measureZones(target, frame).map((zone) =>
          calcFit(popover, tip, zone)
        )
      )
    )
  )
}



const calcPopoverPosition = (
  frame : BoundingBox,
  target : BoundingBox,
  popover : Size,
  zone : Zone
) : Position => {
  const ori = Ori.fromSide(zone)
  const p : Position = { x: 0, y: 0 }
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
  if (frameTargetEndDiff < 0)
    targetCrossAxisCrossPos += center(frameTargetEndDiff)
  const frameTargetStartDiff = target[crossStart] - frame[crossStart]
  if (frameTargetStartDiff < 0)
    targetCrossAxisCrossPos -= center(frameTargetStartDiff)

  p[crossAxis] = targetCrossAxisCrossPos - center(popover[crossLength])

  /* If the popover exceeds Frame bounds on both ends center it between them. */
  const crossLengthDiff = frame[crossLength] - popover[crossLength]
  if (crossLengthDiff < 0) {
    p[crossAxis] = center(crossLengthDiff)
  } else if (p[crossAxis] + popover[crossLength] > frame[crossEnd]) {
    p[crossAxis] = frame[crossEnd] - popover[crossLength]
  } else if (p[crossAxis] < 0) {
    p[crossAxis] = 0
  }
  return p
}

const calcTipPosition = (
  orientation : Orientation,
  target : BoundingBox,
  popover : BoundingBox,
  tip : Size
) : any => {
  const crossStart = Ori.crossStart(orientation)
  const crossEnd = Ori.crossEnd(orientation)
  const crossLength = Ori.crossEnd(orientation)
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

type Arrangement = {
  frame: BoundingBox,
  target: BoundingBox,
  popover: Size,
  tip: Size,
}

const calcLayout = (arrangement : Arrangement) : any => {
  const {
    frame,
    target,
    popover,
    tip,
  } = arrangement
  const zone = optimalZone(frame, target, popover, tip)
  const popoverPosition = calcPopoverPosition(frame, target, popover, zone)
  const popoverBoundingBox =
    BoundingBoxFromSizePosition(popover, popoverPosition)
  const tipPosition = calcTipPosition(Ori.fromSide(zone), target, popoverBoundingBox, tip)
  return ({
    popover: popoverPosition,
    tip: tipPosition,
  })
}


export type {
  MeasuredZone,
  FittedZone,
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
