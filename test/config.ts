/* eslint-disable */
import * as F from "ramda"
import * as FRP from "most"
import * as Dom from "../source/dom"
import * as Main from "../source/Main"
import * as TH from "./Helpers"

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

const temporary = TH.makeDiv()
let arrangement: Record<keyof Main.Arrangement, HTMLElement> = {
  target: TH.makeDiv(),
  frame: TH.makeDiv(),
  popover: TH.makeDiv(),
  tip: TH.makeDiv(),
}

temporary.id = "temporary"
document.body.appendChild(temporary)

document.body.appendChild(arrangement.frame)
document.body.appendChild(arrangement.popover)
document.body.appendChild(arrangement.tip)
arrangement.frame.appendChild(arrangement.target)

// /* Force a scroll on frame */
const divThatIsTall = TH.makeDiv()
divThatIsTall.id = "tallDiv"

Object.assign(divThatIsTall.style, {
  width: "1px",
  height: arrangement.frame.offsetHeight + 1000 + "px",
})

arrangement.frame.appendChild(divThatIsTall)

// Expose globals
window.arrangementStyles = arrangementStyles
window.temporary = temporary
window.arrangementStyles = arrangementStyles
window.F = F
window.Dom = Dom
window.FRP = FRP
window.H = TH
