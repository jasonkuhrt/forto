import assign from "object.assign"
import Dom from "../source/dom"
import Chai from "chai"
assign.shim()
const A = Chai.assert


const frame = document.createElement("div")
const target = document.createElement("div")
const popover = document.createElement("div")
const tip = document.createElement("div")

before(() => {
  document.body.querySelector("#mocha").remove()
  document.body.appendChild(frame)
  document.body.appendChild(target)
  document.body.appendChild(popover)
  document.body.appendChild(tip)
})

describe("dom", () => {
  Object.assign(frame.style, {
    width: "20px",
    height: "20px",
    position: "absolute",
    top: "0px",
    left: "0px"
  })
  Object.assign(target.style, {
    width: "10px",
    height: "20px",
    position: "absolute",
    top: "0px",
    left: "0px"
  })
  Object.assign(popover.style, {
    width: "4px",
    height: "4px",
    position: "absolute",
    top: "0px",
    left: "0px"
  })
  Object.assign(tip.style, {
    width: "0px",
    height: "0px",
    position: "absolute",
    top: "0px",
    left: "0px"
  })
  it("does not error out", () => {
    const layoutObservable = Dom.main(frame, target, popover, tip)
    // A.deepEqual(
    //   layout,
    //   { popover: { x: 10, y: 8 }, tip: { y: 10, x: 0 }}
    // )
  })
})
