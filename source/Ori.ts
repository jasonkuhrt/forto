enum Side {
  Top = "Top",
  Bottom = "Bottom",
  Left = "Left",
  Right = "Right",
}

enum Ori {
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

type OfASidea = {
  side: Side
}

const isHorizontalValue = (side: Side): boolean => {
  return side === Side.Right || side === Side.Left
}

/**
 * Check which orientation the side is that something is in.
 */
const isHorizontal = (ofASide: OfASidea): boolean => {
  // https://stackoverflow.com/questions/39785320/how-to-compare-enums-in-typescript
  return isHorizontalValue(ofASide.side)
}

/**
 * Get the orientation of the side something is in.
 */
const fromSide = (ofASide: OfASidea): Ori => {
  return [Side.Right, Side.Left].indexOf(ofASide.side) !== -1
    ? Ori.Horizontal
    : Ori.Vertical
}

const crossDim = (ori: Ori) => (ori === Ori.Horizontal ? "height" : "width")

const mainDim = (ori: Ori) => (ori === Ori.Horizontal ? "width" : "height")

const mainAxis = (ori: Ori) => (ori === Ori.Horizontal ? "x" : "y")

const crossAxis = (ori: Ori) => (ori === Ori.Horizontal ? "y" : "x")

const mainEnd = (ori: Ori) => (ori === Ori.Horizontal ? "right" : "bottom")

const mainStart = (ori: Ori) => (ori === Ori.Horizontal ? "left" : "top")

const crossEnd = (ori: Ori) => (ori === Ori.Horizontal ? "bottom" : "right")

const crossStart = (ori: Ori) => (ori === Ori.Horizontal ? "top" : "left")

const mainLength = (ori: Ori) => (ori === Ori.Horizontal ? "width" : "height")

const crossLength = (ori: Ori) => (ori === Ori.Horizontal ? "height" : "width")

const opposite = (ori: Ori) =>
  ori === Ori.Horizontal ? Ori.Vertical : Ori.Horizontal

export {
  isHorizontal,
  isHorizontalValue,
  fromSide,
  crossDim,
  mainDim,
  mainAxis,
  crossAxis,
  mainEnd,
  mainStart,
  crossEnd,
  crossStart,
  mainLength,
  crossLength,
  opposite,
  Ori,
  Side,
  OfASidea,
}
