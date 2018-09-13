import * as BB from "../BoundingBox"
import * as Layout from "../Layout"

/**
 * Determine if the given value is the window.
 */
const isWindow = (x: any): x is Window => {
  return x === window
}

const calcScrollSize = (scrollable: Window | HTMLElement): Layout.Size => {
  return isWindow(scrollable)
    ? {
        width: scrollable.scrollX || scrollable.pageXOffset,
        height: scrollable.scrollY || scrollable.pageYOffset,
      }
    : { width: scrollable.scrollLeft, height: scrollable.scrollTop }
}

/**
 * Get the Bounding Box of an HTML Element.
 */
const calcHTMLElementBoundingBox = (el: HTMLElement): BB.BoundingBox => {
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

// TODO Regression test that we use inner not outer prop for measuring
const calcWindowBoundingBox = (w: Window) => {
  return {
    width: w.innerWidth,
    height: w.innerHeight,
    top: 0,
    bottom: w.innerHeight,
    left: 0,
    right: w.innerWidth,
  }
}

const calcBoundingBox = (sizable: Window | HTMLElement): BB.BoundingBox => {
  return isWindow(sizable)
    ? calcWindowBoundingBox(sizable)
    : calcHTMLElementBoundingBox(sizable)
}

export { calcBoundingBox, calcScrollSize, isWindow }
