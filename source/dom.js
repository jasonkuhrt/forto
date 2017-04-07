import Main from "./Main"
import F from "./prelude"
import Observable from "zen-observable"
import OnResize from "element-resize-detector"

// TODO This tries to run body.insertBefore
// https://github.com/wnr/element-resize-detector/blob/ad30e37d44a90c3c0bfaeed392755641d8dde469/dist/element-resize-detector.js#L490
// so we must wait for after DOM ready event
const onResize = OnResize({
  strategy: "scroll"
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
    const isElementResize = eventName === "resize" && element === window
    const onEvent = (event) => {
      observer.next(event)
    }
    const cleanUp = () => {
      if (isElementResize) {
        onResize.removeListener(element, onEvent)
      } else {
        element.removeEventListener(eventName, onEvent)
      }
    }
    if (isElementResize) {
      onResize.listenTo(element, onEvent)
    } else {
      element.addEventListener(eventName, onEvent)
    }
    return cleanUp
  })
}

const observePeriodic = (everyMs) => {
  return new Observable((observer) => {
    const intervalId = setInterval(everyMs, () => observer.next())
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

const calcArrangementBounds = (arrangement) => {
  return (
    F.mapObject(
      arrangement,
      (x) => x.getBoundingClientRect()
    )
  )
}

const onArrangementChange = (intervalMs, arrangement) =>
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



// Main Module Entry Points

const main = (arrangement) => (
  onArrangementChange(arrangement)
  .map(Main.calcLayout)
)

const includingPositionChanges = (intervalMs, arrangement) => {
  let arrangementBounds = calcArrangementBounds(arrangement)
  return (
    mergeObservables(
      onArrangementChange(arrangement),
      // If the position of any arrangement elements change we need to
      // recalculate layout to see if final layout is affected. There is no
      // way to do this without polling.
      observePeriodic(intervalMs)
      .filter(() => {
        const arrangementBoundsBefore = arrangementBounds
        arrangementBounds = calcArrangementBounds(arrangement)
        return F.deepEqualObjects(arrangementBoundsBefore, arrangementBounds)
      }),
    )
    .map(Main.calcLayout)
  )
}



export default {
  main,
  includingPositionChanges,
}
export {
  main,
  includingPositionChanges,
}
