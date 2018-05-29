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
 * Get the Bounding Box of an HTML Element.
 */
const fromHTMLElement = (el: HTMLElement): BoundingBox => {
  // Create object literal so that props become enumerable and we
  // can leverage isEqual later.
  const { width, height, top, bottom, left, right } = el.getBoundingClientRect()
  return {
    width,
    height,
    top,
    bottom,
    left,
    right,
  }
}

const fromWindow = (w: Window) => {
  return {
    width: w.outerWidth,
    height: w.outerHeight,
    top: 0,
    bottom: w.outerHeight,
    left: 0,
    right: w.outerWidth,
  }
}

export { make, translate, fromHTMLElement, BoundingBox, fromWindow }
