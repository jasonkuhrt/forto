const makeDiv = (style?: object): HTMLElement => {
  const el = document.createElement("div")
  if (style) {
    Object.assign(el.style, style)
  }
  return el
}

export { makeDiv }
