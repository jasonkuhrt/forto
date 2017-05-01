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

const isExists = (x) => (
  x === null || x === undefined
)

const defaultsTo = (x, o) => (
  isExists(x) ? x : o
)



export default {
  defaultsTo,
  first,
  mapObject,
  isEqual,
  isExists,
}

export {
  defaultsTo,
  first,
  mapObject,
  isEqual,
  isExists,
}
