import * as FRP from "most"
import * as F from "ramda"
import * as Dom from "./source/Dom"

// Extend Most with a function to ease collection for result inspection

FRP.Stream.prototype.collect = function(n) {
  return this.take(n).reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

// General DOM helpers

type Attributes = {
  id?: string
  style?: object
}

const incWidth = (amount: number, el: HTMLElement): HTMLElement => {
  const currentWidth = parseInt(el.style.width, 10)
  el.style.width = `${currentWidth + amount}px`
  return el
}

const insertTallerChild = (parent: HTMLElement): void => {
  parent.appendChild(
    makeDiv({
      id: "tallDiv",
      style: {
        width: "1px",
        height: parent.offsetHeight + 1000 + "px",
      },
    }),
  )
}

const makeDiv = (attributes?: Attributes): HTMLElement => {
  const el = document.createElement("div")
  if (attributes) {
    const { style = {}, ...nonStyleAttributes } = attributes
    for (const [name, value] of F.toPairs(style)) {
      el.style[name] = value
    }
    Object.assign(el, nonStyleAttributes)
  }
  return el
}

const makePixel = () => {
  return makeDiv({
    style: {
      width: "1px",
      height: "1px",
    },
  })
}

const sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

const H = {
  makeDiv,
  makePixel,
  insertTallerChild,
  incWidth,
}

window.Dom = Dom
window.FRP = FRP
window.F = F
window.H = H
window.sleep = sleep
