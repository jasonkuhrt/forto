type Orientation = "Horizontal" | "Vertical"

type Pos = {
  x: number
  y: number
}

type Size = {
  height: number
  width: number
}

/**
 * Calculate the mid point between two numbers.
 */
const centerBetween = (x: number, o: number): number => {
  return x > o ? 0 : center(o - x) + x
}

const centerOf = (orientation: Orientation, x: Size) => {
  return orientation === "Horizontal" ? center(x.width) : center(x.height)
}

/**
 * Calculate the half of a number.
 */
const center = (n: number): number => {
  return n / 2
}

/**
 * Calculate the area of a rectangular shape.
 */
const area = (size: Size): number => {
  return size.width * size.height
}

export { area, center, centerOf, centerBetween, Orientation, Pos, Size }
