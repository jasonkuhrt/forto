import Observable from "zen-observable"
import ElementResizeDetector from "element-resize-detector"
import * as H from "./Helpers"

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
const domEvent = (
  eventName: string,
  element: Element | Window,
): Observable<Event | Element> => {
  return new Observable<Event | HTMLElement>(observer => {
    const observerNext = (elem: Event | HTMLElement): void => {
      observer.next(elem)
    }

    // TODO: `any` is a hack here. Its not even clear if this code is correct.
    // See https://github.com/wnr/element-resize-detector/issues/100.
    //
    // If it turns out this is a bug and not just some poorly specified types
    // then we will need to test element to check if it is of type HTMLElement.
    //
    // The reason we accept Element currently is to support react-popover.

    if (!H.isWindow(element) && eventName === "resize") {
      erd.listenTo(element as any, observerNext)
    } else {
      element.addEventListener(eventName, observerNext)
    }

    return function dispose() {
      if (!H.isWindow(element)) {
        erd.removeListener(element as any, observerNext)
      } else {
        element.removeEventListener(eventName, observerNext)
      }
    }
  })
}

/**
 * Create an observable that signals periodically.
 */
const periodic = (everyMs: number): Observable<void> => {
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
const merge = <A, B>(a: Observable<A>, b: Observable<B>): Observable<A & B> => {
  return new Observable(observer => {
    const subs = [a.subscribe(observer), b.subscribe(observer)]
    return () => {
      for (const sub of subs) {
        sub.unsubscribe()
      }
    }
  })
}

export { merge, domEvent, periodic, Observable }
