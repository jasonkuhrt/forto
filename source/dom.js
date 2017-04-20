import Main from "./Main"
import F from "./prelude"
import Observable from "zen-observable"
import ERD from "element-resize-detector"



// Constructor tries to run body.insertBefore
// https://github.com/wnr/element-resize-detector/blob/ad30e37d44a90c3c0bfaeed392755641d8dde469/dist/element-resize-detector.js#L490
// so we must wait for after DOM ready event
let erd
document.addEventListener("DOMContentLoaded", () => {
  erd = ERD({
    strategy: "scroll"
  })
})

/* We want to calculate the popover positon for a DOM UI and if there are
any changes in the given arrangement then re-calculate said position. We do
not want to apply the positioning because the implementation will vary
according the animation strategy being used. For example one system may want
to use CSS animation/transition while another uses React motion while another
uses React Interpolate. Only the former of the three examples would support
us directly assigning new positioning results to popover and tip. The other
examples listed would need to handle the application of positioning results */
const observeDomEvent = (eventName, element) => {
  return new Observable((observer) => {
    const isElementResize = eventName === "resize" && element !== window
    const observerNext = (event) => {
      observer.next(event)
    }
    if (isElementResize) {
      erd.listenTo(element, observerNext)
    } else {
      element.addEventListener(eventName, observerNext)
    }
    return function dispose () {
      if (isElementResize) {
        erd.removeListener(element, observerNext)
      } else {
        element.removeEventListener(eventName, observerNext)
      }
    }
  })
}

const observePeriodic = (everyMs) => {
  return new Observable((observer) => {
    const intervalId = setInterval(() => observer.next(), everyMs)
    return () => {
      clearInterval(intervalId)
    }
  })
}

const mergeObservables = (a, b) => {
  return new Observable((observer) => {
    const subs = [
      a.subscribe(observer),
      b.subscribe(observer),
    ]
    return () => {
      subs.forEach((sub) => {
        sub.unsubscribe()
      })
    }
  })
}

// Make props enumerable so that we can leverage isEqual later
const getBoundingClientRect = (el) => {
  const {
    width,
    height,
    top,
    bottom,
    left,
    right
  } = el.getBoundingClientRect()
  return {
    width,
    height,
    top,
    bottom,
    left,
    right
  }
}

const calcArrangementBounds = ({ frame, ...elems }) => {
  const elemsBounds = F.mapObject(elems, getBoundingClientRect)
  const frameBounds =
    frame === window
      ? {
        width: window.outerWidth,
        height: window.outerHeight,
        top: 0,
        bottom: window.outerHeight,
        left: 0,
        right: window.outerWidth,
      }
      : getBoundingClientRect(frame)
  return {
    frame: frameBounds,
    ...elemsBounds
  }
}

const observeArrChanges = (arrangement) =>
  new Observable((observer) => {
    const subs = [
      // Watch for scroll events in the frame
      observeDomEvent("scroll", arrangement.frame)
        .subscribe(() => { observer.next() }),
      // Watch all elements in the arrangement for resizes
      ...Object
        .values(arrangement)
        .map((el) => (
          observeDomEvent("resize", el)
          .subscribe(() => { observer.next() })
        ))
    ]
    const cleanUp = () => {
      subs.forEach((sub) => {
        sub.unsubscribe()
      })
    }
    return cleanUp
  })
  .map(() => (
    calcArrangementBounds(arrangement)
  ))



// Main Entry Points

const observe = (arrangement) => (
  observeArrChanges(arrangement)
  .map(Main.calcLayoutFromArrangement)
)

const observeWithPolling = (intervalMs, arrangement) => {
  let arrangementBounds = calcArrangementBounds(arrangement)
  return (
    mergeObservables(
      observeArrChanges(arrangement),
      // If the position of any arrangement elements change we need to
      // recalculate layout to see if final layout is affected. There is no
      // way to do this without polling.
      observePeriodic(intervalMs)
        .map(() =>
          calcArrangementBounds(arrangement)
        )
        .filter((arrangementBoundsNow) => {
          const arrangementBoundsBefore = arrangementBounds
          arrangementBounds = arrangementBoundsNow
          return !F.isEqual(arrangementBoundsBefore, arrangementBoundsNow)
        })
    )
    .map(Main.calcLayoutFromArrangement)
  )
}



export default {
  observeDomEvent,
  observe,
  observeWithPolling,
}
export {
  observeDomEvent,
  observe,
  observeWithPolling,
}
