type Position = {
  x: number
  y: number
}

type BoundingBox = Position & {
  top: number
  bottom: number
  left: number
  right: number
}

/**
 * Create a bounding box.
 */
const make = (width: number, height: number) => ({
  top: 0,
  bottom: height,
  left: 0,
  right: width,
  width,
  height,
})

/**
 * Update a box's bounds.
 */
const translate = (x: number, y: number, box: BoundingBox) => ({
  ...box,
  top: box.top + y,
  bottom: box.bottom + y,
  left: box.left + x,
  right: box.right + x,
})

export { make, translate }
