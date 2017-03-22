/* eslint-disable */
// @flow

import F from "./prelude"

// TODO
// * Optimal zone measurements that factor in Thresholds
// * preferred zones
// * elligible zones
// * Popover positioning
// * Tip positioning
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

Ori.of = (ofASide) : Orientation => (
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

Ori.crossEnd = (ori : Orientation) => (
  ori === horizontal ? "bottom" : "right"
)

Ori.mainLength = (ori : Orientation) => (
  ori === horizontal ? "width" : "height"
)

Ori.crossLength = (ori : Orientation) => (
  ori === horizontal ? "height" : "width"
)

// Ori.orderOf = (ofASide) : Order => (
//   ["Left", "Top"].indexOf(ofASide.side) ? after : before
// )

const max = (ceiling, n) => (
  n <= ceiling ? n : ceiling
)

const calcFit = (
  popover : BoundingBox,
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
  const popoverNegAreaW = diffW >= 0 ? 0 : Math.abs(diffW * (popoverTip.height - Math.abs(max(0, diffH))))
  const popoverNegArea = popoverNegAreaH + popoverNegAreaW
  const popoverNegAreaPercent = popoverNegArea / area(popoverTip)
  return (
    Object.assign({}, measuredZone, {
      popoverNegAreaPercent,
    })
  )
}

const area = (size : any) : number => (
  size.width * size.height
)

const compare = (a : number, b : number) => (
  a <   b ? -1 :
  a >   b ?  1 :
             0
)

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
  popover : BoundingBox,
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


const center = (n) => n / 2

const calcPopoverPosition = (
  frame : BoundingBox,
  target : BoundingBox,
  popover : Size,
  zone : Zone
) : Position => {
  const ori = Ori.of(zone)
  const p : Position = { x: 0, y: 0 }
  const crossAxis = Ori.crossAxis(ori)
  const crossEnd = Ori.crossEnd(ori)
  const crossLength = Ori.crossLength(ori)

  /* Place the popover next to the target. */
  p[Ori.mainAxis(ori)] =
    ["Left", "Top"].indexOf(zone.side) !== -1
      ? target[Ori.mainStart(ori)] - popover[Ori.mainDim(ori)]
      : target[Ori.mainEnd(ori)]

  /* Align the popover's cross-axis with that of target. */
  p[crossAxis] =
    (target[crossEnd] - center(target[crossLength])) -
    center(popover[crossLength])

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
}

export {
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
  calcPopoverPosition,
}
