/* This module is concerned with integrating the forto layout system with the DOM.

We want to calculate the popover positon for a DOM UI and if there are
any changes in the given arrangement then re-calculate said position. We do
not want to apply the positioning because the implementation will vary
according the animation strategy being used. For example one system may want
to use CSS animation/transition while another uses React motion while another
uses React Interpolate. Only the former of the three examples would support
us directly assigning new positioning results to popover and tip. The other
examples listed would need to handle the application of positioning results */

import { Observable } from "./Observable"
import * as Obs from "./Observable"
import * as Main from "../Main"
import * as F from "../Prelude"
import * as FortoSettings from "../Settings"
import * as H from "./Helpers"

type Frame = Window | Element

type Arrangement = {
  frame: Frame
  target: Element
  tip: Element
  popover: Element
}

type Settings = FortoSettings.SettingsUnchecked & {
  pollIntervalMs?: null | number
}

const calcArrangementBounds = (arrangement: Arrangement): Main.Arrangement => {
  return F.mapObject(arrangement, H.calcBoundingBox)
}

/**
 * Measure all parts of the arrangement every time there is a relevent dom
 * event that might cause their values to change. This includes window scroll.
 */
const observeArrChangesByEvents = (
  arrangement: Arrangement,
): Observable<Main.Arrangement> => {
  const doMeasures = (): Main.Arrangement => {
    return calcArrangementBounds(arrangement)
  }

  const resizesAndFrameScrolls = new Observable<void>(observer => {
    const observerNext = (): void => {
      observer.next(undefined)
    }

    // Observe things that can affect the Forto layout. That means
    // observe all elements in the arrangement (except the tip) for
    // resizes and observe the frame for scrolls.
    //
    // The tip is not observed because it is generally not a
    // dynamic piece of geometry that can/should affect the layout.
    const subs = [
      Obs.domEvent("resize", arrangement.frame),
      Obs.domEvent("resize", arrangement.popover),
      Obs.domEvent("resize", arrangement.target),
      // TODO throttle
      Obs.domEvent("scroll", arrangement.frame),
    ].map(stream => stream.subscribe(observerNext))

    const tearDown = () => {
      for (const sub of subs) {
        sub.unsubscribe()
      }
    }

    return tearDown
  })

  return resizesAndFrameScrolls.map(doMeasures)
}

/**
 * TODO
 */
const createScrollOffseter = (
  frame: Frame,
): ((v: Main.Calculation) => Main.Calculation) => {
  // incorrect assumption: frame contains target
  // more useful assumption: window scroll
  return calculatedLayout => {
    const frameScrollSize = H.calcScrollSize(frame)
    calculatedLayout.popover.x += frameScrollSize.width
    calculatedLayout.popover.y += frameScrollSize.height
    return calculatedLayout
  }
}

/**
 * A Wrapper around scroll offsetter hardcoded to window.
 *
 * *Rationale*
 *
 * It has become apparent that assuming `target` resides
 * in `frame` is not a safe assumption. And when it is not
 * the case scroll offsetter of frame would create incorrect
 * layout of popover as its position would change relative to
 * the frame scroll, but not the popover.
 *
 * On the other hand everything is within window. It may become
 * necessary to add option for consumer to disable frame
 * scrolling. Presently though, this function is a try/compromise.
 */
const createWindowScrollOffseter = () => {
  return createScrollOffseter(window)
}

// Main Entry Points

/**
 * Like `observe` but no polling option.
 */
const observeWithoutPolling = (
  settings: FortoSettings.SettingsUnchecked,
  arrangement: Arrangement,
): Observable<Main.Calculation> => {
  return observeArrChangesByEvents(arrangement)
    .map(Main.createLayoutCalculator(settings))
    .filter(F.isChanged())
    .map(createWindowScrollOffseter())
}

/**
 * TODO
 */
const isArrangementChanged = () => {
  // We will hold some local state in order to detect when a change of bounds
  // in some part of the arrangement has occured.
  let currBounds: null | Main.Arrangement = null

  return (maybeDiffBounds: Main.Arrangement): boolean => {
    if (!currBounds) {
      currBounds = maybeDiffBounds
      return true
    }
    // TODO We do not care if the popover xy is equal because we can reasonably
    // assume it may be getting animated into a previously calculated layout
    // position. However it would be reasonable to care if the popover's
    // dimensions change.
    // const { popover: ignore1, ...maybeDiffBoundsSansPopover } = maybeDiffBounds
    // const { popover: ignore2, ...currBoundsSansPopover } = currBounds
    const { ...maybeDiffBoundsSansPopover } = maybeDiffBounds
    const { ...currBoundsSansPopover } = currBounds
    if (F.isEqual(maybeDiffBoundsSansPopover, currBoundsSansPopover)) {
      return false
    } else {
      currBounds = maybeDiffBounds
      return true
    }
  }
}

/**
 * TODO
 */
const observeArrChangesByManualMeasure = (
  arrangement: Arrangement,
  intervalMs: number,
): Observable<Main.Arrangement> => {
  return Obs.periodic(intervalMs)
    .map(() => calcArrangementBounds(arrangement))
    .filter(isArrangementChanged())
}

/**
 * Like `observe` except with the added fact that it will also poll for
 * arrangement bound changes at the given interval.
 *
 * This allows reacting to layout changes that have no event correspondance.
 * For example async content that once loaded increases the size of Popover.
 */
const observeWithPolling = (
  settings: FortoSettings.SettingsUnchecked,
  arrangement: Arrangement,
  intervalMs: number,
): Observable<Main.Calculation> => {
  const eventedChanges = observeArrChangesByEvents(arrangement)
  const uneventedChanges = observeArrChangesByManualMeasure(
    arrangement,
    intervalMs,
  )

  return Obs.merge(eventedChanges, uneventedChanges)
    .map(Main.createLayoutCalculator(settings))
    .filter(F.isChanged())
    .map(createWindowScrollOffseter())
}

/**
 * Observe the arrangement for changes in bounds of any part and if changes
 * are detected then recalculate the layout. This does not actually execute
 * the layout changes, it merely provides what the latest coordinates of all
 * arrangement parts should be.
 *
 * If a pollIntervalMs setting is passed then the observable will also poll for
 * arrangement bound changes at the given interval. This allows reacting to
 * layout changes that have no event correspondance. For example async content
 * that once loaded increases the size of Popover.
 *
 * A pollIntervalMs of 0 has undefined behaviour.
 */
const observe = (
  settings: Settings,
  arrangement: Arrangement,
): Observable<Main.Calculation> => {
  const { pollIntervalMs, ...fortoSettings } = settings
  const stream = pollIntervalMs
    ? observeWithPolling(fortoSettings, arrangement, pollIntervalMs)
    : observeWithoutPolling(fortoSettings, arrangement)
  return stream
}

export { observe, observeWithPolling, observeWithoutPolling, Arrangement }
