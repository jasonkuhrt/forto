/* This module is concerned with integrating the forto layout system with the DOM.

We want to calculate the popover positon for a DOM UI and if there are
any changes in the given arrangement then re-calculate said position. We do
not want to apply the positioning because the implementation will vary
according the animation strategy being used. For example one system may want
to use CSS animation/transition while another uses React motion while another
uses React Interpolate. Only the former of the three examples would support
us directly assigning new positioning results to popover and tip. The other
examples listed would need to handle the application of positioning results */

import ElementResizeDetector from "element-resize-detector"
import Observable from "zen-observable"
import * as Main from "../Main"
import * as F from "../Prelude"
import * as Settings from "../Settings"
import * as H from "./Helpers"

type Arrangement = Record<keyof Main.Arrangement, HTMLElement>
type Frame = Window | HTMLElement

// Constructor tries to run body.insertBefore
// https://github.com/wnr/element-resize-detector/blob/ad30e37d44a90c3c0bfaeed392755641d8dde469/dist/element-resize-detector.js#L490
// so we must wait for after DOM ready event
let erd: ElementResizeDetector.Erd

const initializeERD = () => {
  erd = ElementResizeDetector({
    strategy: "scroll",
  })
}

if (typeof document === "object") {
  if (document.readyState === "complete") {
    initializeERD()
  } else {
    document.addEventListener("DOMContentLoaded", initializeERD)
  }
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

    if (!H.isWindow(element) && eventName === "resize") {
      erd.listenTo(element, observerNext)
    } else {
      element.addEventListener(eventName, observerNext)
    }

    return function dispose() {
      if (!H.isWindow(element)) {
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

const calcArrangementBounds = (arrangement: Arrangement): Main.Arrangement => {
  return F.mapObject(arrangement, H.calcBoundingBox)
}

/**
 * Measure all parts of the arrangement every time there is a relevent dom
 * event that might cause their values to change. This includes window scroll.
 */
const observeArrChanges = (
  arrangement: Arrangement,
): Observable<Main.Arrangement> => {
  const doMeasures = (): Main.Arrangement => {
    return calcArrangementBounds(arrangement)
  }

  const resizesAndFrameScrolls = new Observable<void>(observer => {
    const observerNext = (): void => {
      observer.next(undefined)
    }

    const subs = [
      // Watch all elements in the arrangement for resizes
      ...F.values(arrangement).map(el =>
        observeDomEvent("resize", el).subscribe(observerNext),
      ),
      // Watch for scroll events in the frame
      observeDomEvent("scroll", arrangement.frame).subscribe(observerNext),
    ]

    const tearDown = () => {
      for (const sub of subs) {
        sub.unsubscribe()
      }
    }

    return tearDown
  })

  return resizesAndFrameScrolls.map(doMeasures)
}

const createScrollOffseter = (
  frame: Frame,
): ((v: Main.Calculation) => Main.Calculation) => {
  return calculatedLayout => {
    const frameScrollSize = H.calcScrollSize(frame)
    calculatedLayout.popover.x += frameScrollSize.width
    calculatedLayout.popover.y += frameScrollSize.height
    return calculatedLayout
  }
}

// Main Entry Points

/**
 * Observe the arrangement for changes in bounds of any part and if changes
 * are detected then recalculate the layout. This does not actually execute
 * the layout changes, it merely provides what the latest coordinates of all
 * arrangement parts should be.
 */
const observe = (
  settings: Settings.SettingsUnchecked,
  arrangement: Arrangement,
): Observable<Main.Calculation> => {
  return observeArrChanges(arrangement)
    .map(Main.createLayoutCalculator(settings))
    .map(createScrollOffseter(arrangement.frame))
}

/**
 * Like `observe` except with the added fact that it will also poll for
 * arrangement bound changes at the given interval.
 *
 * This allows reacting to layout changes that have no event correspondance.
 * For example async content that once loaded increases the size of Popover.
 */
const observeWithPolling = (
  settings: Settings.SettingsUnchecked,
  arrangement: Arrangement,
  intervalMs: number,
): Observable<Main.Calculation> => {
  // We will hold some local state in order to detect when a change of bounds
  // in some part of the arrangement has occured.
  let currBounds: Main.Arrangement

  const doMeasures = (): Main.Arrangement => {
    return calcArrangementBounds(arrangement)
  }

  const doCheckChanges = (maybeDiffBounds: Main.Arrangement): boolean => {
    const isChange = !F.isEqual(maybeDiffBounds, currBounds)
    if (isChange) {
      currBounds = maybeDiffBounds
    }
    return isChange
  }

  currBounds = doMeasures()

  const eventedChanges = observeArrChanges(arrangement)
  const uneventedChanges = observePeriodic(intervalMs)
    .map(doMeasures)
    .filter(doCheckChanges)

  return mergeObservables(eventedChanges, uneventedChanges)
    .map(Main.createLayoutCalculator(settings))
    .map(createScrollOffseter(arrangement.frame))
}

export { observeDomEvent, observe, observeWithPolling, Arrangement }
