import Observable from "zen-observable"
import ElementResizeDetector from "element-resize-detector"
import * as BB from "./BoundingBox"
import * as Main from "./Main"
import * as F from "./prelude"
import * as Ori from "./Ori"

type HTMLElementArrangement = { [k in keyof Main.Arrangement]: HTMLElement }

// Constructor tries to run body.insertBefore
// https://github.com/wnr/element-resize-detector/blob/ad30e37d44a90c3c0bfaeed392755641d8dde469/dist/element-resize-detector.js#L490
// so we must wait for after DOM ready event
let erd: ElementResizeDetector.Erd
document.addEventListener("DOMContentLoaded", () => {
  erd = ElementResizeDetector({
    strategy: "scroll",
  })
})

/**
 * Determine if the given value is the window.
 */
const isWindow = (x: any): x is Window => {
  return x === window
}

/* We want to calculate the popover positon for a DOM UI and if there are
any changes in the given arrangement then re-calculate said position. We do
not want to apply the positioning because the implementation will vary
according the animation strategy being used. For example one system may want
to use CSS animation/transition while another uses React motion while another
uses React Interpolate. Only the former of the three examples would support
us directly assigning new positioning results to popover and tip. The other
examples listed would need to handle the application of positioning results */
const observeDomEvent = (
  eventName: string,
  element: HTMLElement | Window,
): Observable<void> => {
  return new Observable<void>(observer => {
    const observerNext = () => {
      observer.next(undefined)
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
 * TODO
 */
const calcArrangementBounds = ({
  frame,
  ...elems
}: HTMLElementArrangement): Main.Arrangement => {
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
 * TODO
 */
const observeArrChanges = (
  arrangement: HTMLElementArrangement,
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
 * TODO
 */
const observe = (
  settings: Main.SettingsUnchecked,
  arrangement: HTMLElementArrangement,
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
 * TODO
 */
const observeWithPolling = (
  intervalMs: number,
  arrangement: HTMLElementArrangement,
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

export { observeDomEvent, observe, observeWithPolling }
