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
  targetNegAreaPercent : number
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

const calcFits = (popover, tip, measuredZones) : Array<FittedZone> => (
  measuredZones.map((zone) => {
    const [popoverWidth, popoverHeight] =
      Orientation.isHorizontal(zone)
        ? [popover.width + tip.height, popover.height]
        : [popover.width, popover.height + tip.height]
    const diffHeight = zone.height - popoverHeight
    const diffWidth = zone.width - popoverHeight
    const targetNegAreaH = diffHeight < 0 ? diffHeight * popoverWidth : 0
    const targetNegAreaW = diffWidth < 0 ? diffWidth * (popoverHeight - Math.abs(max(0, diffHeight))) : 0
    const targetNegArea = targetNegAreaH + targetNegAreaW
    const targetNegAreaPercent = targetNegArea / area(zone)
    return (
      Object.assign({}, zone, {
        targetNegAreaPercent,
      })
    )
  })
)

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
      a.targetNegAreaPercent < b.targetNegAreaPercent ?
        -1 :
      a.targetNegAreaPercent > b.targetNegAreaPercent ?
        1 :
      // Either neither have negative area or both have equally negative area.
      // In either case check which has the largest area
        compare(area(a), area(b))
    )
  })
)

const optimalZone = (target : BoundingBox, frame : BoundingBox, popover : BoundingBox, tip : any) : Zone => {
  return (
    F.first(rankZones(calcFits(popover, tip, measureZones(target, frame))))
  )
}



export default {
  measureZones,
}

export {
  measureZones,
}
