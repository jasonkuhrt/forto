/* eslint-disable */
// @flow
const F = {}

F.first = (x) => (
  x[0]
)

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

const Orientation = {}

Orientation.isHorizontal = (ofASide) : boolean => (
  ["Right", "Left"].indexOf(ofASide.side) !== -1
)

const max = (ceiling, n) => (
  n <= ceiling ? n : ceiling
)

const calcFit = (
  popover : BoundingBox,
  tip : BoundingBox,
  measuredZone : MeasuredZone
) : FittedZone => {
  const popoverTip =
    Orientation.isHorizontal(measuredZone)
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



export type {
  MeasuredZone,
  FittedZone,
}

export default {
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
}

export {
  measureZones,
  calcFit,
  rankZones,
  optimalZone,
}
