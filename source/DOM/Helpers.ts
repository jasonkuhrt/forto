import * as BB from "../BoundingBox"
import * as Layout from "../Layout"

/**
 * Determine if the given value is the window.
 */
const isWindow = (x: any): x is Window => {
  return x === window
}

/**
 * Calculate the scroll size of the given widow or element.
 */
const calcScrollSize = (scrollable: Window | Element): Layout.Size => {
  return isWindow(scrollable)
    ? {
        width: scrollable.scrollX || scrollable.pageXOffset,
        height: scrollable.scrollY || scrollable.pageYOffset,
      }
    : { width: scrollable.scrollLeft, height: scrollable.scrollTop }
}

/**
 * Calculate the bounding box of the given HTML element.
 */
const calcHTMLElementBoundingBox = (el: Element): BB.BoundingBox => {
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

/**
 * Calculate the boundig box of the widnow.
 * TODO Regression test that we use inner not outer prop for measuring
 */
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

/**
 * Calculate the bounding box of the given window or element. Dispatches to
 * the correct measuring function dependig on which is given
 */
const calcBoundingBox = (sizable: Window | Element): BB.BoundingBox => {
  return isWindow(sizable)
    ? calcWindowBoundingBox(sizable)
    : calcHTMLElementBoundingBox(sizable)
}

export { calcBoundingBox, calcScrollSize, isWindow }
