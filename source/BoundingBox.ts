import * as Layout from "./Layout"

type BoundingBox = {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}

/**
 * Create a bounding box.
 */
const make = (width: number, height: number): BoundingBox => ({
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
const translate = (x: number, y: number, box: BoundingBox): BoundingBox => ({
  width: box.width,
  height: box.height,
  top: box.top + y,
  bottom: box.bottom + y,
  left: box.left + x,
  right: box.right + x,
})

/**
 * Create a bounding box from size and position data.
 */
const fromSizePosition = (size: Layout.Size, pos: Layout.Pos): BoundingBox => ({
  ...size,
  left: pos.x,
  top: pos.y,
  bottom: pos.y + size.height,
  right: pos.x + size.width,
})

export { make, translate, BoundingBox, fromSizePosition }
