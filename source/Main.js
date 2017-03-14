// @flow

type EligibleZones =
  | "Vertical"
  | "Horizontal"
  | "Before"
  | "After"
  | "Top"
  | "Bottom"
  | "Left"
  | "Right"

type Config = {
  elligibleZones: EligibleZones,
}

type BoundingBox = {
  top: number,
  bottom: number,
  left: number,
  right: number,
  width: number,
  height: number,
}

type Dimensions = {
  width: number,
  height: number,
}

type ZoneDimensions = {
  top: Dimensions,
  bottom: Dimensions,
  left: Dimensions,
  right: Dimensions,
}

const measureZones = (
  target: BoundingBox,
  frame: BoundingBox
) : ZoneDimensions => {
  return {
    top: {
      width: frame.width,
      height: target.top - frame.top,
    },
    bottom: {
      width: frame.width,
      height: frame.bottom - target.bottom,
    },
    left: {
      width: target.left - frame.left,
      height: frame.height,
    },
    right: {
      width: frame.right - target.right,
      height: frame.height,
    },
  }
}



export default {
  measureZones,
}
export {
  measureZones,
}
