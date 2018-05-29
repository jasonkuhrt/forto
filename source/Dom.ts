/* This module is concerned with integrating the forto layout system with the DOM.

We want to calculate the popover positon for a DOM UI and if there are
any changes in the given arrangement then re-calculate said position. We do
not want to apply the positioning because the implementation will vary
according the animation strategy being used. For example one system may want
to use CSS animation/transition while another uses React motion while another
uses React Interpolate. Only the former of the three examples would support
us directly assigning new positioning results to popover and tip. The other
examples listed would need to handle the application of positioning results */

import Observable from "zen-observable"
import ElementResizeDetector from "element-resize-detector"
import * as BB from "./BoundingBox"
import * as Main from "./Main"
import * as F from "./Prelude"
import * as Ori from "./Ori"

type Arrangement = Record<keyof Main.Arrangement, HTMLElement>

// Constructor tries to run body.insertBefore
// https://github.com/wnr/element-resize-detector/blob/ad30e37d44a90c3c0bfaeed392755641d8dde469/dist/element-resize-detector.js#L490
// so we must wait for after DOM ready event
let erd: ElementResizeDetector.Erd

const initializeERD = () => {
  erd = ElementResizeDetector({
    strategy: "scroll",
  })
}

if (document.readyState === "complete") {
  initializeERD()
} else {
  document.addEventListener("DOMContentLoaded", initializeERD)
}

/**
 * Determine if the given value is the window.
 */
const isWindow = (x: any): x is Window => {
  return x === window
}

/**
 * Observe a dom event. Handles the case of listening to resize events on
 * a dom element. Normally this is only possible on window.
 */
const observeDomEvent = (
  eventName: string,
  element: HTMLElement | Window,
): Observable<Event | HTMLElement> => {
  return new Observable<Event | HTMLElement>(observer => {
    const observerNext = (elem: Event | HTMLElement): void => {
      observer.next(elem)
    }

    if (!isWindow(element) && eventName === "resize") {
      erd.listenTo(element, observerNext)
    } else {
      element.addEventListener(eventName, observerNext)
    }

    return function dispose() {
      if (!isWindow(element)) {
        erd.removeListener(element, observerNext)
      } else {
        element.removeEventListener(eventName, observerNext)
      }
    }
  })
}

/**
 * Create an observable that signals periodically.
 */
const observePeriodic = (everyMs: number): Observable<void> => {
  return new Observable(observer => {
    const intervalId = setInterval(() => observer.next(undefined), everyMs)
    return function dispose() {
      clearInterval(intervalId)
    }
  })
}

/**
 * Merge two observables together.
 */
const mergeObservables = <A, B>(
  a: Observable<A>,
  b: Observable<B>,
): Observable<A & B> => {
  return new Observable(observer => {
    const subs = [a.subscribe(observer), b.subscribe(observer)]
    return () => {
      for (const sub of subs) {
        sub.unsubscribe()
      }
    }
  })
}

/**
 * Calculate the bounds of each part of the arrangement.
 */
const calcArrangementBounds = ({
  frame,
  ...elems
}: Arrangement): Main.Arrangement => {
  const elemsBounds = F.mapObject(elems, BB.fromHTMLElement)
  const frameBounds: BB.BoundingBox = isWindow(frame)
    ? {
        width: window.outerWidth,
        height: window.outerHeight,
        top: 0,
        bottom: window.outerHeight,
        left: 0,
        right: window.outerWidth,
      }
    : BB.fromHTMLElement(frame)
  return {
    frame: frameBounds,
    ...elemsBounds,
  }
}

/**
 * Measure all parts of the arrangement every time there is a relevent dom
 * event that might cause their values to change. This includes window scroll.
 */
const observeArrChanges = (
  arrangement: Arrangement,
): Observable<Main.Arrangement> => {
  return new Observable<void>(observer => {
    const subs = [
      // Watch for scroll events in the frame
      observeDomEvent("scroll", arrangement.frame).subscribe(() => {
        observer.next(undefined)
      }),
      // Watch all elements in the arrangement for resizes
      ...F.values(arrangement).map(el =>
        observeDomEvent("resize", el).subscribe(() => {
          observer.next(undefined)
        }),
      ),
    ]
    const cleanUp = () => {
      for (const sub of subs) {
        sub.unsubscribe()
      }
    }
    return cleanUp
  }).map(() => calcArrangementBounds(arrangement))
}

// Main Entry Points

/**
 * Observe the arrangement for changes in bounds of any part and if changes
 * are detected then recalculate the layout. This does not actually execute
 * the layout changes, it merely provides what the latest coordinates of all
 * arrangement parts should be.
 */
const observe = (
  settings: Main.SettingsUnchecked,
  arrangement: Arrangement,
): Observable<Main.Calculation> => {
  let previousZoneSide: Ori.Side
  return observeArrChanges(arrangement).map(arrangementNow => {
    const result = Main.calcLayout(
      settings,
      arrangementNow,
      previousZoneSide || null,
    )
    previousZoneSide = result.zone.side
    return result
  })
}

/**
 * Like `observe` except with the added fact that it will also poll for
 * arrangement bound changes at the given interval.
 *
 * This allows reacting to layout changes that have no event correspondance.
 * For example async content that once loaded increases the size of Popover.
 */
const observeWithPolling = (
  intervalMs: number,
  arrangement: Arrangement,
): Observable<Main.Calculation> => {
  let arrangementBounds = calcArrangementBounds(arrangement)
  return mergeObservables(
    observeArrChanges(arrangement),
    // If the position of any arrangement elements change we need to
    // recalculate layout to see if final layout is affected. There is no
    // way to do this without polling.
    observePeriodic(intervalMs)
      .map(() => calcArrangementBounds(arrangement))
      .filter(arrangementBoundsNow => {
        const arrangementBoundsBefore = arrangementBounds
        arrangementBounds = arrangementBoundsNow
        return !F.isEqual(arrangementBoundsBefore, arrangementBoundsNow)
      }),
  ).map(arrangementNow => Main.calcLayout({}, arrangementNow, null))
}

export { observeDomEvent, observe, observeWithPolling, Arrangement }
