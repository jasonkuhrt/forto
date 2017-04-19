/* eslint-disable no-param-reassign */
import isEqual from "lodash.isequal"


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
  isEqual,
}

export {
  first,
  mapObject,
  isEqual,
}
