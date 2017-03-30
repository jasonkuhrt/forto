import assign from "object.assign"
import Dom from "../source/dom"
assign.shim()


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
    width: "400px",
    height: "400px",
  })
  Object.assign(target.style, {
    width: "10px",
    height: "400px",
  })
  Object.assign(popover.style, {
    width: "4px",
    height: "4px",
  })
  it("fails", () => {
    const layout = Dom.foobar(frame, target, popover, tip)
    console.log(layout)
  })
})
