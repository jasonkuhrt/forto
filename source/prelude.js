/* eslint-disable no-param-reassign */
const first = (x) => (
  x[0]
)

const mapObject = (object, f) => (
  Object
  .keys(object)
  .reduce((objectNew, key) => {
    objectNew[key] = f(object[key])
    return objectNew
  }, {})
)



export default {
  first,
  mapObject,
}

export {
  first,
  mapObject,
}
