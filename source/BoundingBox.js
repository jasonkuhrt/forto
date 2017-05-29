const make = (width, height) => ({
  top: 0,
  bottom: height,
  left: 0,
  right: width,
  width,
  height,
})

const translate = (x, y, box) =>
  Object.assign({}, box, {
    top: box.top + y,
    bottom: box.bottom + y,
    left: box.left + x,
    right: box.right + x,
  })

export { make, translate }
