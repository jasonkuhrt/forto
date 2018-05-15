/* eslint-disable */
import * as F from "ramda"
// import { Stream } from "most"
import * as FRP from "most"
import * as Dom from "../source/dom"
import * as Main from "../source/Main"
import * as H from "./Helpers"

FRP.Stream.prototype.collect = function(n) {
  return this.take(n).reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

FRP.Stream.prototype.collectAll = function() {
  return this.reduce((acc, x) => {
    acc.push(x)
    return acc
  }, [])
}

const insertTallerChild = (parent: HTMLElement): void => {
  parent.appendChild(
    H.makeDiv({
      id: "tallDiv",
      style: {
        width: "1px",
        height: parent.offsetHeight + 1000 + "px",
      },
    }),
  )
}

const arrangementStyles = {
  frame: {
    width: "100px",
    height: "100px",
    overflow: "auto",
  },
  target: {
    width: "10px",
    height: "10px",
  },
  popover: {
    width: "4px",
    height: "4px",
    position: "absolute",
    top: "0px",
    left: "0px",
  },
  tip: {
    width: "0px",
    height: "0px",
    position: "absolute",
    top: "0px",
    left: "0px",
  },
}

let arrangement: Dom.Arrangement = {
  target: H.makeDiv(),
  frame: H.makeDiv(),
  popover: H.makeDiv(),
  tip: H.makeDiv(),
}

document.body.appendChild(arrangement.frame)
document.body.appendChild(arrangement.popover)
document.body.appendChild(arrangement.tip)
arrangement.frame.appendChild(arrangement.target)
/* Force a scroll on frame */
insertTallerChild(arrangement.frame)

// Expose globals
window.arrangementStyles = arrangementStyles
window.arrangementStyles = arrangementStyles
window.F = F
window.Dom = Dom
window.FRP = FRP
window.H = H
