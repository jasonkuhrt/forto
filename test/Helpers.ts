import * as F from "ramda"

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

export { makeDiv, makePixel, insertTallerChild, incWidth }
