import Main from "./Main"

const foobar = (frameEl, targetEl, popoverEl, tipEl) => {
  const frameBounds = frameEl.getBoundingClientRect()
  const targetBounds = targetEl.getBoundingClientRect()
  const popoverSize = popoverEl.getBoundingClientRect() // just need w/h
  const tipSize = tipEl.getBoundingClientRect() // just need w/h
  // getBoundingClientRect considers the rendered size e.g. if there is a
  // scale 0.5 then we will know the resulting size.
  const layout = Main.calcLayout(frameBounds, targetBounds, popoverSize, tipSize)
  return layout
}

export default {
  foobar,
}
export {
  foobar,
}
