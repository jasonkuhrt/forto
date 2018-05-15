import * as F from "ramda"

type Attributes = {
  id?: string
  style?: object
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

export { makeDiv }
